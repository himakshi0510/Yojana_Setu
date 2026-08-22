import { GoogleGenAI, Type } from '@google/genai';
import { db } from '@/lib/db';
import { UserProfileData } from '@/lib/rules-engine';

export interface SchemeExplanationResult {
  whatIsThis: string;
  whoCanApply: string;
  exactBenefit: string;
  avoidMistakes: string;
  languageUsed: string;
}

export interface ExplainSchemeParams {
  schemeId: string;
  userProfile?: Partial<UserProfileData>;
  language?: string; // e.g., 'Hindi', 'English', 'Hinglish', 'Punjabi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', etc.
}

// Multilingual Templates for Offline & Resilient Fallback
const MULTILINGUAL_DICTIONARY: Record<string, (s: any) => SchemeExplanationResult> = {
  English: (s) => ({
    whatIsThis: `${s.title} is a flagship welfare program operated by the ${s.ministry}. ${s.description}`,
    whoCanApply: `Open to eligible Indian citizens. Income limit: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'As per norms'}. Target scope: ${s.origin} level (${s.targetState || 'All States'}).`,
    exactBenefit: `Financial Benefit: ${s.benefitAmountText} (Estimated Annual Value: ₹${s.annualValueEstimate?.toLocaleString('en-IN')}).`,
    avoidMistakes: `Ensure all required documents (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) are verified and uploaded without typos.`,
    languageUsed: 'English',
  }),

  Hindi: (s) => ({
    whatIsThis: `${s.title} ${s.ministry} द्वारा संचालित एक प्रमुख सरकारी कल्याणकारी योजना है। ${s.description}`,
    whoCanApply: `यह योजना ${s.origin === 'CENTRAL' ? 'केंद्रीय' : 'राज्य'} स्तर पर लागू है। अधिकतम आय सीमा: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'मानदंडानुसार'}।`,
    exactBenefit: `प्रत्यक्ष लाभ: ${s.benefitAmountText} (अनुमानित वार्षिक मूल्य: ₹${s.annualValueEstimate?.toLocaleString('en-IN')})।`,
    avoidMistakes: `आवेदन पत्र भरते समय सभी दस्तावेज (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) सही ढंग से संलग्न करें।`,
    languageUsed: 'Hindi',
  }),

  Hinglish: (s) => ({
    whatIsThis: `${s.title} ek major government scheme hai by ${s.ministry}. ${s.description}`,
    whoCanApply: `Eligible Indian citizens apply kar sakte hain. Max income limit: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'As per rules'}. Scope: ${s.origin} level.`,
    exactBenefit: `Direct Benefit: ${s.benefitAmountText} (Estimated Annual Value: ₹${s.annualValueEstimate?.toLocaleString('en-IN')}).`,
    avoidMistakes: `Form submit karte time sabhi documents (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) check aur verify karein.`,
    languageUsed: 'Hinglish',
  }),

  Punjabi: (s) => ({
    whatIsThis: `${s.title} ${s.ministry} ਵਲੋਂ ਚਲਾਈ ਜਾ ਰਹੀ ਇੱਕ ਪ੍ਰਮੁੱਖ ਸਰਕਾਰੀ ਭਲਾਈ ਯੋਜਨਾ ਹੈ। ${s.description}`,
    whoCanApply: `ਇਹ ਯੋਜਨਾ ${s.origin === 'CENTRAL' ? 'ਕੇਂਦਰੀ' : 'ਰਾਜ'} ਪੱਧਰ 'ਤੇ ਲਾਗੂ ਹੈ। ਆਮਦਨ ਸੀਮਾ: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'ਨਿਯਮਾਂ ਅਨੁਸਾਰ'}।`,
    exactBenefit: `ਸਿੱਧਾ ਲਾਭ: ${s.benefitAmountText} (ਸਾਲਾਨਾ ਅਨੁਮਾਨਿਤ ਮੁੱਲ: ₹${s.annualValueEstimate?.toLocaleString('en-IN')})।`,
    avoidMistakes: `ਅਰਜ਼ੀ ਦਿੰਦੇ ਸਮੇਂ ਸਾਰੇ ਜ਼ਰੂਰੀ ਦਸਤਾਵੇਜ਼ (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) ਸਹੀ ਤਰ੍ਹਾਂ ਨਾਲ ਅਪਲੋਡ ਕਰੋ।`,
    languageUsed: 'Punjabi',
  }),

  Marathi: (s) => ({
    whatIsThis: `${s.title} ही ${s.ministry} द्वारे चालवली जाणारी एक प्रमुख सरकारी कल्याणकारी योजना आहे. ${s.description}`,
    whoCanApply: `ही योजना ${s.origin === 'CENTRAL' ? 'केंद्र' : 'राज्य'} स्तरावर लागू आहे. कमाल उत्पन्न मर्यादा: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'नियमांनुसार'}.`,
    exactBenefit: `प्रत्यक्ष लाभ: ${s.benefitAmountText} (अंदाजे वार्षिक मूल्य: ₹${s.annualValueEstimate?.toLocaleString('en-IN')}).`,
    avoidMistakes: `अर्ज भरताना सर्व आवश्यक कागदपत्रे (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) अचूक अपलोड करा.`,
    languageUsed: 'Marathi',
  }),

  Tamil: (s) => ({
    whatIsThis: `${s.title} என்பது ${s.ministry} ஆல் நடத்தப்படும் முக்கிய அரசு நலத்திட்டம் ஆகும். ${s.description}`,
    whoCanApply: `தகுதியுள்ள இந்திய குடிமக்கள் விண்ணப்பிக்கலாம். வருமான வரம்பு: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'விதிகளின்படி'}.`,
    exactBenefit: `நேரடி பயன்: ${s.benefitAmountText} (ஆண்டு மதிப்பு: ₹${s.annualValueEstimate?.toLocaleString('en-IN')}).`,
    avoidMistakes: `விண்ணப்பிக்கும் போது தேவையான ஆவணங்களை (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) சரிபார்த்து பதிவேற்றவும்.`,
    languageUsed: 'Tamil',
  }),

  Telugu: (s) => ({
    whatIsThis: `${s.title} అనేది ${s.ministry} ద్వారా నిర్వహించబడుతున్న ముఖ్యమైన ప్రభుత్వ సంక్షేమ పథకం. ${s.description}`,
    whoCanApply: `అర్హులైన భారతీయ పౌరులు దరఖాస్తు చేసుకోవచ్చు. గరిష్ట ఆదాయ పరిమితి: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'నిబంధనల ప్రకారం'}.`,
    exactBenefit: `ప్రత్యక్ష ప్రయోజనం: ${s.benefitAmountText} (అంచనా వార్షిక విలువ: ₹${s.annualValueEstimate?.toLocaleString('en-IN')}).`,
    avoidMistakes: `దరఖాస్తు చేసుకునేటప్పుడు అన్ని అవసరమైన పత్రాలను (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) సరిచూసి అప్‌లోడ్ చేయండి.`,
    languageUsed: 'Telugu',
  }),

  Bengali: (s) => ({
    whatIsThis: `${s.title} হল ${s.ministry} দ্বারা পরিচালিত একটি প্রধান সরকারি কল্যাণমূলক প্রকল্প। ${s.description}`,
    whoCanApply: `যোগ্য ভারতীয় নাগরিকরা আবেদন করতে পারেন। সর্বোচ্চ আয় সীমা: ₹${s.eligibilityRules?.[0]?.maxIncome?.toLocaleString('en-IN') || 'নিয়মানুযায়ী'}।`,
    exactBenefit: `সরাসরি সুবিধা: ${s.benefitAmountText} (বার্ষিক আনুমানিক মূল্য: ₹${s.annualValueEstimate?.toLocaleString('en-IN')})।`,
    avoidMistakes: `আবেদন করার সময় সমস্ত প্রয়োজনীয় নথি (${s.requiredDocuments?.map((d: any) => d.documentName).join(', ')}) সঠিকভাবে আপলোড করুন।`,
    languageUsed: 'Bengali',
  }),
};

