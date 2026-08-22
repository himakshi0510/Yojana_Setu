"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Globe, HelpCircle, User, Menu, ChevronRight, X, Settings, LogOut, FileText, Bell, Search, SlidersHorizontal, LayoutList, FileCheck, FolderSearch } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

import { useSession } from "next-auth/react";
import WelfarePassportModal from "@/components/WelfarePassportModal";
import KioskModeToggle from "@/components/KioskModeToggle";
import { Award } from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isPassportOpen, setIsPassportOpen] = useState(false);
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
    { code: "RJ", name: "Rajasthani (राजस्थानी)" }
  ];
  
  const [profileData, setProfileData] = useState({
    name: "Citizen",
    email: "",
    state: "Maharashtra",
    city: "Pune",
    gender: "Male",
    dob: "1988-05-12",
    caste: "OBC",
    profession: "Farmer",
    income: "2.5"
  });

  // Sync profile name with logged-in NextAuth session user
  useEffect(() => {
    if (session?.user) {
      const sessionName = session.user.name || session.user.email?.split('@')[0] || "Citizen";
      const formattedName = sessionName.charAt(0).toUpperCase() + sessionName.slice(1);
      setProfileData((prev) => ({
        ...prev,
        name: formattedName,
        email: session.user?.email || "",
      }));
    }
  }, [session]);

  const closeProfile = () => {
    setIsProfileOpen(false);
    setIsEditingProfile(false);
  };

  useEffect(() => {
    const handleUpdateProfile = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setProfileData(prev => ({
          ...prev,
          ...customEvent.detail
        }));
      }
    };
    window.addEventListener('updateProfile', handleUpdateProfile);
    return () => window.removeEventListener('updateProfile', handleUpdateProfile);
  }, []);

  const closeLang = () => setIsLangOpen(false);

  const handleLanguageSelect = (langCode: string) => {
    setActiveLang(langCode);
    closeLang();
    
    const gtMap: Record<string, string> = {
      "EN": "en", "HI": "hi", "PA": "pa", "TA": "ta", "TE": "te",
      "AW": "hi", "BH": "bho", "MR": "mr", "RJ": "hi"
    };
    
    const gtCode = gtMap[langCode] || "en";
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (select) {
      select.value = gtCode;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <>
    <header className="print:hidden sticky top-0 z-50 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
      {/* Top Banner (At Above) */}
      <div className="bg-slate-900 dark:bg-black text-slate-300 py-1 border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-end items-center gap-4 text-xs font-medium">
          <span>A- A A+</span>
          <div className="w-px h-3 bg-slate-700" />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          
          {/* Left: Brand */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-brand-navy dark:text-slate-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <a href="/" className="flex items-center gap-3 md:gap-4 hover:opacity-90 transition-opacity">
              <div className="bg-gradient-to-br from-brand-saffron to-orange-500 p-2 md:p-2.5 rounded-xl shadow-lg shadow-brand-saffron/20">
                <Landmark className="w-5 h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-black text-brand-navy dark:text-white tracking-tight leading-none">
                  Yojana Setu
                </span>
                <span className="hidden md:block text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1 tracking-wide">
                  Government Schemes. Made Simple.
                </span>
              </div>
            </a>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Dropdown Container */}
            <div className="relative hidden sm:block">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isLangOpen ? 'bg-slate-100 dark:bg-slate-800 text-brand-navy dark:text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <Globe className="w-4 h-4" />
                <span>{activeLang} ▾</span>
              </button>
              
              {isLangOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={closeLang}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden transform origin-top-right transition-all">
                    <div className="py-2 max-h-64 overflow-y-auto">
                      {languages.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageSelect(lang.code)}
                          className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${activeLang === lang.code ? 'bg-brand-saffron/10 text-brand-saffron dark:text-amber-500' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-navy dark:hover:text-white'}`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setIsPassportOpen(true)}
              title="Citizen Welfare Passport (PDF & QR)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-950/70 transition-all shadow-sm"
            >
              <Award className="w-4 h-4 text-brand-saffron" />
              <span className="hidden sm:inline">Passport</span>
            </button>
            <KioskModeToggle />
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            {/* Profile Dropdown Container */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`p-2 rounded-full transition-colors ${isProfileOpen ? 'bg-brand-saffron/10 text-brand-saffron dark:bg-amber-500/20 dark:text-amber-500' : 'text-slate-500 dark:text-slate-400 hover:text-brand-navy dark:hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <User className="w-5 h-5" />
              </button>

              {/* Dropdown Modal */}
              {isProfileOpen && (
                <>
                  {/* Invisible Backdrop to close on click outside */}
                  <div className="fixed inset-0 z-40" onClick={closeProfile}></div>
                  
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden transform origin-top-right transition-all">
                    
                    {/* Header */}
                    <div className="bg-gradient-to-r from-brand-navy to-slate-800 p-5 text-white flex items-center gap-4">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold border border-white/30 backdrop-blur-sm">
                        {profileData.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        {isEditingProfile ? (
                          <input 
                            type="text" 
                            value={profileData.name} 
                            onChange={e => setProfileData({...profileData, name: e.target.value})}
                            className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/50"
                            placeholder="Full Name"
                          />
                        ) : (
                          <div>
                            <h3 className="font-bold text-lg leading-tight truncate">{profileData.name}</h3>
                            {profileData.email && (
                              <p className="text-xs text-slate-300 font-medium truncate">{profileData.email}</p>
                            )}
                          </div>
                        )}
                        <span className="text-xs font-semibold bg-brand-emerald/20 text-brand-emerald px-2 py-0.5 rounded-full mt-1 inline-block border border-brand-emerald/30">Verified Citizen</span>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="p-5 grid grid-cols-2 gap-y-4 gap-x-3 text-sm max-h-[60vh] overflow-y-auto">
                      
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">State</p>
                        {isEditingProfile ? (
                          <input type="text" value={profileData.state} onChange={e => setProfileData({...profileData, state: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron" />
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{profileData.state}</p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">City</p>
                        {isEditingProfile ? (
                          <input type="text" value={profileData.city} onChange={e => setProfileData({...profileData, city: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron" />
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{profileData.city}</p>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Gender</p>
                        {isEditingProfile ? (
                          <select value={profileData.gender} onChange={e => setProfileData({...profileData, gender: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                          </select>
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{profileData.gender}</p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Date of Birth</p>
                        {isEditingProfile ? (
                          <input type="date" value={profileData.dob} onChange={e => setProfileData({...profileData, dob: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron" />
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {new Date(profileData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Caste</p>
                        {isEditingProfile ? (
                          <select value={profileData.caste} onChange={e => setProfileData({...profileData, caste: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron">
                            <option>General</option>
                            <option>OBC</option>
                            <option>SC/ST</option>
                          </select>
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{profileData.caste}</p>
                        )}
                      </div>
                      <div className="col-span-1">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Profession</p>
                        {isEditingProfile ? (
                          <select value={profileData.profession} onChange={e => setProfileData({...profileData, profession: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-saffron">
                            <option>Farmer</option>
                            <option>Student</option>
                            <option>MSME Owner</option>
                            <option>Salaried</option>
                            <option>Unemployed</option>
                          </select>
                        ) : (
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{profileData.profession}</p>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Annual Income (₹ Lakhs)</p>
                        {isEditingProfile ? (
                          <input type="number" step="0.1" value={profileData.income} onChange={e => setProfileData({...profileData, income: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 text-brand-emerald font-bold focus:outline-none focus:ring-1 focus:ring-brand-saffron" />
                        ) : (
                          <p className="font-bold text-brand-emerald dark:text-emerald-400 text-lg">₹{profileData.income} Lakhs</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer Action */}
                    <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
                      {isEditingProfile ? (
                        <div className="flex gap-2">
                          <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-2 rounded-xl text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
                            Done
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setIsEditingProfile(true)} className="w-full flex items-center justify-center gap-1.5 text-sm font-bold bg-brand-saffron hover:bg-orange-600 text-white py-2.5 rounded-xl shadow-md transition-colors">
                          Edit Profile Details
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          const { signOut } = await import("next-auth/react");
                          await signOut({ callbackUrl: "/" });
                        }}
                        className="w-full flex items-center justify-center gap-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 py-2 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
          </div>

        </div>
      </div>

    </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar */}
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 h-screen z-[70] w-72 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col md:hidden"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-brand-saffron to-orange-500 p-2 rounded-lg shadow-md shadow-brand-saffron/20">
                    <Landmark className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-black text-brand-navy dark:text-white">Scheme Setu</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* User Section */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand-navy text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {profileData.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-brand-navy dark:text-white leading-tight">{profileData.name}</p>
                    <p className="text-xs font-semibold text-brand-emerald">Verified Citizen</p>
                  </div>
                </div>

                {/* Navigation Links (Features) */}
                <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Features</p>
                  
                  <button onClick={() => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'discover' })); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-left">
                    <Search className="w-5 h-5 text-brand-saffron flex-shrink-0" /> Discover Schemes
                  </button>
                  
                  <button onClick={() => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'sandbox' })); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-left">
                    <SlidersHorizontal className="w-5 h-5 text-brand-saffron flex-shrink-0" /> My Eligibility Sandbox
                  </button>
                  
                  <button onClick={() => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'tracker' })); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-left">
                    <div className="flex items-center gap-3"><LayoutList className="w-5 h-5 text-brand-saffron flex-shrink-0" /> Application Tracker</div>
                    <div className="bg-brand-emerald text-white text-[10px] px-2 py-0.5 rounded-full font-bold">2 Active</div>
                  </button>
                  
                  <button onClick={() => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'documents' })); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-left">
                    <div className="flex items-center gap-3"><FileCheck className="w-5 h-5 text-brand-saffron flex-shrink-0" /> Document Checklist</div>
                    <div className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">75% Ready</div>
                  </button>
                  
                  <button onClick={() => { window.dispatchEvent(new CustomEvent('changeTab', { detail: 'explorer' })); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors text-left">
                    <FolderSearch className="w-5 h-5 text-brand-saffron flex-shrink-0" /> Scheme Explorer
                  </button>
                </div>

                {/* Account & Notifications */}
                <div className="space-y-1">
                  <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Account</p>
                  <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors">
                    <div className="flex items-center gap-3"><User className="w-5 h-5 text-slate-400" /> My Profile</div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Preferences */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferences</p>
                  <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold transition-colors">
                    <div className="flex items-center gap-3"><Globe className="w-5 h-5 text-slate-400" /> Language</div>
                    <span className="text-sm text-slate-500">English</span>
                  </button>
                  <div className="w-full flex items-center justify-between p-3 rounded-xl text-slate-700 dark:text-slate-300 font-semibold">
                    <div className="flex items-center gap-3"><Settings className="w-5 h-5 text-slate-400" /> Dark Mode</div>
                    <ThemeToggle />
                  </div>
                </div>

              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    const { signOut } = await import("next-auth/react");
                    await signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-3 rounded-xl font-bold transition-colors"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <WelfarePassportModal
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
        userName={profileData.name}
        userState={profileData.state}
      />
    </>
  );
}
