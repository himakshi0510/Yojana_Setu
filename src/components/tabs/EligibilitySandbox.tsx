import React, { useState } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";

export default function EligibilitySandbox() {
  const [income, setIncome] = useState(2.5);
  const [land, setLand] = useState(2.4);
  const [age, setAge] = useState(35);
  const [occupation, setOccupation] = useState("Farmer");
  const [isApplied, setIsApplied] = useState(false);

  const occupations = ["Farmer", "Student", "MSME Owner", "Unemployed"];

  const landInHectares = land * 0.404686;
  const isKisanEligible = landInHectares <= 2.0 && occupation === "Farmer";
  
  let mudraTier = "Not Eligible";
  if (age >= 18) {
    if (income <= 5) mudraTier = "Shishu tier (up to ₹50,000)";
    else if (income <= 10) mudraTier = "Kishore tier (up to ₹5 Lakhs)";
    else mudraTier = "Tarun tier (up to ₹10 Lakhs)";
  }
  const isMudraEligible = age >= 18;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Simulate & Check Your Eligibility</h2>
            <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              REALTIME
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Test what-if scenarios without filling long forms.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sliders Panel */}
        <div className="lg:col-span-7 bg-white dark:bg-black rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-8">
          
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Annual Income</label>
              <span className="text-lg font-bold text-brand-navy dark:text-white">₹{income} Lakhs</span>
            </div>
            <input 
              type="range" 
              min="0" max="15" step="0.5" 
              value={income} 
              onChange={(e) => setIncome(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-saffron"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
              <span>₹0</span>
              <span>₹15L+</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Land Owned (Acres)</label>
              <span className="text-lg font-bold text-brand-navy dark:text-white">{land} Acres</span>
            </div>
            <input 
              type="range" 
              min="0" max="10" step="0.1" 
              value={land} 
              onChange={(e) => setLand(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-emerald"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
              <span>0 Acres</span>
              <span>10+ Acres</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Age</label>
              <span className="text-lg font-bold text-brand-navy dark:text-white">{age} Years</span>
            </div>
            <input 
              type="range" 
              min="18" max="70" step="1" 
              value={age} 
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-navy"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
              <span>18 Yrs</span>
              <span>70 Yrs</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-4">Occupation</label>
            <div className="flex flex-wrap gap-3">
              {occupations.map(occ => (
                <button 
                  key={occ}
                  onClick={() => setOccupation(occ)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    occupation === occ 
                      ? "bg-brand-navy text-white shadow-md" 
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  {occ}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Live Impact Drawer */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-gradient-to-b from-brand-navy to-slate-900 rounded-2xl p-6 text-white shadow-lg">
            <h3 className="font-bold text-lg mb-2">Live Eligibility Impact</h3>
            <p className="text-slate-300 text-sm mb-6">Based on your simulation, here is what changes:</p>
            
            <div className="space-y-4">
              {/* PM Kisan Card */}
              <div className={`rounded-xl p-4 border transition-colors ${isKisanEligible ? 'bg-brand-emerald/10 border-brand-emerald/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-semibold ${isKisanEligible ? 'text-brand-emerald' : 'text-red-400'}`}>PM-Kisan Scheme</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${isKisanEligible ? 'bg-brand-emerald/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isKisanEligible ? 'Eligible' : 'Disqualified'}
                  </span>
                </div>
                <div className="flex items-start gap-2 mt-3 text-sm text-slate-300">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isKisanEligible ? 'text-brand-emerald' : 'text-red-400'}`} />
                  <p>
                    <strong className="text-white">Requires Farmer status & land &lt; 2.0 hectares</strong> 
                    <br/>
                    (Your input: {occupation}, {land} acres = {landInHectares.toFixed(1)} hectares). 
                    <br/>
                    <span className={`font-semibold mt-1 inline-block ${isKisanEligible ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isKisanEligible ? "You currently qualify for ₹6,000/year." : "You exceed the land limit or are not a Farmer."}
                    </span>
                  </p>
                </div>
              </div>

              {/* Mudra Yojana Card */}
              <div className={`rounded-xl p-4 border transition-colors ${isMudraEligible ? 'bg-white/10 border-white/20' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-white">Mudra Yojana Loan</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${isMudraEligible ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-300'}`}>
                    {isMudraEligible ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mt-2">
                  {isMudraEligible 
                    ? `Your age (${age}) and income (₹${income}L) align with the ${mudraTier}.`
                    : `You must be at least 18 years old to apply for business loans.`}
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                window.dispatchEvent(new CustomEvent('updateProfile', { 
                  detail: { income: income.toString(), age: age.toString(), profession: occupation, land: land.toString() } 
                }));
                setIsApplied(true);
                setTimeout(() => setIsApplied(false), 2000);
              }}
              className={`w-full mt-6 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl transition-all shadow-lg ${
                isApplied 
                  ? 'bg-brand-emerald text-white shadow-brand-emerald/20' 
                  : 'bg-brand-saffron hover:bg-orange-600 text-white shadow-brand-saffron/20'
              }`}
            >
              {isApplied ? "Profile Updated!" : "Apply these settings to my profile"} 
              {!isApplied && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
