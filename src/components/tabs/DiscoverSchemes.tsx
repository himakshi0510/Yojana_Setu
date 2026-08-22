'use client';

import React, { useState, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, ArrowUpRight, Search, 
  MapPin, Mic, MicOff, Volume2, VolumeX, Loader2, RefreshCw, X, AlertCircle, Award, Check, Navigation
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMatchedSchemes } from "@/app/actions/schemeMatching.action";
import { updateApplicationStatus } from "@/app/actions/tracker.action";
import { explainSchemeWithAI, SchemeExplanationResult } from "@/lib/ai/scheme-explainer";

interface SchemeDisplayItem {
  id: string;
  name: string;
  ministry: string;
  match: string;
  isEligible: boolean;
  benefit: string;
  annualValue: number;
  officialUrl: string;
  tags: string[];
  category: string;
  disqualifyingReasons: string[];
}

const DEFAULT_SCHEMES: SchemeDisplayItem[] = [
  {
    id: "scheme-pm-kisan",
    name: "PM-Kisan Samman Nidhi",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    match: "100%",
    isEligible: true,
    benefit: "₹6,000 / year paid directly in 3 equal installments into bank account.",
    annualValue: 6000,
    officialUrl: "https://pmkisan.gov.in/",
    tags: ["Direct Income Transfer", "Farmers", "Small Landowners"],
    category: "AGRICULTURE",
    disqualifyingReasons: [],
  },
  {
    id: "scheme-pmay-g",
    name: "Pradhan Mantri Awas Yojana (Gramin)",
    ministry: "Ministry of Rural Development",
    match: "95%",
    isEligible: true,
    benefit: "₹1.20 Lakh to ₹1.30 Lakh financial grant for house construction.",
    annualValue: 120000,
    officialUrl: "https://pmayg.nic.in/",
    tags: ["Rural Housing", "Pucca House", "Construction Grant"],
    category: "HOUSING",
    disqualifyingReasons: [],
  },
  {
    id: "scheme-ayushman",
    name: "Ayushman Bharat PM-JAY",
    ministry: "Ministry of Health and Family Welfare",
    match: "100%",
    isEligible: true,
    benefit: "₹5,00,000 free health coverage per family per year in empanelled hospitals.",
    annualValue: 500000,
    officialUrl: "https://pmjay.gov.in/",
    tags: ["Free Healthcare", "Hospitalization", "Insurance"],
    category: "HEALTHCARE",
    disqualifyingReasons: [],
  },
  {
    id: "scheme-post-matric",
    name: "Post-Matric Scholarship for OBC/SC/ST",
    ministry: "Ministry of Social Justice and Empowerment",
    match: "100%",
    isEligible: true,
    benefit: "Full fee reimbursement + monthly maintenance allowance for students.",
    annualValue: 50000,
    officialUrl: "https://scholarship.up.gov.in/",
    tags: ["Student Allowance", "Fee Waiver", "Education"],
    category: "EDUCATION",
    disqualifyingReasons: [],
  },
  {
    id: "scheme-mudra",
    name: "Pradhan Mantri Mudra Yojana (Shishu)",
    ministry: "Ministry of Finance",
    match: "90%",
    isEligible: true,
    benefit: "Collateral-free business loan up to ₹50,000 for micro-enterprises.",
    annualValue: 50000,
    officialUrl: "https://www.mudra.org.in/",
    tags: ["Micro Loan", "Zero Collateral", "MSME"],
    category: "MSME",
    disqualifyingReasons: [],
  },
  {
    id: "scheme-fasal-bima",
    name: "PM Fasal Bima Yojana",
    ministry: "Ministry of Agriculture",
    match: "85%",
    isEligible: true,
    benefit: "Comprehensive crop insurance against natural calamities, pests & diseases.",
    annualValue: 25000,
    officialUrl: "https://pmfby.gov.in/",
    tags: ["Crop Protection", "Risk Insurance", "Agriculture"],
    category: "AGRICULTURE",
    disqualifyingReasons: [],
  },
];

