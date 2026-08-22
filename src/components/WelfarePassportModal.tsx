'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, Download, X, CheckCircle2, Shield, Landmark, IndianRupee, Sparkles, Printer, QrCode
} from 'lucide-react';
import { getRealtimeState } from '@/lib/realtimeSync';

interface WelfarePassportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userState?: string;
}

export default function WelfarePassportModal({
  isOpen,
  onClose,
  userName = 'Harshit',
  userState = 'Uttar Pradesh',
}: WelfarePassportModalProps) {
  if (!isOpen) return null;

  const realtimeState = getRealtimeState();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white print:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4 print:hidden">
          <Award className="w-6 h-6 text-brand-saffron" />
          <div>
            <h3 className="text-xl font-black text-brand-navy dark:text-white">Citizen Welfare Passport</h3>
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
              ADD-ON • Verified Benefit Credential
            </span>
          </div>
        </div>

        {/* ── PRINTABLE PASSPORT CARD ── */}
        <div className="bg-gradient-to-br from-brand-navy via-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden border border-white/10">
          <div className="absolute -right-20 -top-20 w-60 h-60 bg-brand-saffron/20 rounded-full blur-2xl" />
          <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-brand-emerald/20 rounded-full blur-2xl" />

          {/* Top Seal */}
          <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-saffron to-amber-500 flex items-center justify-center font-black text-white text-base shadow-md">
                YS
              </div>
              <div>
                <h4 className="font-black text-base tracking-tight leading-tight">Yojana Setu (योजना सेतु)</h4>
                <p className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Government Welfare Passport</p>
              </div>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
              VERIFIED CITIZEN
            </div>
          </div>

          {/* Citizen & Benefits Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Citizen Name</p>
              <p className="font-black text-lg text-white">{userName}</p>
              <p className="text-xs text-slate-300">{userState}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unlocked Annual Value</p>
              <p className="font-black text-2xl text-brand-emerald">₹{realtimeState.unlockedAnnualValue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Schemes Summary */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 space-y-2 mb-6">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Active Scheme Matches</p>
            {[
              { name: 'PM-Kisan Samman Nidhi', benefit: '₹6,000 / year' },
              { name: 'Ayushman Bharat PM-JAY', benefit: '₹5,00,000 Health Cover' },
              { name: 'PM Awas Yojana (Gramin)', benefit: '₹1,20,000 Construction Grant' },
            ].map((s) => (
              <div key={s.name} className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-200">{s.name}</span>
                <span className="font-bold text-brand-saffron">{s.benefit}</span>
              </div>
            ))}
          </div>

          {/* Footer QR Code Verification */}
          <div className="flex items-center justify-between border-t border-white/15 pt-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-900" />
              </div>
              <div>
                <p className="font-bold text-white text-xs">QR Verification Code</p>
                <p className="text-[10px] text-slate-400">Scan at CSC / Tehsil Office</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400">Issued Date</p>
              <p className="font-bold text-white">22-Aug-2026</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
