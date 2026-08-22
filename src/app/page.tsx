"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  CheckCircle2,
  Search,
  SlidersHorizontal,
  LayoutList,
  FileCheck,
  FolderSearch,
  Mic,
  Calculator,
  Printer,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  Globe,
  User as UserIcon,
  MapPin,
  CalendarDays,
  Shield,
  Loader2,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AuthTab = "login" | "signup";
type LoginMethod = "email" | "otp";

const authSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  phoneNumber: z.string().optional(),
  otp: z.string().optional(),
  name: z.string().optional(),
  state: z.string().optional(),
  gender: z.string().optional(),
  caste: z.string().optional(),
  age: z.string().optional(),
  profession: z.string().optional(),
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function LandingPage() {
  const router = useRouter();
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string>("");
  const [apiError, setApiError] = useState<string>("");
  
  // Language selector state
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState("EN");
  
  const languages = [
    { code: "EN", name: "English" },
    { code: "HI", name: "Hindi (हिंदी)" },
    { code: "PA", name: "Punjabi (ਪੰਜਾਬੀ)" },
    { code: "TA", name: "Tamil (தமிழ்)" },
    { code: "TE", name: "Telugu (తెలుగు)" },
    { code: "AW", name: "Awadhi (अवधी)" },
    { code: "BH", name: "Bhojpuri (भोजपुरी)" },
    { code: "MR", name: "Marathi (मराठी)" },
    { code: "MW", name: "Marwari (मारवाड़ी)" }
  ];

  const handleLanguageSelect = (langCode: string) => {
    setActiveLang(langCode);
    setIsLangOpen(false);
    
    const gtMap: Record<string, string> = {
      "EN": "en", "HI": "hi", "PA": "pa", "TA": "ta", "TE": "te",
      "AW": "hi", "BH": "bho", "MR": "mr", "MW": "hi"
    };
    
    const gtCode = gtMap[langCode] || "en";
    document.cookie = `googtrans=/en/${gtCode}; path=/`;
    
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = gtCode;
      select.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else {
      window.location.reload();
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
    setValue
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      phoneNumber: "",
      otp: "",
      name: "",
      state: "",
      gender: "",
      caste: "",
      age: "",
      profession: ""
    }
  });

  // Handle OTP Send
  const handleSendOtp = async () => {
    setApiError("");
    const target = getValues("phoneNumber")?.trim() || getValues("email")?.trim();
    if (!target) {
      setApiError("Please enter a valid mobile number or email address.");
      return;
    }
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiError(data.error || "Failed to send OTP.");
        return;
      }
      setDevOtp(data.devOtp || "");
      setOtpSent(true);
    } catch {
      setApiError("Network error while sending OTP.");
    }
  };

  // Main Form Submit Handler
  const onSubmit = async (data: AuthFormValues) => {
    setApiError("");
    const { signIn } = await import("next-auth/react");

    // 1. EMAIL & PASSWORD LOGIN
    if (authTab === "login" && loginMethod === "email") {
      const emailVal = data.email?.trim();
      const passwordVal = data.password;

      if (!emailVal || !passwordVal) {
        setApiError("Please enter both email address and password.");
        return;
      }

      const res = await signIn("credentials", {
        email: emailVal,
        password: passwordVal,
        redirect: false,
      });

      if (res?.error) {
        setApiError("Invalid email or password. Try demo: demo@yojanasetu.in");
        return;
      }

      document.cookie = "auth_token=1; path=/; max-age=86400";
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // 2. OTP LOGIN OR SIGNUP
    if (!otpSent) {
      await handleSendOtp();
      return;
    }

    const identifierVal = data.phoneNumber?.trim() || data.email?.trim() || "";
    const otpVal = data.otp?.trim() || "";

    if (!otpVal || otpVal.length !== 6) {
      setApiError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifierVal, otp: otpVal }),
      });
      const resData = await res.json();
      if (!res.ok) {
        setApiError(resData.error || "Invalid OTP.");
        return;
      }

      const signInRes = await signIn("otp", {
        identifier: identifierVal,
        verified: "true",
        redirect: false,
      });

      if (signInRes?.error) {
        setApiError("Authentication failed. Please try again.");
        return;
      }

      if (authTab === "signup") {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent('updateProfile', { detail: data }));
        }
      }
      
      document.cookie = "auth_token=1; path=/; max-age=86400";
      router.push("/dashboard");
      router.refresh();
    } catch {
      setApiError("Something went wrong. Please try again.");
    }
  };

  // Demo Account One-Click Login Shortcut
  const handleDemoLogin = async () => {
    setApiError("");
    const { signIn } = await import("next-auth/react");
    const res = await signIn("credentials", {
      email: "demo@yojanasetu.in",
      password: "Demo@12345",
      redirect: false,
    });
    if (res?.error) {
      router.push("/dashboard");
    } else {
      document.cookie = "auth_token=1; path=/; max-age=86400";
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-y-auto overflow-x-hidden flex flex-col font-sans bg-black text-white">
      
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat blur-[3px] brightness-75 scale-105"
          style={{ backgroundImage: "url('/cover.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <nav className="relative z-50 w-full px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image 
            src="https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg" 
            alt="Indian Flag" 
            width={40}
            height={27}
            className="w-10 h-auto rounded shadow-sm border border-white/20"
          />
          <h1 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Yojana Setu</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-lg font-bold transition-colors shadow-lg"
            >
              <Globe className="w-5 h-5" />
              <span>{activeLang} ▾</span>
            </button>
            
            {isLangOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="py-2 max-h-64 overflow-y-auto">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors ${activeLang === lang.code ? 'bg-orange-500/20 text-orange-400' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <Button className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg px-6 shadow-md border border-orange-600">
            Apply / Contact Us
          </Button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-start pt-10 pb-20 w-full gap-16">
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 w-full px-4 md:px-12 max-w-7xl mx-auto">
          
          <div className="hidden lg:block max-w-sm">
            <h2 className="text-4xl font-black drop-shadow-xl leading-tight mb-4 text-white">
              Bridging the Gap<br/>Between Citizens<br/>and Government<br/>Schemes.
            </h2>
            <p className="text-lg font-bold text-white/90 drop-shadow-md">
              Discover, check eligibility, and apply for government schemes effortlessly.
            </p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md z-20"
          >
            <div className="bg-black/20 backdrop-blur-2xl border border-white/30 shadow-2xl rounded-3xl p-8 relative overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              
              <div className="relative z-10">
                
                {/* LOGIN / SIGNUP TABS */}
                {!otpSent && (
                  <div className="flex w-full mb-5 bg-black/40 p-1 rounded-xl border border-white/10">
                    <button 
                      type="button"
                      suppressHydrationWarning
                      onClick={() => { setAuthTab("login"); setApiError(""); }}
                      className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-colors ${authTab === "login" ? "bg-orange-500 text-white shadow-md" : "text-white/70 hover:text-white"}`}
                    >
                      LOGIN
                    </button>
                    <button 
                      type="button"
                      suppressHydrationWarning
                      onClick={() => { setAuthTab("signup"); setApiError(""); }}
                      className={`flex-1 py-2.5 text-sm font-black rounded-lg transition-colors ${authTab === "signup" ? "bg-orange-500 text-white shadow-md" : "text-white/70 hover:text-white"}`}
                    >
                      SIGN UP
                    </button>
                  </div>
                )}

                {/* LOGIN METHOD SWITCHER: EMAIL vs OTP */}
                {authTab === "login" && !otpSent && (
                  <div className="flex rounded-lg bg-black/30 p-1 mb-5 border border-white/10 gap-1">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => { setLoginMethod("email"); setApiError(""); }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        loginMethod === "email" ? "bg-white/20 text-white shadow" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email & Password
                    </button>
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={() => { setLoginMethod("otp"); setApiError(""); }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                        loginMethod === "otp" ? "bg-white/20 text-white shadow" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Mobile / OTP
                    </button>
                  </div>
                )}

                {otpSent && (
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-white tracking-wide">VERIFY OTP</h3>
                    <p className="text-sm font-medium text-white/80 mt-1">Code sent to {getValues("phoneNumber") || getValues("email")}</p>
                    {devOtp && (
                      <div className="mt-3 bg-orange-500/20 border border-orange-500/40 rounded-xl px-3 py-1.5 inline-flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-bold text-orange-300">Dev OTP: <span className="font-mono text-white text-sm font-black">{devOtp}</span></span>
                      </div>
                    )}
                  </div>
                )}

                {apiError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs font-bold text-red-300 text-center">
                    ⚠️ {apiError}
                  </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  
                  <AnimatePresence mode="wait">
                    {/* 1. EMAIL LOGIN FORM */}
                    {authTab === "login" && loginMethod === "email" && !otpSent && (
                      <motion.div
                        key="email-login"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-bold text-white/80 mb-1">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-white/80" />
                            <Input 
                              type="email" 
                              placeholder="you@example.com" 
                              className="pl-11 bg-black/30 border-white/20 text-white placeholder:text-white/60 h-11 rounded-xl focus-visible:ring-orange-400 font-bold"
                              {...register("email")}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-white/80 mb-1">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-white/80" />
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              className="pl-11 pr-10 bg-black/30 border-white/20 text-white placeholder:text-white/60 h-11 rounded-xl focus-visible:ring-orange-400 font-bold"
                              {...register("password")}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3.5 text-white/60 hover:text-white"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 2. OTP / PHONE / EMAIL SIGNUP FORM */}
                    {(authTab === "signup" || loginMethod === "otp") && !otpSent && (
                      <motion.div 
                        key="otp-form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        {authTab === "signup" && (
                          <div className="space-y-3">
                            <div className="relative">
                              <UserIcon className="absolute left-4 top-3 h-4 w-4 text-white/80" />
                              <Input placeholder="Full Name" required className="pl-11 bg-black/30 border-white/20 text-white placeholder:text-white/60 font-bold" {...register("name")} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/80" />
                                <Input placeholder="State" required className="pl-9 bg-black/30 border-white/20 text-white placeholder:text-white/60 font-bold" {...register("state")} />
                              </div>
                              <select required className="bg-black/30 border border-white/20 text-white font-bold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400" {...register("gender")}>
                                <option value="" disabled className="text-black">Gender</option>
                                <option value="Male" className="text-black">Male</option>
                                <option value="Female" className="text-black">Female</option>
                                <option value="Other" className="text-black">Other</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="relative">
                                <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-white/80" />
                                <Input type="number" placeholder="Age" required className="pl-9 bg-black/30 border-white/20 text-white placeholder:text-white/60 font-bold" {...register("age")} />
                              </div>
                              <select required className="bg-black/30 border border-white/20 text-white font-bold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400" {...register("caste")}>
                                <option value="" disabled className="text-black">Caste</option>
                                <option value="General" className="text-black">Gen</option>
                                <option value="OBC" className="text-black">OBC</option>
                                <option value="SC/ST" className="text-black">SC/ST</option>
                              </select>
                            </div>
                            <select required className="w-full bg-black/30 border border-white/20 text-white font-bold rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400" {...register("profession")}>
                                <option value="" disabled className="text-black">Select Profession</option>
                                <option value="Student" className="text-black">Student</option>
                                <option value="Govt Employee" className="text-black">Govt Employee</option>
                                <option value="Farmer" className="text-black">Farmer</option>
                                <option value="Businessman" className="text-black">Businessman</option>
                                <option value="Teacher" className="text-black">Teacher</option>
                                <option value="Private Employee" className="text-black">Private Employee</option>
                                <option value="Unemployed" className="text-black">Unemployed</option>
                            </select>
                          </div>
                        )}

                        <div className="relative flex items-center">
                          <Phone className="absolute left-4 top-3.5 h-5 w-5 text-white/80" />
                          <Input 
                            placeholder="Mobile number or Email address" 
                            className="pl-12 bg-black/30 border-white/20 text-white placeholder:text-white/60 h-12 rounded-xl focus-visible:ring-orange-400 font-bold text-base transition-all"
                            {...register("phoneNumber")}
                          />
                        </div>
                      </motion.div>
                    )}

                    {/* 3. OTP VERIFICATION BOX */}
                    {otpSent && (
                      <motion.div 
                        key="otp-step"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-1"
                      >
                        <div className="relative">
                          <KeyRound className="absolute left-4 top-3.5 h-5 w-5 text-white/80" />
                          <Input 
                            type="text"
                            placeholder="Enter 6-digit OTP" 
                            className="pl-12 bg-black/30 border-white/20 text-white placeholder:text-white/60 h-12 rounded-xl focus-visible:ring-orange-400 font-bold text-lg tracking-widest"
                            maxLength={6}
                            {...register("otp")}
                          />
                        </div>
                        <div className="flex justify-between items-center px-2 pt-2">
                          <button type="button" onClick={() => setOtpSent(false)} className="text-xs font-bold text-white/70 hover:text-white transition-colors">
                            Change Details
                          </button>
                          <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">
                            Resend Code
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-lg h-12 rounded-xl shadow-lg border border-orange-600 transition-transform active:scale-95" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Authenticating...
                      </span>
                    ) : (
                      <>
                        {authTab === "login" && loginMethod === "email"
                          ? "Sign In with Email"
                          : (!otpSent ? "Send OTP" : `Verify & ${authTab === 'login' ? 'Login' : 'Register'}`)}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>

                  {/* ONE-CLICK DEMO ACCOUNT */}
                  <div className="pt-2">
                    <button
                      type="button"
                      suppressHydrationWarning
                      onClick={handleDemoLogin}
                      className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                      Try Demo Citizen Account (1-Click)
                    </button>
                  </div>
                  
                </form>
              </div>
            </div>
          </motion.div>
          
        </div>

        {/* Floating Horizontal Marquee for Popular Schemes */}
        <div className="w-full mt-4 overflow-hidden relative py-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent z-10" />
          
          <motion.div 
            animate={{ x: [0, -1032] }}
            transition={{ ease: "linear", duration: 30, repeat: Infinity }}
            className="flex gap-6 w-max"
          >
            {[1, 2].map((group) => (
              <React.Fragment key={group}>
                <div className="w-80 bg-black/20 backdrop-blur-2xl border border-white/20 shadow-xl rounded-2xl p-5 hover:bg-black/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-emerald-500/90 text-white border-none font-bold px-3 py-1 shadow-md">Agriculture</Badge>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">PM Kisan Samman Nidhi</h4>
                  <div className="text-emerald-400 font-black">₹6,000 / Year</div>
                </div>

                <div className="w-80 bg-black/20 backdrop-blur-2xl border border-white/20 shadow-xl rounded-2xl p-5 hover:bg-black/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-indigo-500/90 text-white border-none font-bold px-3 py-1 shadow-md">Education</Badge>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Post Matric Scholarship</h4>
                  <div className="text-indigo-300 font-black">Full Tuition</div>
                </div>

                <div className="w-80 bg-black/20 backdrop-blur-2xl border border-white/20 shadow-xl rounded-2xl p-5 hover:bg-black/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-orange-500/90 text-white border-none font-bold px-3 py-1 shadow-md">Finance</Badge>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white mb-1">Mudra Yojana</h4>
                  <div className="text-orange-400 font-black">Up to ₹10L</div>
                </div>
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* Comprehensive Features Section */}
        <div className="w-full max-w-7xl mx-auto px-4 md:px-12 mt-8 mb-12">
          <div className="bg-black/30 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <h3 className="text-3xl font-black text-white text-center mb-12 tracking-tight drop-shadow-md">Everything You Need in One Place</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              
              <div className="flex flex-col items-start space-y-3">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Discover Schemes</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  View matched and recommended schemes tailored specifically to your citizen profile.
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
                  <SlidersHorizontal className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">My Eligibility Sandbox</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  Interactive sliders to simulate &quot;What-If&quot; scenarios (e.g., adjust income or age to see real-time eligibility updates).
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                  <LayoutList className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Application Tracker</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  Track the status of your saved applications in real-time (e.g., Applied, Under Review, Approved).
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3">
                <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 border border-orange-500/30">
                  <FileCheck className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Document Checklist</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  A personalized list of required documents with readiness tracking (e.g., &quot;75% Complete&quot;).
                </p>
              </div>

              <div className="flex flex-col items-start space-y-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">
                  <FolderSearch className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-white">Scheme Explorer</h4>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  A comprehensive, highly searchable directory of all available government schemes.
                </p>
              </div>
              
            </div>
            
            <hr className="border-white/10 my-12" />
            
            <h3 className="text-2xl font-black text-white mb-8 tracking-tight drop-shadow-md">High-Impact Innovations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">Multilingual Voice Search</h4>
                </div>
                <p className="text-white/80 text-sm font-medium">
                  Allows users to search for schemes by speaking in regional languages like Hindi, Punjabi, or Hinglish.
                </p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">Value Calculator</h4>
                </div>
                <p className="text-white/80 text-sm font-medium">
                  Instantly shows the cumulative financial benefit matched to the user&apos;s profile (e.g., ₹58,000/yr Cash + ₹5L Health Cover).
                </p>
              </div>
              
              <div className="bg-white/10 p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition-colors shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Printer className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-lg font-bold text-white">CSC-Friendly Export</h4>
                </div>
                <p className="text-white/80 text-sm font-medium">
                  Generate 1-page PDF summaries or share document checklists via WhatsApp for easy printing at Common Service Centres.
                </p>
              </div>

            </div>
          </div>
        </div>

      </main>

    </div>
  );
}
