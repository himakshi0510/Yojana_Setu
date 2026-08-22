'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthSession } from '@/lib/auth';
import { ActionResponse } from '@/lib/errors';
import {
  evaluateUserEligibility,
  MatchingEvaluationSummary,
  UserProfileData,
} from '@/lib/rules-engine';
import { CasteCategory } from '@prisma/client';

const userProfileOverrideSchema = z.object({
  state: z.string().optional(),
  district: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.number().min(0).optional(),
  casteCategory: z.nativeEnum(CasteCategory).optional(),
  landHoldingAcres: z.number().min(0).optional(),
  isStudent: z.boolean().optional(),
  isSpeciallyAbled: z.boolean().optional(),
  isSeniorCitizen: z.boolean().optional(),
});

export type UserProfileOverrideInput = z.infer<typeof userProfileOverrideSchema>;

/**
 * Server Action: Get Matched Welfare Schemes
 * Fetches active schemes in a single optimized query (zero N+1),
 * applies deterministic rules engine against user profile or override,
 * and returns cumulative unlocked annual value.
 */
export async function getMatchedSchemes(
  profileOverride?: UserProfileOverrideInput
): Promise<ActionResponse<MatchingEvaluationSummary>> {
  try {
    if (profileOverride) {
      userProfileOverrideSchema.parse(profileOverride);
    }
    const sessionUser = await requireAuthSession();

    // 1. Fetch user profile from DB or construct default context
    const dbProfile = await db.userProfile.findUnique({
      where: { userId: sessionUser.id },
    });

    const defaultProfile: UserProfileData = {
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      age: 28,
      gender: 'Male',
      occupation: 'Farmer',
      annualIncome: 180000,
      casteCategory: CasteCategory.OBC,
      landHoldingAcres: 1.5,
      isStudent: false,
      isSpeciallyAbled: false,
      isSeniorCitizen: false,
    };

    // Combine profile priority: Default < DB Profile < Input Profile Override
    const activeProfile: UserProfileData = {
      state: profileOverride?.state ?? dbProfile?.state ?? defaultProfile.state,
      district: profileOverride?.district ?? dbProfile?.district ?? defaultProfile.district,
      age: profileOverride?.age ?? dbProfile?.age ?? defaultProfile.age,
      gender: profileOverride?.gender ?? dbProfile?.gender ?? defaultProfile.gender,
      occupation: profileOverride?.occupation ?? dbProfile?.occupation ?? defaultProfile.occupation,
      annualIncome: profileOverride?.annualIncome ?? dbProfile?.annualIncome ?? defaultProfile.annualIncome,
      casteCategory: profileOverride?.casteCategory ?? dbProfile?.casteCategory ?? defaultProfile.casteCategory,
      landHoldingAcres: profileOverride?.landHoldingAcres ?? dbProfile?.landHoldingAcres ?? defaultProfile.landHoldingAcres,
      isStudent: profileOverride?.isStudent ?? dbProfile?.isStudent ?? defaultProfile.isStudent,
      isSpeciallyAbled: profileOverride?.isSpeciallyAbled ?? dbProfile?.isSpeciallyAbled ?? defaultProfile.isSpeciallyAbled,
      isSeniorCitizen: profileOverride?.isSeniorCitizen ?? dbProfile?.isSeniorCitizen ?? defaultProfile.isSeniorCitizen,
    };

    // 2. Optimized database query with zero N+1 overhead
    const schemesWithRules = await db.scheme.findMany({
      where: { isActive: true },
      include: {
        eligibilityRules: true,
        requiredDocuments: true,
      },
    });

    // 3. Execute pure deterministic rules engine evaluation
    const summary = evaluateUserEligibility(activeProfile, schemesWithRules);

    return {
      success: true,
      data: summary,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to match schemes for citizen profile.';
    // Use String() instead of passing the raw Error object — Next.js 16 Webpack dev server
    // cannot serialize raw Error objects in Server Action catch blocks and throws
    // "invalid type: boolean false, expected enum CodeFrameColorMode".
    console.error('[Action error: getMatchedSchemes]', String(error));
    return {
      success: false,
      error: message,
    };
  }
}
