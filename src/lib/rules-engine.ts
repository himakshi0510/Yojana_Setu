import { CasteCategory, SchemeCategory, SchemeOrigin } from '@prisma/client';

export interface UserProfileData {
  state: string;
  district: string;
  age: number;
  gender: string;
  occupation: string;
  annualIncome: number;
  casteCategory: CasteCategory;
  landHoldingAcres: number;
  isStudent: boolean;
  isSpeciallyAbled: boolean;
  isSeniorCitizen?: boolean;
}

export interface EligibilityRuleData {
  id: string;
  schemeId: string;
  minAge?: number | null;
  maxAge?: number | null;
  maxIncome?: number | null;
  allowedGenders: string[];
  allowedOccupations: string[];
  allowedCategories: string[];
  maxLandAcres?: number | null;
  requiresStudent?: boolean | null;
  requiresSpeciallyAbled?: boolean | null;
}

export interface SchemeDocumentData {
  id: string;
  schemeId: string;
  documentName: string;
  isMandatory: boolean;
}

export interface SchemeWithRules {
  id: string;
  title: string;
  slug: string;
  ministry: string;
  department: string;
  description: string;
  benefitAmountText: string;
  annualValueEstimate: number;
  origin: SchemeOrigin;
  targetState?: string | null;
  officialUrl: string;
  category: SchemeCategory;
  isActive: boolean;
  eligibilityRules: EligibilityRuleData[];
  requiredDocuments: SchemeDocumentData[];
}

export interface SchemeMatchResult {
  schemeId: string;
  schemeTitle: string;
  slug: string;
  category: SchemeCategory;
  ministry: string;
  origin: SchemeOrigin;
  targetState?: string | null;
  benefitAmountText: string;
  annualValueEstimate: number;
  isEligible: boolean;
  matchScore: number; // 0 to 100%
  disqualifyingReasons: string[];
  requiredDocuments: SchemeDocumentData[];
  scheme: SchemeWithRules;
}

export interface MatchingEvaluationSummary {
  totalSchemesEvaluated: number;
  eligibleSchemesCount: number;
  unlockedAnnualValue: number;
  matches: SchemeMatchResult[];
}

/**
 * Deterministic Rules Engine for Scheme Matching.
 * Pure mathematical and logical evaluation with ZERO probabilistic guessing.
 */
