'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCompare, CheckCircle2, XCircle, Award, AlertTriangle, Sparkles } from 'lucide-react';

interface SchemeCompareItem {
  id: string;
  name: string;
  ministry: string;
  benefit: string;
  annualValue: number;
  eligibility: string;
  docs: string[];
  processingDays: string;
  matchScore: number;
  category: string;
}

interface SchemeCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_SCHEMES: SchemeCompareItem[] = [
  {
    id: 's1',
    name: 'PM-Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture',
    benefit: '₹6,000 / year (3 instalments)',
    annualValue: 6000,
    eligibility: 'Small/marginal farmers with land < 2 hectares',
    docs: ['Aadhaar', 'Land Khatauni', 'Bank Passbook'],
    processingDays: '15–30 days',
    matchScore: 92,
    category: 'Agriculture',
  },
  {
    id: 's2',
    name: 'Ayushman Bharat PM-JAY',
    ministry: 'Ministry of Health',
    benefit: '₹5,00,000 health cover / year',
    annualValue: 500000,
    eligibility: 'Low-income families in SECC database',
    docs: ['Aadhaar', 'Ration Card (NFSA)', 'Income Certificate'],
    processingDays: '7–14 days',
    matchScore: 88,
    category: 'Healthcare',
  },
  {
    id: 's3',
    name: 'PM Awas Yojana (Gramin)',
    ministry: 'Ministry of Rural Development',
    benefit: '₹1,20,000 construction grant',
    annualValue: 120000,
    eligibility: 'BPL rural households without pucca house',
    docs: ['Aadhaar', 'Income Certificate', 'Land Certificate', 'Bank Passbook'],
    processingDays: '30–60 days',
    matchScore: 78,
    category: 'Housing',
  },
  {
    id: 's4',
    name: 'MUDRA Yojana (Shishu)',
    ministry: 'Ministry of Finance',
    benefit: 'Loan up to ₹50,000 @ subsidized rate',
    annualValue: 50000,
    eligibility: 'Non-farm entrepreneurs / micro-businesses, age 18+',
    docs: ['Aadhaar', 'Business Plan', 'Bank Passbook'],
    processingDays: '10–20 days',
    matchScore: 85,
    category: 'Livelihood',
  },
];

export default function SchemeCompareModal({ isOpen, onClose }: SchemeCompareModalProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const compareSchemes = SAMPLE_SCHEMES.filter((s) => selected.includes(s.id));
  const winner = compareSchemes.length > 0
    ? compareSchemes.reduce((best, s) => (s.annualValue > best.annualValue ? s : best), compareSchemes[0])
    : null;

  if (!isOpen) return null;

  const ROWS = [
    { label: 'Ministry', render: (s: SchemeCompareItem) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.ministry}</span> },
    { label: 'Benefit', render: (s: SchemeCompareItem) => <span className="text-xs font-bold text-brand-emerald">{s.benefit}</span> },
    { label: 'Annual Value', render: (s: SchemeCompareItem) => <span className="text-sm font-black text-slate-800 dark:text-white">₹{s.annualValue.toLocaleString('en-IN')}</span> },
    { label: 'Eligibility', render: (s: SchemeCompareItem) => <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{s.eligibility}</span> },
    { label: 'Required Docs', render: (s: SchemeCompareItem) => (
      <div className="flex flex-wrap gap-1">
        {s.docs.map((d) => <span key={d} className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{d}</span>)}
      </div>
    )},
    { label: 'Processing Time', render: (s: SchemeCompareItem) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{s.processingDays}</span> },
    { label: 'AI Match Score', render: (s: SchemeCompareItem) => (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-saffron to-brand-emerald" style={{ width: `${s.matchScore}%` }} />
        </div>
        <span className="text-xs font-black text-brand-emerald">{s.matchScore}%</span>
      </div>
    )},
  ];

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-start justify-center p-4 pt-16 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative mb-8"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white z-10">
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <GitCompare className="w-5 h-5 text-brand-saffron" />
            <h3 className="font-black text-brand-navy dark:text-white text-xl">Scheme Comparison Mode</h3>
            <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              ADD-ON • Side-by-Side Analysis
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select up to 3 schemes to compare side-by-side. Best match is highlighted.</p>
        </div>

        {/* Scheme Selector */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Schemes to Compare ({selected.length}/3)</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SAMPLE_SCHEMES.map((s) => {
              const isSelected = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSelect(s.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs ${
                    isSelected
                      ? 'border-brand-saffron bg-amber-50/80 dark:bg-amber-950/30'
                      : selected.length >= 3
                      ? 'border-slate-100 dark:border-slate-900 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-800 hover:border-brand-saffron/50'
                  }`}
                >
                  <div className={`w-4 h-4 rounded mb-1.5 border-2 flex items-center justify-center ${isSelected ? 'border-brand-saffron bg-brand-saffron' : 'border-slate-300 dark:border-slate-600'}`}>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight line-clamp-2">{s.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.category}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        {compareSchemes.length > 0 ? (
          <div className="p-6 overflow-x-auto">
            {winner && (
              <div className="flex items-center gap-2 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                <Award className="w-4 h-4 text-brand-saffron" />
                <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                  Best Match for You: <span className="text-brand-navy dark:text-white">{winner.name}</span> — Highest annual value (₹{winner.annualValue.toLocaleString('en-IN')})
                </span>
              </div>
            )}
            <table className="w-full min-w-[400px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider pb-3 w-32">Criteria</th>
                  {compareSchemes.map((s) => (
                    <th key={s.id} className="pb-3 px-3">
                      <div className={`p-2 rounded-xl text-left ${winner?.id === s.id ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-900'}`}>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">{s.name}</p>
                        {winner?.id === s.id && <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">⭐ Best Match</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ROWS.map((row) => (
                  <tr key={row.label}>
                    <td className="py-3 text-xs font-bold text-slate-500 dark:text-slate-400 pr-4">{row.label}</td>
                    {compareSchemes.map((s) => (
                      <td key={s.id} className="py-3 px-3">{row.render(s)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <GitCompare className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-slate-400 font-semibold">Select 2 or more schemes above to start comparing</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
