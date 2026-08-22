'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle,
  CheckCircle2, Phone, Shield, RefreshCw, MessageSquare
} from 'lucide-react';

type LoginMode = 'password' | 'otp';
type OtpStep = 'identifier' | 'verify';

export default function LoginPage() {
  const router = useRouter();

  // ── Mode: password vs OTP ──────────────────────────────────────────────────
  const [mode, setMode] = useState<LoginMode>('otp');

  // ── Password login state ───────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP login state ────────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState<OtpStep>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtp, setDevOtp] = useState('');     // shown in dev mode
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── Mobile SMS Push Notification Toast State ──────────────────────────────
  const [smsToast, setSmsToast] = useState<{ message: string; otpCode: string; realSmsSent?: boolean } | null>(null);

  // ── Shared state ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── OTP countdown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const isPhone = (val: string) => /^[6-9]\d{9}$/.test(val.replace(/\s/g, ''));
  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const otpString = otp.join('');

  // ── Auto-fill helper from SMS Toast ───────────────────────────────────────
  const handleAutoFillOtp = (code: string) => {
    if (!code || code.length !== 6) return;
    const digits = code.split('');
    setOtp(digits);
    setSmsToast(null);
    otpRefs.current[5]?.focus();
  };

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const id = identifier.trim();
    if (!isPhone(id) && !isEmail(id)) {
      setError('Enter a valid 10-digit mobile number or email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send OTP.'); return; }
      
      const generatedOtp = data.devOtp || '';
      setDevOtp(generatedOtp);
      setOtpStep('verify');
      setCountdown(60);

      // Trigger realistic mobile SMS push notification toast if mobile number
      if (data.isMobile && generatedOtp) {
        setSmsToast({
          message: data.realSmsSent 
            ? `📲 SMS sent to +91 ${id.slice(-10)} via SMS gateway!`
            : `📲 SMS Received on +91 ${id.slice(-10)}: "Your OTP for Yojana Setu is ${generatedOtp}."`,
          otpCode: generatedOtp,
          realSmsSent: data.realSmsSent
        });
      }

      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setDevOtp('');
    setSmsToast(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to resend OTP.'); return; }
      const generatedOtp = data.devOtp || '';
      setDevOtp(generatedOtp);
      setCountdown(60);

      if (data.isMobile && generatedOtp) {
        setSmsToast({
          message: data.realSmsSent 
            ? `📲 SMS sent to +91 ${identifier.trim().slice(-10)} via SMS gateway!`
            : `📲 SMS Received on +91 ${identifier.trim().slice(-10)}: "Your OTP for Yojana Setu is ${generatedOtp}."`,
          otpCode: generatedOtp,
          realSmsSent: data.realSmsSent
        });
      }

      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP box key handling ───────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  // ── Verify OTP & Sign In ───────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpString.length < 6) { setError('Please enter all 6 digits of the OTP.'); return; }
    setLoading(true);
    try {
      // Step 1: Verify OTP with our API
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp: otpString }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Invalid OTP.'); return; }

      // Step 2: Sign in via NextAuth OTP provider
      const { signIn } = await import('next-auth/react');
      const result = await signIn('otp', {
        identifier: identifier.trim(),
        verified: 'true',
        redirect: false,
      });
      if (result?.error) {
        setError('Authentication failed. Please try again.');
      } else {
        setSuccess('OTP verified! Redirecting...');
        setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 800);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password Sign In ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const { signIn } = await import('next-auth/react');
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { signIn } = await import('next-auth/react');
      await signIn('credentials', { email: 'demo@yojanasetu.in', password: 'Demo@12345', redirect: false });
      router.push('/dashboard');
    } catch { router.push('/dashboard'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">

      {/* 📱 Mobile SMS Push Notification Banner */}
      <AnimatePresence>
        {smsToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[150] w-[calc(100vw-2rem)] max-w-md bg-slate-900/95 dark:bg-slate-950/95 border border-amber-500/40 text-white rounded-2xl shadow-2xl backdrop-blur-md p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-saffron to-amber-500 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-saffron">
                    MESSAGES • YOJANA-SETU
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Just now</span>
                </div>
                <p className="text-xs font-semibold text-slate-100 mt-1 leading-relaxed">
                  {smsToast.message}
                </p>
                {smsToast.otpCode && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {smsToast.otpCode}
                    </span>
                    <button
                      onClick={() => handleAutoFillOtp(smsToast.otpCode)}
                      className="text-xs font-bold bg-brand-saffron hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      ⚡ Auto-fill OTP
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-saffron/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-saffron to-amber-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-sm">YS</span>
          </div>
          <span className="font-black text-2xl tracking-tight text-brand-navy dark:text-white">
            Yojana<span className="text-brand-saffron">Setu</span>
          </span>
        </Link>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800/80">

          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-brand-saffron" />
            <h1 className="text-2xl font-black text-brand-navy dark:text-white">
              {mode === 'otp' ? (otpStep === 'identifier' ? 'Login with OTP' : 'Verify OTP') : 'Welcome Back'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {mode === 'otp'
              ? otpStep === 'identifier'
                ? 'Enter your mobile number or email to receive a one-time password.'
                : `OTP sent to ${identifier}. Valid for 5 minutes.`
              : 'Sign in with your email and password.'}
          </p>

          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-6 gap-1">
            <button
              onClick={() => { setMode('otp'); setOtpStep('identifier'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'otp'
                  ? 'bg-white dark:bg-slate-700 text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> OTP Login
            </button>
            <button
              onClick={() => { setMode('password'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === 'password'
                  ? 'bg-white dark:bg-slate-700 text-brand-navy dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Password
            </button>
          </div>

          {/* Error / Success */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="err" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-semibold mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </motion.div>
            )}
            {success && (
              <motion.div key="ok" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-xl text-sm font-semibold mb-5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />{success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── OTP Flow ── */}
          <AnimatePresence mode="wait">
            {mode === 'otp' && (
              <motion.div key={otpStep} initial={{ opacity: 0, x: otpStep === 'verify' ? 30 : -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

                {otpStep === 'identifier' ? (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label htmlFor="otp-identifier" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                        Mobile Number or Email
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="otp-identifier"
                          type="text"
                          inputMode="tel"
                          autoComplete="tel"
                          value={identifier}
                          onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                          placeholder="e.g. 9876543210 or you@email.com"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-saffron/50 focus:border-brand-saffron transition-all"
                        />
                      </div>
                    </div>

                    <button type="submit" disabled={loading} id="send-otp-btn"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-saffron to-amber-500 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    {/* Dev OTP hint */}
                    {devOtp && (
                      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Dev Mode — Your OTP</p>
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 tracking-[0.3em]">{devOtp}</p>
                        </div>
                      </div>
                    )}

                    {/* 6-digit OTP boxes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-3 uppercase tracking-wider text-center">
                        Enter 6-Digit OTP
                      </label>
                      <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { otpRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className={`w-11 h-14 text-center text-xl font-black rounded-xl border-2 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none transition-all ${
                              digit
                                ? 'border-brand-saffron bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-slate-200 dark:border-slate-700 focus:border-brand-saffron'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <button type="submit" disabled={loading || otpString.length < 6} id="verify-otp-btn"
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-saffron to-amber-500 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : <><CheckCircle2 className="w-4 h-4" /> Verify & Login</>}
                    </button>

                    {/* Resend + Back */}
                    <div className="flex items-center justify-between text-xs">
                      <button type="button" onClick={() => { setOtpStep('identifier'); setOtp(['','','','','','']); setError(''); setDevOtp(''); setSmsToast(null); }}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-semibold">
                        ← Change Number
                      </button>
                      <button type="button" onClick={handleResend} disabled={countdown > 0}
                        className={`flex items-center gap-1 font-bold transition-colors ${countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-brand-saffron hover:text-amber-600'}`}>
                        <RefreshCw className="w-3 h-3" />
                        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── Password Flow ── */}
            {mode === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  <div>
                    <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="login-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-saffron/50 focus:border-brand-saffron transition-all" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-saffron/50 focus:border-brand-saffron transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} id="login-submit-btn"
                    className="w-full flex items-center justify-center gap-2 bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-black py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-60">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 font-semibold">OR</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>

          {/* Demo Login */}
          <button onClick={handleDemoLogin} disabled={loading} id="demo-login-btn"
            className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold py-3 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-all text-sm disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" /> Try Demo Account (No Sign Up Needed)
          </button>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            New to Yojana Setu?{' '}
            <Link href="/register" className="text-brand-saffron hover:text-amber-600 font-bold">
              Create free account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
