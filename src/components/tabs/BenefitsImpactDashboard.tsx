'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, TrendingUp, Heart, Home, Wheat, GraduationCap, IndianRupee, ArrowUpRight, Sparkles
} from 'lucide-react';

interface BenefitCategory {
  label: string;
  icon: React.ReactNode;
  monthlyCredits: number[];
  color: string;
  bgColor: string;
  totalAnnual: number;
  schemeCount: number;
}

const MONTHS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

const CATEGORIES: BenefitCategory[] = [
  {
    label: 'Agriculture',
    icon: <Wheat className="w-4 h-4" />,
    monthlyCredits: [500, 500, 0, 500, 500, 0, 500, 500, 0, 500, 500, 0],
    color: '#16a34a',
    bgColor: 'bg-emerald-500',
    totalAnnual: 6000,
    schemeCount: 2,
  },
  {
    label: 'Healthcare',
    icon: <Heart className="w-4 h-4" />,
    monthlyCredits: [41666, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    color: '#dc2626',
    bgColor: 'bg-red-500',
    totalAnnual: 500000,
    schemeCount: 1,
  },
  {
    label: 'Housing',
    icon: <Home className="w-4 h-4" />,
    monthlyCredits: [40000, 40000, 40000, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    color: '#d97706',
    bgColor: 'bg-amber-500',
    totalAnnual: 120000,
    schemeCount: 1,
  },
  {
    label: 'Education',
    icon: <GraduationCap className="w-4 h-4" />,
    monthlyCredits: [0, 0, 12500, 0, 0, 12500, 0, 0, 12500, 0, 0, 12500],
    color: '#7c3aed',
    bgColor: 'bg-violet-500',
    totalAnnual: 50000,
    schemeCount: 2,
  },
];

export default function BenefitsImpactDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<BenefitCategory | null>(null);
  const totalUnlocked = CATEGORIES.reduce((sum, c) => sum + c.totalAnnual, 0);

  const maxBarValue = 50000;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Benefits Impact Dashboard</h2>
            <span className="bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              ADD-ON • Savings Analytics
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Your estimated annual welfare savings across all matched government schemes.</p>
        </div>
        <div className="bg-gradient-to-r from-brand-navy to-slate-800 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-brand-saffron" />
          <div>
            <p className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">Total Unlocked Value</p>
            <p className="text-xl font-black">₹{totalUnlocked.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.label}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedCategory(selectedCategory?.label === cat.label ? null : cat)}
            className={`p-4 rounded-2xl border text-left transition-all shadow-sm ${
              selectedCategory?.label === cat.label
                ? 'border-brand-saffron bg-amber-50/80 dark:bg-amber-950/30'
                : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className={`w-9 h-9 ${cat.bgColor} bg-opacity-10 rounded-xl flex items-center justify-center mb-3`}
              style={{ backgroundColor: cat.color + '20', color: cat.color }}>
              {cat.icon}
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{cat.label}</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              ₹{cat.totalAnnual.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">{cat.schemeCount} scheme{cat.schemeCount > 1 ? 's' : ''}</p>
          </motion.button>
        ))}
      </div>

      {/* Bar Chart - Monthly DBT */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Monthly DBT Credit Timeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedCategory ? `Showing: ${selectedCategory.label}` : 'All Categories Combined'}
            </p>
          </div>
          <BarChart2 className="w-5 h-5 text-slate-400" />
        </div>

        <div className="flex items-end gap-2 h-40">
          {MONTHS.map((month, i) => {
            const value = selectedCategory
              ? selectedCategory.monthlyCredits[i]
              : CATEGORIES.reduce((sum, c) => sum + c.monthlyCredits[i], 0);
            const heightPct = Math.min(100, (value / maxBarValue) * 100);
            const isCurrentMonth = i === MONTHS.length - 1;

            return (
              <div key={month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full flex flex-col items-center justify-end h-32 relative">
                  {value > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap z-10">
                      ₹{value.toLocaleString('en-IN')}
                    </div>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                    className={`w-full rounded-t-lg ${
                      isCurrentMonth
                        ? 'bg-brand-saffron'
                        : selectedCategory
                        ? ''
                        : 'bg-brand-emerald/70'
                    }`}
                    style={selectedCategory && !isCurrentMonth ? { backgroundColor: selectedCategory.color + 'aa' } : {}}
                  />
                </div>
                <span className={`text-[9px] font-semibold ${isCurrentMonth ? 'text-brand-saffron font-black' : 'text-slate-400'}`}>
                  {month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheme Breakdown Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-saffron" />
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Scheme-wise Savings Breakdown</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            { name: 'Ayushman Bharat PM-JAY', category: 'Healthcare', benefit: '₹5,00,000', frequency: 'Annual cover', pct: 75 },
            { name: 'PM Awas Yojana (Gramin)', category: 'Housing', benefit: '₹1,20,000', frequency: 'One-time grant', pct: 18 },
            { name: 'Scholarship (Pre-Matric)', category: 'Education', benefit: '₹50,000', frequency: '4× Quarterly', pct: 7 },
            { name: 'PM-Kisan Samman Nidhi', category: 'Agriculture', benefit: '₹6,000', frequency: '3× Annual', pct: 1 },
          ].map((s) => (
            <div key={s.name} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.category} · {s.frequency}</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-brand-saffron to-brand-emerald rounded-full"
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-brand-emerald">{s.benefit}</p>
                <p className="text-[10px] text-slate-400">{s.pct}% of total</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Sparkles className="w-3 h-3 text-brand-saffron" />
        Estimates based on publicly declared scheme benefit amounts by Government of India. Actual disbursement may vary.
      </p>
    </div>
  );
}
