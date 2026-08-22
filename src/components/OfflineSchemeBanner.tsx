'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Clock, X, Download, CheckCircle2 } from 'lucide-react';

const CACHE_KEY = 'yojanasetu_offline_schemes_cache';
const CACHE_TIME_KEY = 'yojanasetu_offline_cache_time';

interface CachedScheme {
  id: string;
  name: string;
  benefit: string;
  ministry: string;
  matchScore: number;
}

function saveToCache(schemes: CachedScheme[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(schemes));
    localStorage.setItem(CACHE_TIME_KEY, new Date().toISOString());
  } catch { /* storage full */ }
}

function loadFromCache(): { schemes: CachedScheme[]; cachedAt: string | null } {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cachedAt = localStorage.getItem(CACHE_TIME_KEY);
    return { schemes: raw ? JSON.parse(raw) : [], cachedAt };
  } catch {
    return { schemes: [], cachedAt: null };
  }
}

// Default fallback schemes to pre-populate the cache on first visit
const DEFAULT_SCHEMES: CachedScheme[] = [
  { id: 's1', name: 'PM-Kisan Samman Nidhi', benefit: '₹6,000 / year', ministry: 'Agriculture', matchScore: 92 },
  { id: 's2', name: 'Ayushman Bharat PM-JAY', benefit: '₹5,00,000 health cover', ministry: 'Health', matchScore: 88 },
  { id: 's3', name: 'PM Awas Yojana (Gramin)', benefit: '₹1,20,000 grant', ministry: 'Rural Development', matchScore: 78 },
  { id: 's4', name: 'MUDRA Yojana (Shishu)', benefit: 'Loan up to ₹50,000', ministry: 'Finance', matchScore: 85 },
  { id: 's5', name: 'National Scholarship (NSP)', benefit: '₹50,000 / year', ministry: 'Education', matchScore: 71 },
];

export default function OfflineSchemeBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cachedSchemes, setCachedSchemes] = useState<CachedScheme[]>([]);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const [showCache, setShowCache] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // Pre-populate cache with defaults on first load
  useEffect(() => {
    const { schemes, cachedAt: ct } = loadFromCache();
    if (schemes.length === 0) {
      saveToCache(DEFAULT_SCHEMES);
      setCachedSchemes(DEFAULT_SCHEMES);
      setCachedAt(new Date().toISOString());
    } else {
      setCachedSchemes(schemes);
      setCachedAt(ct);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setDismissed(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Check current status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const handleSaveSnapshot = () => {
    saveToCache(DEFAULT_SCHEMES);
    const { schemes, cachedAt: ct } = loadFromCache();
    setCachedSchemes(schemes);
    setCachedAt(ct);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Always render the save snapshot button even when online, as a utility
  return (
    <>
      {/* Offline Banner — only shown when offline */}
      <AnimatePresence>
        {isOffline && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[95] w-[calc(100vw-2rem)] max-w-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700 rounded-2xl shadow-2xl backdrop-blur-md px-5 py-3 flex items-center gap-3"
          >
            <WifiOff className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">📶 Offline Mode — No Internet Detected</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Showing last cached schemes
                {cachedAt ? ` · Saved ${new Date(cachedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}.
              </p>
            </div>
            <button
              onClick={() => setShowCache(!showCache)}
              className="flex-shrink-0 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
            >
              View Cached ({cachedSchemes.length})
            </button>
            <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cached Schemes Drawer */}
      <AnimatePresence>
        {showCache && isOffline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed top-[132px] left-1/2 -translate-x-1/2 z-[94] w-[calc(100vw-2rem)] max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Cached Schemes
              </p>
              <button onClick={() => setShowCache(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {cachedSchemes.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.ministry} · {s.benefit}</p>
                  </div>
                  <span className="text-xs font-black text-brand-emerald">{s.matchScore}% match</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Snapshot Button — always visible as a floating utility */}
      <div className="fixed bottom-24 right-5 z-[85]">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSaveSnapshot}
          suppressHydrationWarning
          title="Save Offline Snapshot"
          className={`flex items-center gap-2 text-[11px] font-black px-3 py-2 rounded-xl shadow-lg border transition-all ${
            justSaved
              ? 'bg-emerald-500 text-white border-emerald-600'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-navy dark:hover:border-brand-saffron'
          }`}
        >
          {justSaved ? (
            <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</>
          ) : (
            <><Download className="w-3.5 h-3.5" /> Save Offline</>
          )}
        </motion.button>
      </div>
    </>
  );
}
