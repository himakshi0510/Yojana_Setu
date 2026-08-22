import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { streamSchemeSaathiChat } from '@/lib/ai/scheme-saathi-chat';

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model', 'system']),
      content: z.string().min(1),
    })
  ),
  userProfileContext: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Next.js 16 Route Handler: /api/chat/saathi
 * Streams grounded Scheme Saathi AI responses to citizen queries.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = chatRequestSchema.parse(body);

    const stream = await streamSchemeSaathiChat({
      messages: validatedData.messages,
      userProfileContext: validatedData.userProfileContext,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid chat payload or streaming failure.';
    console.error('[API Route Error: /api/chat/saathi]', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: error instanceof z.ZodError ? 422 : 500 }
    );
  }
}
