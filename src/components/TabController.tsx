"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, LayoutList, FileCheck, FolderSearch, Radio, BarChart2, GitCompare } from "lucide-react";

import DiscoverSchemes from "./tabs/DiscoverSchemes";
import EligibilitySandbox from "./tabs/EligibilitySandbox";
import ApplicationTracker from "./tabs/ApplicationTracker";
import DocumentChecklist from "./tabs/DocumentChecklist";
import SchemeExplorer from "./tabs/SchemeExplorer";
import BenefitsImpactDashboard from "./tabs/BenefitsImpactDashboard";
import SchemeCompareModal from "./SchemeCompareModal";
import { getRealtimeState, subscribeRealtimeState, RealtimeState } from "@/lib/realtimeSync";

export default function TabController() {
  const [activeTab, setActiveTab] = useState("discover");
  const [compareOpen, setCompareOpen] = useState(false);
  const [realtimeState, setRealtimeState] = useState<RealtimeState>(getRealtimeState);

  useEffect(() => {
    // Subscribe to global realtime state updates across components and browser windows
    const unsubscribe = subscribeRealtimeState((newState) => {
      setRealtimeState(newState);
    });

    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('changeTab', handleTabChange);
    return () => {
      unsubscribe();
      window.removeEventListener('changeTab', handleTabChange);
    };
  }, []);

  const tabs = [
    { id: "discover", label: "Discover Schemes", icon: Search, badge: null },
    { id: "sandbox", label: "My Eligibility Sandbox", icon: SlidersHorizontal, badge: null },
    {
      id: "tracker",
      label: "Application Tracker",
      icon: LayoutList,
      badge: `${realtimeState.activeApplicationsCount} Active`,
    },
    {
      id: "documents",
      label: "Document Checklist",
      icon: FileCheck,
      badge: `${realtimeState.completedDocsPercentage}% Ready`,
    },
    { id: "explorer", label: "Scheme Explorer", icon: FolderSearch, badge: null },
    { id: "benefits", label: "Benefits Dashboard", icon: BarChart2, badge: null },
  ];

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-5rem)]">
      {/* Segmented Horizontal Tab Bar */}
      <div className="hidden md:block bg-white/60 dark:bg-slate-950/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 sticky top-[64px] md:top-20 z-40 shadow-sm transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1">
            <nav className="flex space-x-2 overflow-x-auto no-scrollbar py-2.5 items-center" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors
                      ${isActive ? "text-brand-navy dark:text-white font-bold" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-brand-saffron" : "text-slate-400 dark:text-slate-500"}`} />
                    {tab.label}
                    {tab.badge && (
                      <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] font-bold tracking-wide transition-all ${
                        isActive
                          ? "bg-brand-emerald/10 text-brand-emerald ring-1 ring-brand-emerald/30"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-saffron rounded-t-full"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              {/* Compare Schemes Button */}
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/70 transition-all shadow-sm"
              >
                <GitCompare className="w-3.5 h-3.5" /> Compare Schemes
              </button>
              {/* Realtime Live Sync Badge Indicator */}
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 shadow-sm">
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                <span>Realtime Sync Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas for Active Tab View */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {activeTab === "discover" && <DiscoverSchemes />}
            {activeTab === "sandbox" && <EligibilitySandbox />}
            {activeTab === "tracker" && <ApplicationTracker />}
            {activeTab === "documents" && <DocumentChecklist />}
            {activeTab === "explorer" && <SchemeExplorer />}
            {activeTab === "benefits" && <BenefitsImpactDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      <SchemeCompareModal isOpen={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  );
}
