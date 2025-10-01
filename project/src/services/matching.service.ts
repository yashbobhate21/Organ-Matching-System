import { Donor, Recipient, MatchResult, BloodType, OrganType, Gender } from '../types';

class MatchingService {
  private readonly BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal donor
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'], // Universal recipient
  };

  private readonly ORGAN_VIABILITY_HOURS = {
    kidney: 24,
    heart: 6,
    liver: 12,
  };

  private readonly HLA_IMPORTANCE: Record<OrganType, (keyof Donor['hla_typing'])[]> = {
    kidney: ['HLA-A', 'HLA-B', 'HLA-DR'], // Most critical for kidney
    liver: ['HLA-DR'], // Less critical for liver
    heart: ['HLA-A', 'HLA-B', 'HLA-DR'],
  };

  // New: organ-specific per-locus weights (sum to ~1 per organ)
  private readonly HLA_LOCUS_WEIGHTS: Record<OrganType, Record<string, number>> = {
    kidney: { 'HLA-DR': 0.5, 'HLA-B': 0.3, 'HLA-A': 0.2 },
    heart:  { 'HLA-DR': 0.4, 'HLA-B': 0.35, 'HLA-A': 0.25 },
    liver:  { 'HLA-DR': 1.0 },
  };

  private readonly AGE_RULES = {
    kidney: {
      donor: { min: 18, max: 70 },
      recipient: { max: 75 },
      maxDiff: 20,
    },
    heart: {
      donor: { max: 65 },
      recipient: { max: 70 },
      maxDiff: 10,
    },
    liver: {
      donor: { min: 18, max: 70 },
      recipient: { max: 75 },
      maxDiff: 25 },
  };

  private readonly MEDICAL_EXCLUSIONS = {
    donor: {
      general: ['infection', 'malignancy', 'psychiatric illness', 'alcohol abuse', 'drug abuse'],
      kidney: [
        'kidney disease', 'low gfr', 'polycystic kidney disease', 'diabetes with organ damage', 
        'hypertension', 'proteinuria', 'hematuria', 'kidney stone', 
        'glomerulonephritis', 'renal infection', 'nephrotoxic', 'ethylene glycol', 'lithium', 'diabetes'
      ],
      heart: [
        'coronary artery disease', 'myocardial infarction', 'myocardial infarction', 'heart attack', 
        'valvular disease', 'cardiomyopathy', 'congenital heart disease', 
        'malignant arrhythmias', 'pulmonary hypertension', 'chest trauma', 'heart trauma', 'diabetes'
      ],
      liver: [
        'cirrhosis', 'chronic hepatitis with fibrosis', 'fatty liver >30%', 'alcoholic liver disease', 
        'biliary disease', 'wilson’s disease', 'hemochromatosis', 'alpha-1 antitrypsin deficiency', 
        'portal hypertension', 'liver failure', 'hepatotoxic', 'paracetamol overdose', 'hepatitis b', 'hepatitis c'
      ],
    },
    recipient: {
      general: ['infection', 'malignancy', 'uncontrolled psychiatric illness', 'active alcohol abuse', 'drug abuse', 'non-compliance with therapy'],
      kidney: [
        'cancer', 'cardiovascular disease', 'peripheral vascular disease', 
        'neurological impairment', 'non-compliance with dialysis', 'life expectancy <2 years'
      ],
      heart: [
        'irreversible pulmonary hypertension', 'irreversible kidney disease', 
        'irreversible liver disease', 'peripheral vascular disease', 'advanced neurological deficits'
      ],
      liver: [
        'uncontrolled sepsis', 'extrahepatic malignancy', 'heart disease', 'lung disease', 
        'hiv', 'persistent alcohol/drug abuse', 'irreversible brain injury'
      ],
    }
  };

  async findMatches(donor: Donor, recipients: Recipient[]): Promise<MatchResult[]> {
    if (!donor.organs_available || donor.organs_available.length === 0) {
      return [];
    }
    
    const organ = donor.organs_available[0];

    // Real-time viability check only if an explicit CIT was provided
    if (donor.cold_ischemia_time_hours != null && !this.isOrganViableNow(donor, organ)) {
      console.log(`[Debug] Donor ${donor.id} ${organ} expired (CIT window elapsed).`);
      return [];
    }
    
    // 1. Check donor eligibility
    const donorEligibility = this.isDonorEligible(donor, organ);
    if (!donorEligibility.eligible) {
      throw new Error(`Donor is not eligible for ${organ} donation. Reason: ${donorEligibility.reason}`);
    }

    const matches: MatchResult[] = [];

    // 2. Filter recipients based on basic compatibility and eligibility
    const compatibleRecipients = recipients.filter(r => {
      if (r.organ_needed !== organ) {
        // This case should ideally not happen if recipients are pre-filtered
        return false;
      }
      if (r.status !== 'active') {
        console.log(`[Debug] Filtering out recipient ${r.id}: Inactive status.`);
        return false;
      }
      if (!this.isBloodCompatible(donor.blood_type, r.blood_type)) {
        console.log(`[Debug] Filtering out recipient ${r.id}: Incompatible blood type.`);
        return false;
      }
      
      const recipientEligibility = this.isRecipientEligible(r, organ);
      if (!recipientEligibility.eligible) {
        console.log(`[Debug] Filtering out recipient ${r.id}: Ineligible. Reason: ${recipientEligibility.reason}`);
        return false;
      }
      
      // New: early reject if donor has antigens in recipient's unacceptable list (if provided)
      if (this.hasUnacceptableAntigenConflict(donor.hla_typing, r, organ)) {
        console.log(`[Debug] Filtering out recipient ${r.id}: Unacceptable antigen conflict.`);
        return false;
      }

      const ageDiff = Math.abs(donor.age - r.age);
      if (ageDiff > this.AGE_RULES[organ].maxDiff) {
        console.log(`[Debug] Filtering out recipient ${r.id}: Age difference (${ageDiff}) exceeds limit of ${this.AGE_RULES[organ].maxDiff}.`);
        return false;
      }
      
      return true;
    });

    for (const recipient of compatibleRecipients) {
      try {
        const matchResult = await this.calculateMatch(donor, recipient, organ);
        if (matchResult.match_score > 30) { // Minimum viable match threshold
          matches.push(matchResult);
        }
      } catch (error) {
        console.error(`[Error] Failed to calculate match for donor ${donor.id} and recipient ${recipient.id}:`, error);
      }
    }

    // Sort by match score and urgency
    return matches.sort((a, b) => {
      if (a.urgency_level !== b.urgency_level) {
        const urgencyOrder = { critical: 3, urgent: 2, routine: 1 };
        return urgencyOrder[b.urgency_level] - urgencyOrder[a.urgency_level];
      }
      return b.match_score - a.match_score;
    });
  }

  private isDonorEligible(donor: Donor, organ: OrganType): { eligible: boolean; reason: string | null } {
    const history = (donor.medical_history + ' ' + donor.cause_of_death).toLowerCase();
    const generalExclusions = this.MEDICAL_EXCLUSIONS.donor.general;
    const organExclusions = this.MEDICAL_EXCLUSIONS.donor[organ];

    // Age check
    const ageRule = this.AGE_RULES[organ].donor;
    if ((('min' in ageRule) && typeof ageRule.min === 'number' && donor.age < ageRule.min) || (('max' in ageRule) && typeof ageRule.max === 'number' && donor.age > ageRule.max)) {
      return { eligible: false, reason: `Donor age (${donor.age}) is outside the acceptable range for ${organ} donation.` };
    }

    for (const keyword of [...generalExclusions, ...organExclusions]) {
      if (history.includes(keyword)) {
        return { eligible: false, reason: `Medical history/cause of death includes exclusion criteria: "${keyword}".` };
      }
    }
    return { eligible: true, reason: null };
  }

  private isRecipientEligible(recipient: Recipient, organ: OrganType): { eligible: boolean; reason: string | null } {
    const history = recipient.medical_history.toLowerCase();
    const generalExclusions = this.MEDICAL_EXCLUSIONS.recipient.general;
    const organExclusions = this.MEDICAL_EXCLUSIONS.recipient[organ];

    // Age check
    const ageRule = this.AGE_RULES[organ].recipient;
    if (ageRule.max && recipient.age > ageRule.max) {
      return { eligible: false, reason: `Recipient age (${recipient.age}) is outside the acceptable range for ${organ} transplantation.` };
    }

    for (const keyword of [...generalExclusions, ...organExclusions]) {
      if (history.includes(keyword)) {
        return { eligible: false, reason: `Medical history includes exclusion criteria: "${keyword}".` };
      }
    }
    return { eligible: true, reason: null };
  }

  private async calculateMatch(donor: Donor, recipient: Recipient, organ: OrganType): Promise<MatchResult> {
    let matchScore = 0;
    const compatibility_factors = {
      blood_compatibility: this.isBloodCompatible(donor.blood_type, recipient.blood_type),
      hla_compatibility: 0,
      age_compatibility: false,
      size_compatibility: false,
      gender_compatibility: false,
      urgency_bonus: Math.min(recipient.urgency_score, 10),
    };

    // --- Common Factors (45 points total) ---

    // Blood type compatibility (30 points)
    if (compatibility_factors.blood_compatibility) {
      matchScore += 30;
    }

    // Urgency bonus (15 points)
    const urgencyBonus = Math.min(recipient.urgency_score / 10 * 15, 15);
    compatibility_factors.urgency_bonus = urgencyBonus;
    matchScore += urgencyBonus;

    // --- Organ-Specific Factors (55 points total) ---
    let organSpecificScore = 0;
    switch (organ) {
      case 'heart':
        organSpecificScore = this.calculateHeartMatchFactors(donor, recipient, compatibility_factors);
        break;
      case 'liver':
        organSpecificScore = this.calculateLiverMatchFactors(donor, recipient, compatibility_factors);
        break;
      case 'kidney':
        organSpecificScore = this.calculateKidneyMatchFactors(donor, recipient, compatibility_factors);
        break;
    }
    matchScore += organSpecificScore;

    // --- Final Calculations ---
    const { risk_level, risk_percentage } = this.calculateRisk(donor, recipient, organ, matchScore);
    const urgency_level = this.determineUrgencyLevel(recipient, organ);

    // Remaining viability time (in hours, floored to 1 decimal)
    const remaining_viability_hours = this.getRemainingIschemiaHours(donor, organ);

    console.log(`[Debug] Match score for recipient ${recipient.id}: ${matchScore.toFixed(2)}`, {
      common: (30 * (compatibility_factors.blood_compatibility ? 1:0)) + compatibility_factors.urgency_bonus,
      organSpecific: organSpecificScore,
      total: matchScore,
      factors: compatibility_factors
    });

    return {
      recipient,
      match_score: Math.round(matchScore * 100) / 100,
      risk_level,
      risk_percentage,
      urgency_level,
      compatibility_factors,
      // expose remaining time instead of static window
      viability_window_hours: remaining_viability_hours,
      viability_window: remaining_viability_hours,
      // keep this aligned with remaining time so UI reflects real-time
      cold_ischemia_time: remaining_viability_hours,
    };
  }

  private calculateHeartMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'heart';

    // HLA compatibility (25 points) — weighted per-locus, antigen-level
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ);
    factors.hla_compatibility = hlaScore;
    score += hlaScore * 25;

    // Age compatibility is now a hard rule, not scored.
    factors.age_compatibility = true;

    // Size compatibility (25 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.7, 1.3);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 25;

    // Gender compatibility (5 points)
    const genderCompatible = this.isGenderCompatible(donor.gender, recipient.gender, organ);
    factors.gender_compatibility = genderCompatible;
    if (genderCompatible) score += 5;

    return score;
  }

  private calculateLiverMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'liver';

    // MELD score bonus (20 points)
    if (recipient.meld_score) {
        score += Math.min(recipient.meld_score / 40 * 20, 20);
    }

    // HLA compatibility (10 points - less critical) — weighted per-locus, antigen-level
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ);
    factors.hla_compatibility = hlaScore;
    score += hlaScore * 10;

    // Age compatibility is now a hard rule, not scored.
    factors.age_compatibility = true;

    // Size compatibility (20 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.6, 1.5);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 20;
    
    // Gender compatibility (5 points)
    const genderCompatible = this.isGenderCompatible(donor.gender, recipient.gender, organ);
    factors.gender_compatibility = genderCompatible;
    if (genderCompatible) score += 5;

    return score;
  }

  private calculateKidneyMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'kidney';

    // HLA compatibility (35 points - most critical) — weighted per-locus, antigen-level
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ);
    factors.hla_compatibility = hlaScore;
    score += hlaScore * 35;

    // Age compatibility is now a hard rule, not scored.
    factors.age_compatibility = true;

    // Size compatibility (15 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.5, 2.0);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 15;

    // Gender compatibility (5 points)
    const genderCompatible = this.isGenderCompatible(donor.gender, recipient.gender, organ);
    factors.gender_compatibility = genderCompatible;
    if (genderCompatible) score += 5;

    return score;
  }

  private isBloodCompatible(donorType: BloodType, recipientType: BloodType): boolean {
    return this.BLOOD_COMPATIBILITY[donorType].includes(recipientType);
  }

  // New: normalize an allele string to antigen-level (e.g., A*02:01 -> A2, B*07:02 -> B7, DRB1*15:01 -> DR15)
  private normalizeAllele(allele: string, locusKey: string): string {
    if (!allele) return '';
    const lc = locusKey.toUpperCase();
    const a = allele.toUpperCase().trim();

    // Extract the two-digit group after '*'
    const match = a.match(/\*?(\d{2})/); // captures 02 from A*02:01, 15 from DRB1*15:01
    const twoDigit = match ? match[1] : null;

    if (lc.includes('HLA-A')) {
      return twoDigit ? `A${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '');
    }
    if (lc.includes('HLA-B')) {
      return twoDigit ? `B${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '');
    }
    if (lc.includes('HLA-DR')) {
      return twoDigit ? `DR${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '').replace(/^DRB1\*/, 'DR');
    }
    if (lc.includes('HLA-C')) {
      return twoDigit ? `C${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '');
    }
    if (lc.includes('HLA-DQ')) {
      return twoDigit ? `DQ${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '');
    }
    if (lc.includes('HLA-DP')) {
      return twoDigit ? `DP${parseInt(twoDigit, 10)}` : a.replace(/^HLA-/, '');
    }
    // Fallback: return raw without HLA- prefix
    return a.replace(/^HLA-/, '');
  }

  // New: convert allele list to a set of antigen-level strings for a locus
  private alleleListToAntigens(alleles: string[] | undefined, locusKey: string): Set<string> {
    if (!Array.isArray(alleles) || alleles.length === 0) return new Set();
    return new Set(
      alleles
        .filter(v => typeof v === 'string' && v.trim().length > 0)
        .map(a => this.normalizeAllele(a, locusKey))
    );
  }

  // New: compute ratio of matches at a single locus (0..1) allowing 0/1/2 matches
  private computeLocusMatchRatio(donorAlleles: string[] | undefined, recipientAlleles: string[] | undefined, locusKey: string): number {
    const donorAntigens = this.alleleListToAntigens(donorAlleles, locusKey);
    const recipientAntigens = this.alleleListToAntigens(recipientAlleles, locusKey);
    if (donorAntigens.size === 0 || recipientAntigens.size === 0) return -1; // mark as unavailable

    let matches = 0;
    donorAntigens.forEach(a => {
      if (recipientAntigens.has(a)) matches++;
    });
    const denom = Math.max(1, Math.min(2, donorAntigens.size)); // assume up to 2 alleles per locus
    return Math.min(1, matches / denom);
  }

  // Improved: antigen-level, weighted per-locus, robust to missing data
  private calculateHLACompatibility(donorHLA: Donor['hla_typing'], recipientHLA: Recipient['hla_typing'], organ: OrganType): number {
    const weights = this.HLA_LOCUS_WEIGHTS[organ] || {};
    let weightedSum = 0;
    let weightsUsed = 0;

    Object.entries(weights).forEach(([locusKey, w]) => {
      const donorAlleles: string[] = (donorHLA?.[locusKey] as string[]) || [];
      const recipientAlleles: string[] = (recipientHLA?.[locusKey] as string[]) || [];

      const locusRatio = this.computeLocusMatchRatio(donorAlleles, recipientAlleles, locusKey);
      if (locusRatio >= 0) {
        weightedSum += locusRatio * w;
        weightsUsed += w;
      }
    });

    // If no locus had data on both sides, default neutral (1.0)
    if (weightsUsed === 0) return 1;
    // Normalize to the sum of weights actually used
    return Math.min(1, Math.max(0, weightedSum / weightsUsed));
  }

  // New: optional virtual crossmatch using recipient unacceptable antigens (if available)
  // Supported sources (all optional): recipient.unacceptable_antigens (string[]), recipient.hla_typing.unacceptable_antigens (string[])
  private hasUnacceptableAntigenConflict(donorHLA: Donor['hla_typing'], recipient: Recipient, organ: OrganType): boolean {
    const importantLoci = this.HLA_IMPORTANCE[organ] as string[];

    // Collect donor antigens across important loci
    const donorAntigens = new Set<string>();
    importantLoci.forEach((locusKey) => {
      const list = (donorHLA?.[locusKey] as string[]) || [];
      this.alleleListToAntigens(list, locusKey).forEach(a => donorAntigens.add(a));
    });

    // Get unacceptable antigens (any field, optional)
    const unacceptableRaw: unknown =
      (recipient as any).unacceptable_antigens ||
      (recipient.hla_typing && (recipient.hla_typing as any).unacceptable_antigens) ||
      [];

    const unacceptable: string[] = Array.isArray(unacceptableRaw) ? unacceptableRaw : [];

    // Normalize unacceptable to antigen-level too (use generic locusKey matching)
    const unacceptableAntigens = new Set<string>(
      unacceptable
        .filter(v => typeof v === 'string' && v.trim().length > 0)
        .map(a => {
          const upper = a.toUpperCase().trim();
          // Try infer locus from the leading part to normalize consistently
          const inferredLocus =
            upper.startsWith('A') ? 'HLA-A' :
            upper.startsWith('B') ? 'HLA-B' :
            upper.startsWith('C') ? 'HLA-C' :
            upper.startsWith('DQ') ? 'HLA-DQ' :
            upper.startsWith('DP') ? 'HLA-DP' :
            upper.startsWith('DR') || upper.startsWith('DRB1') ? 'HLA-DR' : 'HLA-A';
          return this.normalizeAllele(upper, inferredLocus);
        })
    );

    if (unacceptableAntigens.size === 0) return false;

    for (const a of donorAntigens) {
      if (unacceptableAntigens.has(a)) {
        return true;
      }
    }
    return false;
  }

  private isSizeCompatible(donor: Donor, recipient: Recipient, minRatio: number, maxRatio: number): boolean {
    if (!donor.weight_kg || !recipient.weight_kg) return true; // Assume compatible if data missing

    const weightRatio = donor.weight_kg / recipient.weight_kg;
    return weightRatio >= minRatio && weightRatio <= maxRatio;
  }

  private isGenderCompatible(donorGender: Gender, recipientGender: Gender, organ: OrganType): boolean {
    if (donorGender === recipientGender) {
      return true;
    }
    // For hearts, female-to-male is acceptable, but male-to-female is less ideal.
    if (organ === 'heart' && donorGender === 'female' && recipientGender === 'male') {
      return true;
    }
    // For other organs, we only give a bonus for same-gender, so this function
    // returning false for different genders is the intended behavior for the bonus logic.
    return false;
  }

  private calculateRisk(donor: Donor, recipient: Recipient, organ: OrganType, matchScore: number): { risk_level: 'low' | 'medium' | 'high', risk_percentage: number } {
    let riskFactors = 0;

    // 1) Age related risk (unchanged)
    if (donor.age > 60 || recipient.age > 65) riskFactors += 15;
    if (Math.abs(donor.age - recipient.age) > 25) riskFactors += 10;

    // 2) Match-score related risk (keep simple steps)
    if (matchScore < 50) riskFactors += 20;
    else if (matchScore < 70) riskFactors += 10;

    // 3) Organ-specific urgency risks (unchanged)
    switch (organ) {
      case 'heart':
        if (recipient.unos_status === '1A') riskFactors += 5;
        break;
      case 'liver':
        if (recipient.meld_score && recipient.meld_score > 25) riskFactors += 10;
        break;
    }

    // 4) HLA mismatch penalty: use existing HLA calculation (0..1 match -> 1..0 mismatch)
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ); // 0..1
    const hlaMismatch = 1 - hlaScore; // 0..1
    const hlaPenaltyMax = organ === 'kidney' ? 20 : organ === 'heart' ? 15 : 8;
    riskFactors += hlaMismatch * hlaPenaltyMax;

    // 5) Size mismatch penalty: outside organ-specific bounds adds a small penalty
    const { minRatio, maxRatio } = this.getSizeBounds(organ);
    if (donor.weight_kg && recipient.weight_kg) {
      const ratio = donor.weight_kg / recipient.weight_kg;
      if (ratio < minRatio || ratio > maxRatio) {
        riskFactors += 10;
      }
    }

    // 6) Cold ischemia time penalty: only apply when explicit CIT is set
    if (donor.cold_ischemia_time_hours != null) {
      const windowHrs = donor.cold_ischemia_time_hours;
      const startAt = this.getIschemiaStartAt(donor);
      const elapsedHrs = this.getElapsedHoursSince(startAt);
      if (elapsedHrs > windowHrs) {
        riskFactors += 20; // exceeded window
      } else {
        riskFactors += Math.min(8, (elapsedHrs / windowHrs) * 8);
      }
    }

    // 7) Comorbidity penalty from free-text history (replaces the old diabetes-only rule)
    riskFactors += this.getComorbidityPenalty(donor.medical_history, recipient.medical_history);

    // Cap and map to level (unchanged thresholds, cap at 80)
    const risk_percentage = Math.min(riskFactors, 80);
    let risk_level: 'low' | 'medium' | 'high';
    if (risk_percentage < 25) risk_level = 'low';
    else if (risk_percentage < 50) risk_level = 'medium';
    else risk_level = 'high';

    return { risk_level, risk_percentage };
  }

  // Small helper to reuse the same bounds you apply during organ-specific scoring
  private getSizeBounds(organ: OrganType): { minRatio: number; maxRatio: number } {
    switch (organ) {
      case 'heart': return { minRatio: 0.7, maxRatio: 1.3 };
      case 'liver': return { minRatio: 0.6, maxRatio: 1.5 };
      case 'kidney': return { minRatio: 0.5, maxRatio: 2.0 };
      default: return { minRatio: 0.7, maxRatio: 1.3 };
    }
  }

  // Lightweight comorbidity parser to add small penalties if keywords appear
  private getComorbidityPenalty(donorHistory: string, recipientHistory: string): number {
    const text = `${donorHistory || ''} ${recipientHistory || ''}`.toLowerCase();

    const buckets: { keywords: string[]; penalty: number }[] = [
      { keywords: ['diabetes'], penalty: 3 },
      { keywords: ['hypertension', 'pulmonary hypertension'], penalty: 3 },
      { keywords: ['coronary artery disease', 'cad', 'myocardial infarction', 'heart attack'], penalty: 4 },
      { keywords: ['infection', 'sepsis'], penalty: 4 },
      { keywords: ['malignancy', 'cancer'], penalty: 4 },
      { keywords: ['smoker', 'smoking', 'tobacco'], penalty: 2 },
      { keywords: ['alcohol abuse', 'drug abuse'], penalty: 2 },
    ];

    let penalty = 0;
    for (const bucket of buckets) {
      if (bucket.keywords.some(k => text.includes(k))) {
        penalty += bucket.penalty;
      }
    }
    // keep comorbidity influence modest
    return Math.min(penalty, 15);
  }

  private determineUrgencyLevel(recipient: Recipient, organ: OrganType): 'routine' | 'urgent' | 'critical' {
    // UNOS Status priority (Heart/Liver)
    if (organ === 'heart' || organ === 'liver') {
        if (recipient.unos_status === '1A') return 'critical';
        if (recipient.unos_status === '1B') return 'urgent';
    }

    // MELD score priority (Liver)
    if (organ === 'liver' && recipient.meld_score) {
      if (recipient.meld_score >= 30) return 'critical';
      if (recipient.meld_score >= 20) return 'urgent';
    }

    // General urgency score
    if (recipient.urgency_score >= 8) return 'critical';
    if (recipient.urgency_score >= 5) return 'urgent';

    return 'routine';
  }

  // ==== New helpers for real-time cold ischemia handling ====

  // Prefer explicit ischemia_start_at; else if CIT provided, use updated_at as start; fallback to created_at
  private getIschemiaStartAt(donor: Donor): string | undefined {
    const explicit = (donor as any).ischemia_start_at as string | undefined;
    if (explicit) return explicit;
    if (donor.cold_ischemia_time_hours != null) {
      return ((donor as any).updated_at as string | undefined) || (donor as any).created_at;
    }
    return (donor as any).created_at;
  }

  // Hours elapsed since ISO timestamp (fractional hours)
  private getElapsedHoursSince(dateIso: string | undefined | null): number {
    if (!dateIso) return 0;
    const start = new Date(dateIso).getTime();
    const now = Date.now();
    return Math.max(0, (now - start) / (1000 * 60 * 60));
  }

  // Limit in hours for this donor/organ
  private getIschemiaLimitHours(donor: Donor, organ: OrganType): number {
    return donor.cold_ischemia_time_hours ?? this.ORGAN_VIABILITY_HOURS[organ];
    }

  // Remaining hours (>= 0) in the ischemia window
  private getRemainingIschemiaHours(donor: Donor, organ: OrganType): number {
    const limit = this.getIschemiaLimitHours(donor, organ);
    // If no explicit CIT was set, show default static window (no countdown)
    if (donor.cold_ischemia_time_hours == null) {
      return limit;
    }
    const startAt = this.getIschemiaStartAt(donor);
    const elapsed = this.getElapsedHoursSince(startAt);
    const remaining = Math.max(0, limit - elapsed);
    return Math.round(remaining * 10) / 10;
  }

  // True if ischemia window not yet elapsed
  private isOrganViableNow(donor: Donor, organ: OrganType): boolean {
    return this.getRemainingIschemiaHours(donor, organ) > 0;
  }
}

export const matchingService = new MatchingService();