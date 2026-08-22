'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthSession } from '@/lib/auth';
import { ActionResponse } from '@/lib/errors';
import { ApplicationStatus, SchemeCategory } from '@prisma/client';

const updateStatusSchema = z.object({
  schemeId: z.string().min(1, 'Scheme ID is required'),
  status: z.nativeEnum(ApplicationStatus),
  applicationReferenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateStatusSchema>;

export interface TrackedApplicationItem {
  id: string;
  userId: string;
  schemeId: string;
  status: ApplicationStatus;
  applicationReferenceNo: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  scheme: {
    id: string;
    title: string;
    slug: string;
    ministry: string;
    category: SchemeCategory;
    benefitAmountText: string;
    officialUrl: string;
  };
}

/**
 * Server Action: Update or Create Application Status for a Scheme
 */
export async function updateApplicationStatus(
  input: UpdateApplicationStatusInput
): Promise<ActionResponse<{ id: string; status: ApplicationStatus; updatedAt: Date }>> {
  try {
    const validatedInput = updateStatusSchema.parse(input);
    const sessionUser = await requireAuthSession();

    // Ensure User record exists in DB
    await db.user.upsert({
      where: { id: sessionUser.id },
      create: {
        id: sessionUser.id,
        email: sessionUser.email,
        phone: sessionUser.phone,
        role: sessionUser.role,
      },
      update: {},
    });

    const record = await db.applicationTracker.upsert({
      where: {
        userId_schemeId: {
          userId: sessionUser.id,
          schemeId: validatedInput.schemeId,
        },
      },
      create: {
        userId: sessionUser.id,
        schemeId: validatedInput.schemeId,
        status: validatedInput.status,
        applicationReferenceNo: validatedInput.applicationReferenceNo || null,
        notes: validatedInput.notes || null,
      },
      update: {
        status: validatedInput.status,
        ...(validatedInput.applicationReferenceNo !== undefined && {
          applicationReferenceNo: validatedInput.applicationReferenceNo,
        }),
        ...(validatedInput.notes !== undefined && { notes: validatedInput.notes }),
      },
    });

    return {
      success: true,
      data: {
        id: record.id,
        status: record.status,
        updatedAt: record.updatedAt,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update application status.';
    console.error('[Action error: updateApplicationStatus]', String(error));
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Get User's Tracked Applications
 * Efficient query filtered by userId with composite index [userId, status]
 */
export async function getUserTrackedApplications(): Promise<ActionResponse<TrackedApplicationItem[]>> {
  try {
    const sessionUser = await requireAuthSession();

    const applications = await db.applicationTracker.findMany({
      where: { userId: sessionUser.id },
      include: {
        scheme: {
          select: {
            id: true,
            title: true,
            slug: true,
            ministry: true,
            category: true,
            benefitAmountText: true,
            officialUrl: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      success: true,
      data: applications,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve tracked applications.';
    console.error('[Action error: getUserTrackedApplications]', String(error));
    return {
      success: false,
      error: message,
    };
  }
}
