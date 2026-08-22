'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle, Upload, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

interface Nudge {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  tabTarget?: string;
  staleDays?: number;
}

const NUDGE_STORAGE_KEY = 'yojanasetu_nudge_dismissed';

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(NUDGE_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) dismissed.push(id);
  localStorage.setItem(NUDGE_STORAGE_KEY, JSON.stringify(dismissed));
}

// Generate contextual nudges based on localStorage state
function generateNudges(): Nudge[] {
  const nudges: Nudge[] = [];
  const dismissed = getDismissed();

  const nudge1: Nudge = {
    id: 'nudge-caste-expired',
    type: 'warning',
    title: '⚠️ Caste Certificate Expired',
    message: 'Your Caste Certificate (SC/ST/OBC) expired in 2022. PM-Kisan & MUDRA applications require a valid one.',
    action: 'Upload New Certificate →',
    tabTarget: 'documents',
  };

  const nudge2: Nudge = {
    id: 'nudge-khatauni-pending',
    type: 'warning',
    title: '📄 Land Khatauni Still Pending',
    message: 'Your application for PM-Kisan is stuck because Land Records are missing. This has been pending for 7+ days.',
    action: 'Go to Document Checklist →',
    tabTarget: 'documents',
  };

  const nudge3: Nudge = {
    id: 'nudge-ayushman-match',
    type: 'info',
    title: '🏥 You Match Ayushman Bharat — Act Now!',
    message: 'Based on your income profile (₹1.8L/year), you qualify for ₹5 Lakh health coverage. Enrollment closing soon.',
    action: 'Start Application →',
    tabTarget: 'tracker',
  };

  const nudge4: Nudge = {
    id: 'nudge-docs-complete',
    type: 'success',
    title: '✅ Document Readiness: 83%',
    message: 'You\'re almost ready! Just upload your Caste Certificate and Land Khatauni to unlock 3 more schemes.',
    action: 'Complete Checklist →',
    tabTarget: 'documents',
  };

  [nudge1, nudge2, nudge3, nudge4].forEach((n) => {
    if (!dismissed.includes(n.id)) nudges.push(n);
  });

  return nudges;
}

export default function SmartNudgeBar() {
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Delay showing nudges for 3 seconds after page load
    const t = setTimeout(() => {
      const generated = generateNudges();
      if (generated.length > 0) {
        setNudges(generated);
        setVisible(true);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Auto-rotate nudges every 8 seconds
  useEffect(() => {
    if (!visible || nudges.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % nudges.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [visible, nudges.length]);

  const handleDismiss = (id: string) => {
    dismiss(id);
    const remaining = nudges.filter((n) => n.id !== id);
    setNudges(remaining);
    if (remaining.length === 0) setVisible(false);
    else setCurrent((prev) => Math.min(prev, remaining.length - 1));
  };

  const handleAction = (nudge: Nudge) => {
    if (nudge.tabTarget) {
      window.dispatchEvent(new CustomEvent('changeTab', { detail: nudge.tabTarget }));
    }
    handleDismiss(nudge.id);
  };

  const nudge = nudges[current];
  if (!visible || !nudge) return null;

  const iconColor = nudge.type === 'warning' ? 'text-amber-500' : nudge.type === 'success' ? 'text-emerald-500' : 'text-blue-500';
  const bgColor = nudge.type === 'warning'
    ? 'bg-amber-50/95 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800'
    : nudge.type === 'success'
    ? 'bg-emerald-50/95 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800'
    : 'bg-blue-50/95 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`fixed top-[72px] left-1/2 -translate-x-1/2 z-[90] w-[calc(100vw-2rem)] max-w-2xl border rounded-2xl shadow-xl backdrop-blur-md px-4 py-3 flex items-center gap-3 ${bgColor}`}
        >
          {nudge.type === 'warning' ? (
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          ) : nudge.type === 'success' ? (
            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          ) : (
            <Bell className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-tight">{nudge.title}</p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-1">{nudge.message}</p>
          </div>

          {nudge.action && (
            <button
              onClick={() => handleAction(nudge)}
              className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-black px-3 py-1.5 rounded-xl transition-all ${
                nudge.type === 'warning'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : nudge.type === 'success'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {nudge.action}
            </button>
          )}

          <div className="flex items-center gap-1 flex-shrink-0">
            {nudges.length > 1 && (
              <span className="text-[10px] text-slate-400 font-medium">{current + 1}/{nudges.length}</span>
            )}
            <button
              onClick={() => handleDismiss(nudge.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-black/5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