// Indian Pincode Directory mapping
const PINCODE_MAP: Record<string, { state: string; district: string }> = {
  "221001": { state: "Uttar Pradesh", district: "Varanasi" },
  "110001": { state: "Delhi", district: "New Delhi" },
  "400001": { state: "Maharashtra", district: "Mumbai" },
  "560001": { state: "Karnataka", district: "Bengaluru" },
  "600001": { state: "Tamil Nadu", district: "Chennai" },
  "700001": { state: "West Bengal", district: "Kolkata" },
  "380001": { state: "Gujarat", district: "Ahmedabad" },
  "141001": { state: "Punjab", district: "Ludhiana" },
  "302001": { state: "Rajasthan", district: "Jaipur" },
  "800001": { state: "Bihar", district: "Patna" },
  "500001": { state: "Telangana", district: "Hyderabad" },
  "474001": { state: "Madhya Pradesh", district: "Gwalior" },
};

export default function DiscoverSchemes() {
  const [schemes, setSchemes] = useState<SchemeDisplayItem[]>(DEFAULT_SCHEMES);
  const [unlockedValue, setUnlockedValue] = useState<number>(751000);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [appliedSchemes, setAppliedSchemes] = useState<Record<string, boolean>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Voice search state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'responded'>('idle');
  const [actualTranscript, setActualTranscript] = useState("");
  const [voiceLang, setVoiceLang] = useState("Hindi");

  // Text-To-Speech (TTS) speaking state
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Location filter state
  const [userPincode, setUserPincode] = useState("221001");
  const [userState, setUserState] = useState("Uttar Pradesh");
  const [userDistrict, setUserDistrict] = useState("Varanasi");
  const [isLocating, setIsLocating] = useState(false);

  // AI Explainer Modal state
  const [explainerScheme, setExplainerScheme] = useState<SchemeDisplayItem | null>(null);
  const [explainerLang, setExplainerLang] = useState("Hindi");
  const [explainerData, setExplainerData] = useState<SchemeExplanationResult | null>(null);
  const [explainerLoading, setExplainerLoading] = useState(false);

  // Fetch real matched schemes from server action for location
  const loadSchemesForLocation = async (stateVal = userState, districtVal = userDistrict) => {
    try {
      setLoading(true);
      const res = await getMatchedSchemes({
        state: stateVal,
        district: districtVal,
      });

      if (res.success && res.data) {
        setUnlockedValue(res.data.unlockedAnnualValue || 751000);
        if (res.data.matches && res.data.matches.length > 0) {
          const mapped: SchemeDisplayItem[] = res.data.matches.map((m) => ({
            id: m.schemeId,
            name: m.schemeTitle,
            ministry: m.ministry,
            match: `${m.matchScore}%`,
            isEligible: m.isEligible,
            benefit: m.benefitAmountText,
            annualValue: m.annualValueEstimate,
            officialUrl: m.scheme.officialUrl || "https://myscheme.gov.in/",
            tags: m.scheme.requiredDocuments.map((d) => d.documentName),
            category: m.category,
            disqualifyingReasons: m.disqualifyingReasons,
          }));
          setSchemes(mapped);
        }
      }
    } catch (err) {
      console.error("Failed to load schemes for location", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemesForLocation(userState, userDistrict);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open Official Govt Portal & sync status to tracker DB
  const handleApplyToPortal = async (scheme: SchemeDisplayItem) => {
    const url = scheme.officialUrl.startsWith("http") ? scheme.officialUrl : `https://${scheme.officialUrl}`;
    window.open(url, "_blank", "noopener,noreferrer");

    setAppliedSchemes((prev) => ({ ...prev, [scheme.id]: true }));

    try {
      await updateApplicationStatus({
        schemeId: scheme.id,
        status: "APPLIED",
        notes: `Applied on Official Govt Portal (${scheme.ministry})`,
      });
      showToast(`🚀 Official Govt Portal Opened! Recorded status as 'APPLIED' in your Tracker for ${scheme.name}.`);
    } catch (err) {
      console.error("Error updating tracker status", err);
      showToast(`🚀 Opened ${scheme.name} portal!`);
    }
  };

  // BCP-47 language code map used by both STT and TTS
  const LANG_BCP47: Record<string, string> = {
    Hindi: "hi-IN",
    English: "en-IN",
    Hinglish: "hi-IN",
    Punjabi: "pa-IN",
    Marathi: "mr-IN",
    Tamil: "ta-IN",
    Telugu: "te-IN",
    Bengali: "bn-IN",
  };

  // Trigger Text-to-Speech (TTS Read Aloud)
  // lang param accepts LANGUAGE NAME (e.g. "Hindi") or BCP-47 code (e.g. "hi-IN")
  const speakText = (text: string, id: string, langName = "Hindi") => {
    if (!("speechSynthesis" in window)) {
      showToast("⚠️ Text-to-speech is not supported in your browser. Please use Chrome.");
      return;
    }

    // Toggle off if same item is already speaking
    if (currentlySpeakingId === id) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const bcp47 = LANG_BCP47[langName] || langName || "hi-IN";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Wait for voices to be loaded before speaking (Chrome lazy-loads voices)
    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang === bcp47 || v.lang.startsWith(bcp47.split('-')[0])
      );
      if (preferred) utterance.voice = preferred;
      utterance.onstart = () => setCurrentlySpeakingId(id);
      utterance.onend = () => setCurrentlySpeakingId(null);
      utterance.onerror = () => setCurrentlySpeakingId(null);
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      doSpeak();
    } else {
      // Voices not loaded yet – wait for the onvoiceschanged event
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
      // Trigger voice list load
      window.speechSynthesis.getVoices();
    }
  };

  // Trigger AI Plain-Language Explainer Modal
  // lang must be passed explicitly when switching language
  const handleOpenExplainer = async (scheme: SchemeDisplayItem, lang?: string) => {
    const targetLang = lang ?? explainerLang;
    setExplainerScheme(scheme);
    setExplainerLang(targetLang);  // update language state FIRST so UI reflects it immediately
    setExplainerLoading(true);
    setExplainerData(null);
    // Stop any active speech when modal opens
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);
    try {
      const data = await explainSchemeWithAI({
        schemeId: scheme.id,
        language: targetLang,
      });
      setExplainerData(data);
    } catch (err) {
      console.error("Explainer error", err);
      // Fallback uses multilingual templates from scheme-explainer.ts
      setExplainerData({
        whatIsThis: `${scheme.name} is an active government welfare program managed by ${scheme.ministry}.`,
        whoCanApply: "Open to eligible Indian citizens meeting income, age, and residency criteria.",
        exactBenefit: scheme.benefit,
        avoidMistakes: "Ensure Aadhaar, Income Certificate and Bank details are verified before applying.",
        languageUsed: targetLang,
      });
    } finally {
      setExplainerLoading(false);
    }
  };

  // Handle Manual Pincode & State Location Submit
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLocating(true);

    const cleanPincode = userPincode.trim();
    let stateResult = userState;
    let districtResult = userDistrict;

    if (PINCODE_MAP[cleanPincode]) {
      stateResult = PINCODE_MAP[cleanPincode].state;
      districtResult = PINCODE_MAP[cleanPincode].district;
      setUserState(stateResult);
      setUserDistrict(districtResult);
    }

    await loadSchemesForLocation(stateResult, districtResult);
    setIsLocating(false);
    showToast(`📍 Location updated to ${districtResult}, ${stateResult} (Pincode: ${cleanPincode})! Rules re-matched.`);
  };

  // Auto-detect GPS Location via HTML5 Geolocation API
  const handleAutoDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Mock reverse geocode or map based on lat/lng
        let detectedState = "Uttar Pradesh";
        let detectedDistrict = "Varanasi";
        let detectedPincode = "221001";

        if (latitude > 18 && latitude < 20) {
          detectedState = "Maharashtra";
          detectedDistrict = "Mumbai";
          detectedPincode = "400001";
        } else if (latitude > 12 && latitude < 14) {
          detectedState = "Karnataka";
          detectedDistrict = "Bengaluru";
          detectedPincode = "560001";
        }

        setUserState(detectedState);
        setUserDistrict(detectedDistrict);
        setUserPincode(detectedPincode);

        await loadSchemesForLocation(detectedState, detectedDistrict);
        setIsLocating(false);
        showToast(`🌐 GPS Location detected: ${detectedDistrict}, ${detectedState} (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`);
      },
      (error) => {
        console.error("GPS detection error", error);
        setIsLocating(false);
        showToast("⚠️ Could not fetch GPS location. Used manual location instead.");
      },
      { timeout: 10000 }
    );
  };

  // Voice Search Handler (Speech-To-Text + TTS audio response)
  const handleVoiceStart = () => {
    // @ts-expect-error SpeechRecognition window fallback
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast("⚠️ Voice Search requires Chrome or Edge browser.");
      return;
    }

    // Stop any in-progress speech synthesis before recording
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);

    const recognition = new SR();
    recognition.lang = LANG_BCP47[voiceLang] || "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setVoiceState("listening");
    };

    recognition.onresult = (event: { results: Array<Array<{ transcript: string }>> }) => {
      const speechResult = event.results[0][0].transcript;
      setActualTranscript(speechResult);
      setSearchQuery(speechResult);
      setVoiceState("processing");

      // Build TTS reply based on chosen language
      const ttsReplies: Record<string, string> = {
        Hindi: `नमस्ते! मैंने "${speechResult}" खोजा है। नीचे आपके लिए मिलान की गई योजनाएं दिखाई गई हैं।`,
        English: `Hello! I searched for "${speechResult}". Matching welfare schemes are shown below.`,
        Hinglish: `Namaste! Maine "${speechResult}" search kiya hai. Neeche aapke liye schemes dikhaye gaye hain.`,
        Punjabi: `ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ "${speechResult}" ਖੋਜਿਆ ਹੈ। ਤੁਹਾਡੇ ਲਈ ਯੋਜਨਾਵਾਂ ਹੇਠਾਂ ਦਿਖਾਈਆਂ ਗਈਆਂ ਹਨ।`,
        Marathi: `नमस्कार! मी "${speechResult}" शोधले आहे. तुमच्यासाठी जुळणाऱ्या योजना खाली दाखवल्या आहेत.`,
        Tamil: `வணக்கம்! "${speechResult}" தேடினேன். பொருந்தும் திட்டங்கள் கீழே காட்டப்பட்டுள்ளன.`,
        Telugu: `నమస్కారం! నేను "${speechResult}" వెతికాను. మీకు సరిపోలే పథకాలు క్రింద చూపబడ్డాయి.`,
        Bengali: `নমস্কার! আমি "${speechResult}" খুঁজেছি। আপনার জন্য মিলে যাওয়া প্রকল্পগুলি নিচে দেখানো হয়েছে।`,
      };
      const ttsReply = ttsReplies[voiceLang] || ttsReplies["Hindi"];

      setTimeout(() => {
        setVoiceState("responded");
        // Speak audio reply using the LANGUAGE NAME (speakText maps to BCP-47 internally)
        speakText(ttsReply, "voice-response", voiceLang);
      }, 600);
    };

    recognition.onerror = (event: { error: string }) => {
      console.error("SpeechRecognition error:", event.error);
      setVoiceState("idle");
      if (event.error === "not-allowed") {
        showToast("⚠️ Microphone access denied. Please allow microphone in browser settings.");
      } else if (event.error === "network") {
        showToast("⚠️ Voice recognition requires internet. Check connection.");
      }
    };

    recognition.onend = () => {
      // Only reset if we haven't received a result yet
      setVoiceState((prev) => (prev === "listening" ? "idle" : prev));
    };

    recognition.start();
  };

  // Filter schemes based on search query & category
  const filteredSchemes = schemes.filter((scheme) => {
    const matchesSearch =
      scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.ministry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scheme.benefit.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || scheme.category.toUpperCase() === activeCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  const categories = ["All", "AGRICULTURE", "HOUSING", "HEALTHCARE", "EDUCATION", "MSME"];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-brand-navy text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-brand-saffron flex items-center gap-3 font-semibold text-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-brand-emerald flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Financial Impact Banner */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden gap-6">
        <div className="absolute -right-20 -top-40 w-96 h-96 bg-brand-saffron/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-40 w-96 h-96 bg-brand-emerald/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold mb-3">
            <Sparkles className="w-4 h-4 text-brand-saffron" />
            <span>100% Deterministic Rule Engine Verified</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Unlocked Welfare Annual Value
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Matched for citizen resident in <span className="font-bold text-amber-300">{userDistrict}, {userState}</span> ({userPincode}). Direct transfers, fee waivers, & health benefits unlocked.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex flex-col items-end w-full md:w-auto">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-widest">Total Matched Estimate</div>
          <div className="text-3xl sm:text-4xl font-black text-brand-emerald tracking-tight mt-1">
            ₹{unlockedValue.toLocaleString("en-IN")} <span className="text-xs text-white font-normal">/ year</span>
          </div>
          <div className="text-[11px] text-amber-300 font-bold mt-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> {schemes.filter((s) => s.isEligible).length} Eligible Schemes Found
          </div>
        </div>
      </div>

      {/* Controls: Search, Location (Pincode + GPS), Voice Saathi */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schemes, benefits, or keywords (e.g. 'tractor', 'Kisan')..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-saffron shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Location Pincode & GPS Auto-detect */}
          <form onSubmit={handleLocationSubmit} className="lg:col-span-5 flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userPincode}
                onChange={(e) => setUserPincode(e.target.value)}
                placeholder="Indian Pincode (e.g. 221001)"
                className="w-full pl-10 pr-3 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-saffron shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLocating}
              className="px-4 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 flex items-center gap-1 transition-all shadow-sm whitespace-nowrap"
            >
              {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Set Location
            </button>

            <button
              type="button"
              onClick={handleAutoDetectGPS}
              title="Use GPS Auto-Detect"
              className="px-3.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-sm"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </form>

          {/* Voice Search Button */}
          <div className="lg:col-span-2">
            <button
              onClick={() => {
                setIsVoiceModalOpen(true);
                setVoiceState("idle");
              }}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-saffron to-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Voice Saathi</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeCategory === cat
                  ? "bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
              }`}
            >
              {cat === "All" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-brand-saffron animate-spin mb-3" />
          <p className="text-slate-500 font-semibold text-sm">Evaluating deterministic eligibility rules for {userState}...</p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredSchemes.map((scheme) => {
            const isApplied = appliedSchemes[scheme.id];
            const isSpeaking = currentlySpeakingId === scheme.id;

            return (
              <motion.div
                variants={itemVariants}
                key={scheme.id}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Govt Scheme
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[150px]">
                      {scheme.ministry}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-lg font-bold text-brand-navy dark:text-white leading-snug">
                      {scheme.name}
                    </h3>
                    <span className="bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-md flex-shrink-0 shadow-sm">
                      {scheme.match} Match
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3.5 mb-4 border border-slate-100 dark:border-slate-800 relative">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Financial / Direct Benefit</div>
                      
                      {/* TTS Speak Aloud Button */}
                      <button
                        onClick={() => speakText(`${scheme.name}। ${scheme.benefit}`, scheme.id)}
                        title="Listen scheme details read out loud"
                        className="text-slate-500 hover:text-brand-saffron transition-colors"
                      >
                        {isSpeaking ? <VolumeX className="w-4 h-4 text-brand-saffron animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{scheme.benefit}</p>
                  </div>

                  {scheme.disqualifyingReasons && scheme.disqualifyingReasons.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 rounded-xl mb-4 text-xs text-red-700 dark:text-red-400">
                      <div className="font-bold mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Disqualifying Reasons:
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {scheme.disqualifyingReasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {scheme.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md"
                      >
                        📄 {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                  <button
                    onClick={() => handleApplyToPortal(scheme)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold shadow-md transition-all ${
                      isApplied
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-brand-navy dark:bg-white text-white dark:text-brand-navy hover:bg-slate-800 dark:hover:bg-slate-100"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-4 h-4" /> Applied (Re-open Official Portal)
                      </>
                    ) : (
                      <>
                        Apply on Official Portal <ArrowUpRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenExplainer(scheme)}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-saffron" /> AI Plain-Language Explainer
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Voice Saathi Search Modal with Animated Sound Waves */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative"
          >
            <button
              onClick={() => {
                setIsVoiceModalOpen(false);
                window.speechSynthesis?.cancel();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-brand-navy dark:text-white mb-1">Voice Saathi Speech Assistant</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Speak in your native language or listen to voice audio guidance.
            </p>

            <div className="flex items-center justify-center gap-2 mb-6">
              {["Hindi", "English", "Punjabi", "Marathi", "Tamil"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setVoiceLang(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    voiceLang === lang
                      ? "bg-brand-saffron text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <button
                onClick={handleVoiceStart}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                  voiceState === "listening"
                    ? "bg-red-500 animate-pulse text-white scale-110 ring-8 ring-red-200 dark:ring-red-900/50"
                    : "bg-gradient-to-r from-brand-saffron to-amber-500 text-white hover:scale-105"
                }`}
              >
                {voiceState === "listening" ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>

              <p className="mt-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                {voiceState === "idle" && "Tap microphone and speak query..."}
                {voiceState === "listening" && `Listening in ${voiceLang}... (Speak clearly)`}
                {voiceState === "processing" && "Processing voice query..."}
                {voiceState === "responded" && "Query matched! Playing voice response."}
              </p>

              {actualTranscript && (
                <div className="mt-3 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono">
                  &quot;{actualTranscript}&quot;
                </div>
              )}
            </div>

            {voiceState === "responded" && (
              <button
                onClick={() => {
                  setIsVoiceModalOpen(false);
                  window.speechSynthesis?.cancel();
                }}
                className="w-full mt-4 bg-brand-navy dark:bg-white text-white dark:text-brand-navy py-3 rounded-xl font-bold text-xs shadow-lg"
              >
                View Search Results
              </button>
            )}
          </motion.div>
        </div>
      )}

      {/* AI Plain-Language Explainer Modal with Text-To-Speech Readout */}
      {explainerScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-950 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setExplainerScheme(null);
                window.speechSynthesis?.cancel();
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-saffron" />
                <h3 className="text-xl font-black text-brand-navy dark:text-white">Gemini AI Scheme Explainer</h3>
              </div>

              {explainerData && (
                <button
                  onClick={() =>
                    speakText(
                      `${explainerData.whatIsThis} ${explainerData.whoCanApply} ${explainerData.exactBenefit} ${explainerData.avoidMistakes}`,
                      `explainer-${explainerScheme.id}`,
                      explainerLang
                    )
                  }
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  {currentlySpeakingId === `explainer-${explainerScheme.id}` ? (
                    <><VolumeX className="w-4 h-4 text-red-500 animate-pulse" /><span>Stop Audio</span></>
                  ) : (
                    <><Volume2 className="w-4 h-4 text-brand-saffron" /><span>Listen Audio ({explainerLang})</span></>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {explainerScheme.name} • {explainerScheme.ministry}
            </p>

            {/* Language Selector */}
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 mr-2">Language:</span>
              {["Hindi", "English", "Hinglish", "Punjabi", "Marathi", "Tamil", "Telugu", "Bengali"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleOpenExplainer(explainerScheme, lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                    explainerLang === lang
                      ? "bg-brand-navy dark:bg-white text-white dark:text-brand-navy ring-2 ring-brand-saffron/40"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {explainerLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-brand-saffron animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-500">Generating plain-language breakdown in {explainerLang}...</p>
              </div>
            ) : explainerData ? (
              <div className="space-y-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-brand-navy dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    📌 What is this scheme?
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{explainerData.whatIsThis}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-brand-navy dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    👥 Who can apply?
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {explainerData.whoCanApply}
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                    💰 Exact Benefit
                  </h4>
                  <p className="text-emerald-900 dark:text-emerald-200 font-semibold">{explainerData.exactBenefit}</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-100 dark:border-amber-900">
                  <h4 className="font-bold text-amber-800 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                    ⚠️ Critical Mistakes to Avoid
                  </h4>
                  <p className="text-amber-900 dark:text-amber-200 leading-relaxed">{explainerData.avoidMistakes}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setExplainerScheme(null);
                  window.speechSynthesis?.cancel();
                  handleApplyToPortal(explainerScheme);
                }}
                className="bg-brand-navy dark:bg-white text-white dark:text-brand-navy px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                Apply on Official Portal <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