/**
 * AI Service: Scheme Explainer
 * Uses Gemini API (@google/genai) to generate structured plain-language scheme summaries.
 */
export async function explainSchemeWithAI({
  schemeId,
  userProfile,
  language = 'Hindi',
}: ExplainSchemeParams): Promise<SchemeExplanationResult> {
  // 1. Fetch scheme details from database (or fallback lookup)
  let scheme = await db.scheme.findUnique({
    where: { id: schemeId },
    include: {
      eligibilityRules: true,
      requiredDocuments: true,
    },
  });

  if (!scheme) {
    // Search by slug or title if ID match fails
    scheme = await db.scheme.findFirst({
      where: { OR: [{ slug: schemeId }, { title: { contains: schemeId, mode: 'insensitive' } }] },
      include: { eligibilityRules: true, requiredDocuments: true },
    });
  }

  // Generic scheme representation if DB record is not seeded
  const safeScheme = scheme || {
    id: schemeId,
    title: schemeId.replace(/-/g, ' ').toUpperCase(),
    ministry: 'Government of India',
    department: 'Welfare Department',
    description: 'A key welfare initiative providing financial aid, subsidies, and security to eligible citizens.',
    benefitAmountText: 'Financial benefit & direct transfer as per norms',
    annualValueEstimate: 50000,
    origin: 'CENTRAL',
    targetState: null,
    category: 'SOCIAL_WELFARE',
    eligibilityRules: [{ maxIncome: 250000 }],
    requiredDocuments: [{ documentName: 'Aadhaar Card' }, { documentName: 'Income Certificate' }],
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // If Gemini API Key is missing, use local rich multilingual generator
  if (!apiKey) {
    const generator = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY['Hindi'];
    return generator(safeScheme);
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are Yojana Saathi, an expert Indian GovTech welfare advisor.
Explain the following Government Scheme in plain, easy-to-understand language targeted at a citizen.

CRITICAL INSTRUCTION: You MUST write the ENTIRE JSON output response in the target language requested: "${language}".

TARGET LANGUAGE: ${language}

SCHEME DETAILS:
- Title: ${safeScheme.title}
- Ministry: ${safeScheme.ministry}
- Department: ${safeScheme.department}
- Scope: ${safeScheme.origin} ${safeScheme.targetState ? `(State: ${safeScheme.targetState})` : ''}
- Description: ${safeScheme.description}
- Financial Benefit: ${safeScheme.benefitAmountText} (Estimated Annual Value: ₹${safeScheme.annualValueEstimate})
- Category: ${safeScheme.category}
- Required Documents: ${safeScheme.requiredDocuments.map((d: any) => d.documentName).join(', ')}
- Eligibility Criteria Rules: ${JSON.stringify(safeScheme.eligibilityRules)}

${userProfile ? `CITIZEN PROFILE CONTEXT: ${JSON.stringify(userProfile)}` : ''}

Provide a JSON object containing EXACTLY the following 4 keys in ${language}:
1. "whatIsThis": A simple 2-sentence explanation of what the scheme is and why it exists in ${language}.
2. "whoCanApply": Who is eligible to apply in clear bullet points or short text in ${language}.
3. "exactBenefit": Exactly what financial or non-financial benefit the applicant gets in ${language}.
4. "avoidMistakes": Critical mistakes to avoid during application and document submission in ${language}.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            whatIsThis: { type: Type.STRING },
            whoCanApply: { type: Type.STRING },
            exactBenefit: { type: Type.STRING },
            avoidMistakes: { type: Type.STRING },
          },
          required: ['whatIsThis', 'whoCanApply', 'exactBenefit', 'avoidMistakes'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Gemini API returned empty response.');
    }

    const parsed = JSON.parse(text);

    return {
      whatIsThis: parsed.whatIsThis || '',
      whoCanApply: parsed.whoCanApply || '',
      exactBenefit: parsed.exactBenefit || '',
      avoidMistakes: parsed.avoidMistakes || '',
      languageUsed: language,
    };
  } catch (err: unknown) {
    console.error('[Gemini AI explainScheme error]', err);
    const generator = MULTILINGUAL_DICTIONARY[language] || MULTILINGUAL_DICTIONARY['Hindi'];
    return generator(safeScheme);
  }
}
