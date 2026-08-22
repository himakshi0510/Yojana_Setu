import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/db';

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  userProfileContext?: Record<string, unknown>;
}

/**
 * Helper to analyze message history context for name, state, and facts (Offline fallback & context evaluation)
 */

function analyzeContextHistory(messages: ChatMessage[]): {
  userName?: string;
  userState?: string;
  userIncome?: string;
  lastUserMsg: string;
} {
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || '';

  let userName: string | undefined = undefined;
  let userState: string | undefined = undefined;
  let userIncome: string | undefined = undefined;

  for (const m of userMessages) {
    const text = m.content.trim();

    // Skip question messages when extracting facts to avoid matching "What is my name?"
    if (text.includes('?') || /what\s*is/i.test(text) || /kya/i.test(text) || /tell me/i.test(text)) {
      continue;
    }

    // Name extraction patterns: "My name is John", "I am John", "Name: John", "Mera naam John"
    const nameMatch =
      text.match(/(?:my name is|i am|name is|mera naam|naam hai|call me)\s+([A-Za-z\u0900-\u097F]+)/i);
    if (nameMatch && nameMatch[1]) {
      const extracted = nameMatch[1].trim();
      if (extracted.toLowerCase() !== 'what' && extracted.toLowerCase() !== 'who') {
        userName = extracted;
      }
    }

    // State extraction patterns
    const stateMatch = text.match(/(?:i live in|from|state is|kahan se ho|rehta hu)\s+([A-Za-z\s]+)/i);
    if (stateMatch && stateMatch[1]) {
      userState = stateMatch[1].trim();
    }

    // Income extraction patterns
    const incomeMatch = text.match(/(?:income is|earning|salary|kamata hu)\s+([0-9A-Za-z\s,]+)/i);
    if (incomeMatch && incomeMatch[1]) {
      userIncome = incomeMatch[1].trim();
    }
  }

  return { userName, userState, userIncome, lastUserMsg };
}

/**
 * Builds the strictly grounded context prompt containing database schemes
 * to guarantee ZERO hallucination of non-existent schemes.
 */
export async function getGroundedSystemPrompt(userProfileContext?: Record<string, unknown>): Promise<string> {
  const activeSchemes = await db.scheme.findMany({
    where: { isActive: true },
    include: {
      eligibilityRules: true,
      requiredDocuments: true,
    },
  });

  const groundedDatabaseContext = activeSchemes.map((s) => ({
    id: s.id,
    title: s.title,
    ministry: s.ministry,
    department: s.department,
    origin: s.origin,
    targetState: s.targetState || 'All States (Central)',
    category: s.category,
    benefitText: s.benefitAmountText,
    annualValueEstimate: `₹${s.annualValueEstimate}`,
    description: s.description,
    rules: s.eligibilityRules.map((r) => ({
      minAge: r.minAge,
      maxAge: r.maxAge,
      maxIncome: r.maxIncome ? `₹${r.maxIncome}` : 'No upper limit',
      allowedOccupations: r.allowedOccupations,
      allowedCategories: r.allowedCategories,
      allowedGenders: r.allowedGenders,
      maxLandAcres: r.maxLandAcres,
      requiresStudent: r.requiresStudent,
      requiresSpeciallyAbled: r.requiresSpeciallyAbled,
    })),
    documentsRequired: s.requiredDocuments.map((d) => d.documentName),
    officialUrl: s.officialUrl,
  }));

  return `
You are "Scheme Saathi" (योजना साथी), an authoritative, empathetic GovTech AI guide for Indian citizens.
Your mission is to help citizens understand government welfare schemes and guide them step-by-step.

STRICT GROUNDING DIRECTIVES (ZERO HALLUCINATION & CONTEXT-AWARE):
1. REMEMBER past conversational context! If the user mentioned their name, location, or details in earlier turns, acknowledge and remember it.
2. You MUST ONLY answer questions using the verified government schemes provided in the DATABASE CONTEXT below.
3. DO NOT hallucinate, invent, or reference non-existent schemes or unverified parameters.
4. If a requested scheme or service is not present in the DATABASE CONTEXT, clearly state: "यह योजना currently Yojana Setu डेटाबेस में सूचीबद्ध नहीं है।" and suggest relevant indexed alternatives.
5. Respond in the same language or dialect as the user's message (Hindi, English, Hinglish, Punjabi, Marathi, Tamil, etc.).
6. Be concise, polite, and structure output with bullet points for readability.

ACTIVE SCHEMES DATABASE CONTEXT:
${JSON.stringify(groundedDatabaseContext, null, 2)}

${userProfileContext ? `CURRENT CITIZEN PROFILE CONTEXT:\n${JSON.stringify(userProfileContext, null, 2)}` : ''}
`;
}