export function evaluateSchemeEligibility(
  profile: UserProfileData,
  scheme: SchemeWithRules
): SchemeMatchResult {
  const disqualifyingReasons: string[] = [];
  let checkedCriteriaCount = 0;
  let passedCriteriaCount = 0;

  // 1. Origin & State Residency Check
  checkedCriteriaCount++;
  if (scheme.origin === SchemeOrigin.STATE && scheme.targetState) {
    const normProfileState = profile.state.trim().toLowerCase();
    const normTargetState = scheme.targetState.trim().toLowerCase();
    if (normProfileState !== normTargetState && normTargetState !== 'all') {
      disqualifyingReasons.push(
        `Scheme is restricted to residents of ${scheme.targetState} (User resident state: ${profile.state})`
      );
    } else {
      passedCriteriaCount++;
    }
  } else {
    passedCriteriaCount++;
  }

  // 2. Rules Evaluation (If scheme has multiple rules, evaluate per rule block)
  for (const rule of scheme.eligibilityRules) {
    // Min Age
    if (rule.minAge !== null && rule.minAge !== undefined) {
      checkedCriteriaCount++;
      if (profile.age < rule.minAge) {
        disqualifyingReasons.push(
          `Age ${profile.age} years is below minimum requirement of ${rule.minAge} years`
        );
      } else {
        passedCriteriaCount++;
      }
    }

    // Max Age
    if (rule.maxAge !== null && rule.maxAge !== undefined) {
      checkedCriteriaCount++;
      if (profile.age > rule.maxAge) {
        disqualifyingReasons.push(
          `Age ${profile.age} years exceeds maximum limit of ${rule.maxAge} years`
        );
      } else {
        passedCriteriaCount++;
      }
    }

    // Income Ceiling
    if (rule.maxIncome !== null && rule.maxIncome !== undefined) {
      checkedCriteriaCount++;
      if (profile.annualIncome > rule.maxIncome) {
        disqualifyingReasons.push(
          `Income ₹${profile.annualIncome.toLocaleString('en-IN')} exceeds scheme ceiling of ₹${rule.maxIncome.toLocaleString('en-IN')}`
        );
      } else {
        passedCriteriaCount++;
      }
    }

    // Land Ownership Limit
    if (rule.maxLandAcres !== null && rule.maxLandAcres !== undefined) {
      checkedCriteriaCount++;
      if (profile.landHoldingAcres > rule.maxLandAcres) {
        disqualifyingReasons.push(
          `Land holding ${profile.landHoldingAcres} acres exceeds maximum limit of ${rule.maxLandAcres} acres`
        );
      } else {
        passedCriteriaCount++;
      }
    }

    // Allowed Genders
    if (rule.allowedGenders && rule.allowedGenders.length > 0) {
      const normalizedAllowedGenders = rule.allowedGenders.map((g) => g.toLowerCase());
      const isAllGenders = normalizedAllowedGenders.includes('all') || normalizedAllowedGenders.includes('any');
      if (!isAllGenders) {
        checkedCriteriaCount++;
        const userGenderNorm = profile.gender.toLowerCase();
        if (!normalizedAllowedGenders.includes(userGenderNorm)) {
          disqualifyingReasons.push(
            `Restricted to ${rule.allowedGenders.join('/')} applicants (User gender: ${profile.gender})`
          );
        } else {
          passedCriteriaCount++;
        }
      }
    }

    // Caste Category
    if (rule.allowedCategories && rule.allowedCategories.length > 0) {
      const normalizedAllowedCats = rule.allowedCategories.map((c) => c.toUpperCase());
      const isAllCats = normalizedAllowedCats.includes('ALL') || normalizedAllowedCats.includes('GENERAL');
      if (!isAllCats && !normalizedAllowedCats.includes(profile.casteCategory.toUpperCase())) {
        checkedCriteriaCount++;
        disqualifyingReasons.push(
          `Reserved for ${rule.allowedCategories.join('/')} categories (User category: ${profile.casteCategory})`
        );
      } else {
        checkedCriteriaCount++;
        passedCriteriaCount++;
      }
    }

    // Allowed Occupations
    if (rule.allowedOccupations && rule.allowedOccupations.length > 0) {
      const normOccupations = rule.allowedOccupations.map((o) => o.toLowerCase());
      const isOpenToAll = normOccupations.includes('all') || normOccupations.includes('any');
      if (!isOpenToAll) {
        checkedCriteriaCount++;
        const userOccNorm = profile.occupation.toLowerCase();
        const matchesOccupation = normOccupations.some((occ) => userOccNorm.includes(occ) || occ.includes(userOccNorm));
        if (!matchesOccupation) {
          disqualifyingReasons.push(
            `Restricted to occupations: ${rule.allowedOccupations.join(', ')} (User occupation: ${profile.occupation})`
          );
        } else {
          passedCriteriaCount++;
        }
      }
    }

    // Requires Student Status
    if (rule.requiresStudent === true) {
      checkedCriteriaCount++;
      if (!profile.isStudent) {
        disqualifyingReasons.push(`Requires applicant to be a currently enrolled student`);
      } else {
        passedCriteriaCount++;
      }
    }

    // Requires Specially Abled Status
    if (rule.requiresSpeciallyAbled === true) {
      checkedCriteriaCount++;
      if (!profile.isSpeciallyAbled) {
        disqualifyingReasons.push(`Requires applicant to be registered as specially abled (PwD)`);
      } else {
        passedCriteriaCount++;
      }
    }
  }

  const isEligible = disqualifyingReasons.length === 0;
  const matchScore = isEligible
    ? 100
    : Math.max(0, Math.round((passedCriteriaCount / Math.max(checkedCriteriaCount, 1)) * 100));

  return {
    schemeId: scheme.id,
    schemeTitle: scheme.title,
    slug: scheme.slug,
    category: scheme.category,
    ministry: scheme.ministry,
    origin: scheme.origin,
    targetState: scheme.targetState,
    benefitAmountText: scheme.benefitAmountText,
    annualValueEstimate: scheme.annualValueEstimate,
    isEligible,
    matchScore,
    disqualifyingReasons,
    requiredDocuments: scheme.requiredDocuments,
    scheme,
  };
}

/**
 * Batch Evaluator for all active schemes against user profile.
 * Computes unlocked annual value sum across 100% matched schemes.
 */
export function evaluateUserEligibility(
  profile: UserProfileData,
  schemes: SchemeWithRules[]
): MatchingEvaluationSummary {
  const matches = schemes.map((scheme) => evaluateSchemeEligibility(profile, scheme));
  const eligibleMatches = matches.filter((m) => m.isEligible);

  const unlockedAnnualValue = eligibleMatches.reduce(
    (sum, m) => sum + (m.annualValueEstimate || 0),
    0
  );

  return {
    totalSchemesEvaluated: schemes.length,
    eligibleSchemesCount: eligibleMatches.length,
    unlockedAnnualValue,
    // Sort matches: Eligible first (highest annual value), then by matchScore descending
    matches: matches.sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      if (a.isEligible && b.isEligible) return b.annualValueEstimate - a.annualValueEstimate;
      return b.matchScore - a.matchScore;
    }),
  };
}
