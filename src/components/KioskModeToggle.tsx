'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, ZoomIn, Eye, X, Users, Accessibility } from 'lucide-react';

const KIOSK_KEY = 'yojanasetu_kiosk_mode';

export function useKioskMode() {
  const [isKiosk, setIsKiosk] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(KIOSK_KEY) === 'true';
    setIsKiosk(stored);
    if (stored) document.documentElement.classList.add('kiosk-mode');
  }, []);

  const toggle = () => {
    setIsKiosk((prev) => {
      const next = !prev;
      localStorage.setItem(KIOSK_KEY, String(next));
      if (next) {
        document.documentElement.classList.add('kiosk-mode');
      } else {
        document.documentElement.classList.remove('kiosk-mode');
      }
      return next;
    });
  };

  return { isKiosk, toggle };
}

interface KioskModeToggleProps {
  compact?: boolean;
}

export default function KioskModeToggle({ compact = false }: KioskModeToggleProps) {
  const { isKiosk, toggle } = useKioskMode();
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={toggle}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        title="CSC Operator / Village Kiosk Mode"
        className={`flex items-center gap-1.5 font-bold transition-all rounded-xl border ${
          isKiosk
            ? 'bg-violet-600 text-white border-violet-700 shadow-lg px-3 py-1.5 text-xs'
            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-700 px-3 py-1.5 text-xs'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        {!compact && <span>{isKiosk ? 'Kiosk ON' : 'Kiosk'}</span>}
      </button>

      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full right-0 mt-2 w-56 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-semibold px-3 py-2.5 rounded-xl shadow-xl z-50 leading-snug"
          >
            <p className="font-black mb-1 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              CSC Operator / Kiosk Mode
            </p>
            <p>Activates high-contrast, large-font, accessibility-optimised UI for rural CSC centres and village kiosk operators.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