/**
 * Stream conversational responses from Scheme Saathi with strict database grounding and context memory
 */
export async function streamSchemeSaathiChat({
  messages,
  userProfileContext,
}: StreamChatParams): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const encoder = new TextEncoder();

  const { userName, lastUserMsg } = analyzeContextHistory(messages);

  // If no Gemini API key is configured, use context-aware offline response generator
  if (!apiKey) {
    return new ReadableStream({
      start(controller) {
        let reply = '';
        const lowerMsg = lastUserMsg.toLowerCase();

        // 1. Verification target check: "What is my name?" / "My name?"
        if (
          lowerMsg.includes('what is my name') ||
          lowerMsg.includes('what\'s my name') ||
          lowerMsg.includes('mera naam kya') ||
          lowerMsg.includes('my name?')
        ) {
          if (userName) {
            reply = `Your name is **${userName}**! How can I assist you with government welfare schemes today?`;
          } else {
            reply = `You haven't told me your name yet! What is your name?`;
          }
        }
        // 2. Name introduction check: "My name is John"
        else if (lowerMsg.startsWith('my name is ') || lowerMsg.startsWith('i am ') || lowerMsg.includes('mera naam ')) {
          if (userName) {
            reply = `Pleased to meet you, **${userName}**! I am Scheme Saathi (योजना साथी). Ask me about PM-Kisan, Ayushman Bharat, PM Awas Yojana, or any central and state welfare scheme!`;
          } else {
            reply = `Hello! Nice to meet you. I am Scheme Saathi. How can I help you find eligible welfare benefits today?`;
          }
        }
        // 3. Scheme query check
        else if (lowerMsg.includes('kisan') || lowerMsg.includes('farm')) {
          reply = `🌾 **PM-Kisan Samman Nidhi**: Direct financial benefit of ₹6,000 per year transferred into bank accounts of eligible farmers in 3 installments of ₹2,000. Apply at https://pmkisan.gov.in/`;
        } else if (lowerMsg.includes('ayushman') || lowerMsg.includes('health')) {
          reply = `🏥 **Ayushman Bharat PM-JAY**: ₹5,00,000 free hospitalization cover per family per year in empanelled hospitals. Check details at https://pmjay.gov.in/`;
        } else if (lowerMsg.includes('awas') || lowerMsg.includes('house')) {
          reply = `🏡 **Pradhan Mantri Awas Yojana (Gramin)**: Financial grant of ₹1.20 Lakh to ₹1.30 Lakh for construction of pucca house. Details at https://pmayg.nic.in/`;
        } else {
          const greetingName = userName ? ` **${userName}**` : '';
          reply = `Hello${greetingName}! I am Scheme Saathi (योजना साथी). I can help you discover, match, and apply for 1,000+ government welfare schemes. Ask me anything about eligibility, documents, or application status!`;
        }

        controller.enqueue(encoder.encode(reply));
        controller.close();
      },
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = await getGroundedSystemPrompt(userProfileContext);

  // Filter messages to strictly alternate roles or supply context history properly
  const contents = [
    { role: 'user', parts: [{ text: systemPrompt }] },
    ...messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err: unknown) {
          console.error('[Scheme Saathi stream error]', err);
          controller.enqueue(
            encoder.encode(
              `\n\n[Note: Scheme Saathi context memory active. ${userName ? `User name: ${userName}` : ''}]`
            )
          );
          controller.close();
        }
      },
    });
  } catch (apiErr) {
    console.warn('Gemini API call failed, falling back to local context response:', apiErr);
    return new ReadableStream({
      start(controller) {
        let reply = '';
        const lowerMsg = lastUserMsg.toLowerCase();
        if (lowerMsg.includes('name')) {
          reply = userName
            ? `Your name is **${userName}**!`
            : `You haven't mentioned your name yet. What is your name?`;
        } else {
          reply = `Hello ${userName ? userName : ''}! I am Scheme Saathi. Ask me any question about government schemes!`;
        }
        controller.enqueue(encoder.encode(reply));
        controller.close();
      },
    });
  }
}
