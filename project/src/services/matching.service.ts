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
        'glomerulonephritis', 'renal infection', 'nephrotoxic', 'ethylene glycol', 'lithium'
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
    const viability_window_hours = donor.cold_ischemia_time_hours ?? this.ORGAN_VIABILITY_HOURS[organ];

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
      viability_window_hours,
    };
  }

  private calculateHeartMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'heart';

    // HLA compatibility (25 points)
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

    // HLA compatibility (10 points - less critical)
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

    // HLA compatibility (35 points - most critical)
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

  private calculateHLACompatibility(donorHLA: Donor['hla_typing'], recipientHLA: Recipient['hla_typing'], organ: OrganType): number {
    const importantHLA = this.HLA_IMPORTANCE[organ];
    let matches = 0;
    let total = 0;

    for (const hlaType of importantHLA) {
      const donorAlleles = donorHLA[hlaType] || [];
      const recipientAlleles = recipientHLA[hlaType] || [];
      
      // Assuming 2 alleles per HLA type for a simple model
      total += 2; 

      if (donorAlleles.length > 0 && recipientAlleles.length > 0) {
        if (recipientAlleles.includes(donorAlleles[0])) {
          matches++;
        }
        if (donorAlleles.length > 1 && recipientAlleles.includes(donorAlleles[1])) {
          matches++;
        }
      }
    }

    return total > 0 ? matches / total : 1; // Return 1 if no important HLA types
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
    
    // Age risk
    if (donor.age > 60 || recipient.age > 65) riskFactors += 15;
    if (Math.abs(donor.age - recipient.age) > 25) riskFactors += 10;
    
    // Match score risk
    if (matchScore < 50) riskFactors += 20;
    else if (matchScore < 70) riskFactors += 10;
    
    // Organ-specific risks
    switch (organ) {
      case 'heart':
        if (recipient.unos_status === '1A') riskFactors += 5; // High urgency = higher risk
        break;
      case 'liver':
        if (recipient.meld_score && recipient.meld_score > 25) riskFactors += 10;
        break;
    }

    // Medical history risk (simplified)
    if (donor.medical_history?.includes('diabetes') || recipient.medical_history?.includes('diabetes')) {
      riskFactors += 5;
    }

    const risk_percentage = Math.min(riskFactors, 80); // Cap at 80%
    
    let risk_level: 'low' | 'medium' | 'high';
    if (risk_percentage < 25) risk_level = 'low';
    else if (risk_percentage < 50) risk_level = 'medium';
    else risk_level = 'high';

    return { risk_level, risk_percentage };
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
}

export const matchingService = new MatchingService();