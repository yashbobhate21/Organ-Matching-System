import { Donor, Recipient, MatchResult, BloodType, OrganType } from '../types';

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

  async findMatches(donor: Donor, recipients: Recipient[]): Promise<MatchResult[]> {
    if (!donor.organs_available || donor.organs_available.length === 0) {
      return [];
    }
    
    const organ = donor.organs_available[0];
    const matches: MatchResult[] = [];

    const compatibleRecipients = recipients.filter(r => 
      r.organ_needed === organ && 
      r.status === 'active' &&
      this.isBloodCompatible(donor.blood_type, r.blood_type)
    );

    for (const recipient of compatibleRecipients) {
      const matchResult = await this.calculateMatch(donor, recipient, organ);
      if (matchResult.match_score > 30) { // Minimum viable match threshold
        matches.push(matchResult);
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

  private async calculateMatch(donor: Donor, recipient: Recipient, organ: OrganType): Promise<MatchResult> {
    let matchScore = 0;
    const compatibility_factors = {
      blood_compatibility: this.isBloodCompatible(donor.blood_type, recipient.blood_type),
      hla_compatibility: 0,
      age_compatibility: false,
      size_compatibility: false,
      urgency_bonus: Math.min(recipient.urgency_score, 10),
      time_on_list_bonus: 0,
    };

    // --- Common Factors ---

    // Blood type compatibility (30 points max)
    if (compatibility_factors.blood_compatibility) {
      matchScore += 30;
    }

    // Urgency bonus (10 points max)
    matchScore += compatibility_factors.urgency_bonus;

    // Time on list bonus (5 points max)
    const daysOnList = Math.floor((Date.now() - new Date(recipient.time_on_list).getTime()) / (1000 * 60 * 60 * 24));
    const timeBonus = Math.min(daysOnList / 100, 5); // 1 point per 100 days, max 5
    compatibility_factors.time_on_list_bonus = timeBonus;
    matchScore += timeBonus;

    // --- Organ-Specific Factors ---
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

    // Age compatibility (15 points)
    const ageCompatible = this.isAgeCompatible(donor.age, recipient.age, 15);
    factors.age_compatibility = ageCompatible;
    if (ageCompatible) score += 15;

    // Size compatibility (15 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.7, 1.3);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 15;

    return score;
  }

  private calculateLiverMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'liver';

    // HLA compatibility (10 points - less critical for liver)
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ);
    factors.hla_compatibility = hlaScore;
    score += hlaScore * 10;

    // Age compatibility (15 points)
    const ageCompatible = this.isAgeCompatible(donor.age, recipient.age, 20);
    factors.age_compatibility = ageCompatible;
    if (ageCompatible) score += 15;

    // Size compatibility (15 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.6, 1.5);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 15;
    
    // MELD score bonus (15 points)
    if (recipient.meld_score) {
        score += Math.min(recipient.meld_score / 40 * 15, 15);
    }

    return score;
  }

  private calculateKidneyMatchFactors(donor: Donor, recipient: Recipient, factors: MatchResult['compatibility_factors']): number {
    let score = 0;
    const organ: OrganType = 'kidney';

    // HLA compatibility (30 points - most critical for kidney)
    const hlaScore = this.calculateHLACompatibility(donor.hla_typing, recipient.hla_typing, organ);
    factors.hla_compatibility = hlaScore;
    score += hlaScore * 30;

    // Age compatibility (10 points)
    const ageCompatible = this.isAgeCompatible(donor.age, recipient.age, 25);
    factors.age_compatibility = ageCompatible;
    if (ageCompatible) score += 10;

    // Size compatibility (10 points)
    const sizeCompatible = this.isSizeCompatible(donor, recipient, 0.5, 2.0);
    factors.size_compatibility = sizeCompatible;
    if (sizeCompatible) score += 10;

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

  private isAgeCompatible(donorAge: number, recipientAge: number, maxDiff: number): boolean {
    return Math.abs(donorAge - recipientAge) <= maxDiff;
  }

  private isSizeCompatible(donor: Donor, recipient: Recipient, minRatio: number, maxRatio: number): boolean {
    if (!donor.weight_kg || !recipient.weight_kg) return true; // Assume compatible if data missing

    const weightRatio = donor.weight_kg / recipient.weight_kg;
    return weightRatio >= minRatio && weightRatio <= maxRatio;
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