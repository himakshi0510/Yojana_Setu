'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuthSession } from '@/lib/auth';
import { ActionResponse } from '@/lib/errors';

const toggleDocumentSchema = z.object({
  documentName: z.string().min(1, 'Document name is required'),
  isReady: z.boolean(),
});

export type ToggleDocumentInput = z.infer<typeof toggleDocumentSchema>;

export interface DocumentChecklistProgress {
  totalDocuments: number;
  readyDocuments: number;
  progressPercentage: number; // e.g., 75
  checklist: Array<{
    id: string;
    documentName: string;
    isUploadedOrReady: boolean;
    updatedAt: Date;
  }>;
}

/**
 * Server Action: Toggle Document Readiness Status in User's Checklist
 */
export async function toggleDocumentStatus(
  input: ToggleDocumentInput
): Promise<ActionResponse<{ documentName: string; isReady: boolean }>> {
  try {
    const validatedInput = toggleDocumentSchema.parse(input);
    const sessionUser = await requireAuthSession();

    // Ensure User record exists
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

    await db.userDocumentChecklist.upsert({
      where: {
        userId_documentName: {
          userId: sessionUser.id,
          documentName: validatedInput.documentName,
        },
      },
      create: {
        userId: sessionUser.id,
        documentName: validatedInput.documentName,
        isUploadedOrReady: validatedInput.isReady,
      },
      update: {
        isUploadedOrReady: validatedInput.isReady,
      },
    });

    return {
      success: true,
      data: {
        documentName: validatedInput.documentName,
        isReady: validatedInput.isReady,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update document readiness.';
    console.error('[Action error: toggleDocumentStatus]', String(error));
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Server Action: Get User Document Checklist Progress & Completion Ratio
 */
export async function getUserChecklistProgress(): Promise<ActionResponse<DocumentChecklistProgress>> {
  try {
    const sessionUser = await requireAuthSession();

    // Common standard government documents list to seed if checklist is empty
    const STANDARD_GOVT_DOCS = [
      'Aadhaar Card (Identity Proof)',
      'Income Certificate (Tehsildar Issued)',
      'Land Khatauni / Revenue Records',
      'Bank Account Passbook (DBT Linked)',
      'Caste Certificate (SC/ST/OBC)',
      'Passport Size Photo',
      'Domicile / Residence Certificate',
    ];

    let items = await db.userDocumentChecklist.findMany({
      where: { userId: sessionUser.id },
      orderBy: { documentName: 'asc' },
    });

    // Auto-seed checklist items if user doesn't have any saved items yet
    if (items.length === 0) {
      await db.userDocumentChecklist.createMany({
        data: STANDARD_GOVT_DOCS.map((docName) => ({
          userId: sessionUser.id,
          documentName: docName,
          isUploadedOrReady: false,
        })),
        skipDuplicates: true,
      });

      items = await db.userDocumentChecklist.findMany({
        where: { userId: sessionUser.id },
        orderBy: { documentName: 'asc' },
      });
    }

    const totalDocuments = items.length;
    const readyDocuments = items.filter((item) => item.isUploadedOrReady).length;
    const progressPercentage = totalDocuments > 0 ? Math.round((readyDocuments / totalDocuments) * 100) : 0;

    return {
      success: true,
      data: {
        totalDocuments,
        readyDocuments,
        progressPercentage,
        checklist: items.map((item) => ({
          id: item.id,
          documentName: item.documentName,
          isUploadedOrReady: item.isUploadedOrReady,
          updatedAt: item.updatedAt,
        })),
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve document checklist progress.';
    console.error('[Action error: getUserChecklistProgress]', String(error));
    return {
      success: false,
      error: message,
    };
  }
}
