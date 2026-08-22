'use client';

import React, { useState } from "react";
import { Search, Filter, BookOpen, ExternalLink, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { updateApplicationStatus } from "@/app/actions/tracker.action";

interface ExplorerScheme {
  id: string;
  name: string;
  min: string;
  type: string;
  url: string;
  benefit: string;
}

const SCHEME_DIRECTORY: ExplorerScheme[] = [
  { id: "dir-1", name: "PM-Kisan Samman Nidhi", min: "Ministry of Agriculture", type: "Subsidy", url: "https://pmkisan.gov.in/", benefit: "₹6,000 / year direct transfer" },
  { id: "dir-2", name: "PM Awas Yojana (Gramin)", min: "Ministry of Rural Dev", type: "Housing Grant", url: "https://pmayg.nic.in/", benefit: "₹1.20 Lakh house construction grant" },
  { id: "dir-3", name: "Ayushman Bharat PM-JAY", min: "Ministry of Health", type: "Health Insurance", url: "https://pmjay.gov.in/", benefit: "₹5 Lakh free health cover / family" },
  { id: "dir-4", name: "Post-Matric Scholarship", min: "Ministry of Social Justice", type: "Scholarship", url: "https://scholarship.up.gov.in/", benefit: "Full tuition fee reimbursement" },
  { id: "dir-5", name: "Mudra Yojana (Shishu/Kishore)", min: "Ministry of Finance", type: "Micro Loan", url: "https://www.mudra.org.in/", benefit: "Collateral-free loans up to ₹10 Lakh" },
  { id: "dir-6", name: "Stand-Up India Scheme", min: "Ministry of Finance", type: "Bank Loan", url: "https://www.standupmitra.in/", benefit: "₹10 Lakh to ₹1 Crore for SC/ST/Women" },
  { id: "dir-7", name: "PM Ujjwala Yojana", min: "Ministry of Petroleum", type: "LPG Subsidy", url: "https://www.pmuy.gov.in/", benefit: "Free LPG connection & refill subsidy" },
  { id: "dir-8", name: "Atal Pension Yojana", min: "Ministry of Finance", type: "Pension", url: "https://www.npscra.nsdl.co.in/", benefit: "Guaranteed monthly pension up to ₹5,000" },
  { id: "dir-9", name: "Sukanya Samriddhi Yojana", min: "Ministry of Finance", type: "Savings", url: "https://www.indiapost.gov.in/", benefit: "8.2% interest rate for girl child savings" },
  { id: "dir-10", name: "PM Fasal Bima Yojana", min: "Ministry of Agriculture", type: "Insurance", url: "https://pmfby.gov.in/", benefit: "Crop protection against weather disasters" },
];

export default function SchemeExplorer() {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filtered = SCHEME_DIRECTORY.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.min.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === "All" || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  const types = ["All", "Subsidy", "Housing Grant", "Health Insurance", "Scholarship", "Micro Loan", "Pension", "Insurance"];

  const handleApplyPortal = async (scheme: ExplorerScheme) => {
    window.open(scheme.url, "_blank", "noopener,noreferrer");
    setAppliedIds((prev) => ({ ...prev, [scheme.id]: true }));

    setToastMsg(`Opened Official Portal for ${scheme.name} & recorded status as 'APPLIED'!`);
    setTimeout(() => setToastMsg(null), 3500);

    try {
      await updateApplicationStatus({
        schemeId: scheme.id,
        status: "APPLIED",
        notes: `Applied via Scheme Directory Portal Bridge`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full max-h-[calc(100vh-12rem)] relative">
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-brand-navy text-white px-4 py-3 rounded-2xl shadow-2xl border border-brand-saffron flex items-center gap-2.5 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-brand-navy dark:text-white">Scheme Explorer & Directory</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Browse all 1,000+ government welfare, grant, subsidy, and insurance schemes.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme name, ministry, or benefits (e.g. 'loan', 'pension', 'PM')..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-saffron shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedType === t
                  ? "bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
          <div className="col-span-4">Scheme Name</div>
          <div className="col-span-3">Ministry / Department</div>
          <div className="col-span-3">Benefit Summary</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filtered.map((s) => {
            const isApplied = appliedIds[s.id];

            return (
              <div
                key={s.id}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
              >
                <div className="col-span-4">
                  <div className="font-bold text-brand-navy dark:text-slate-100 text-sm">{s.name}</div>
                  <div className="text-[11px] text-slate-400 font-medium">{s.type}</div>
                </div>

                <div className="col-span-3 text-xs text-slate-600 dark:text-slate-400">{s.min}</div>

                <div className="col-span-3 text-xs text-slate-800 dark:text-slate-300 font-semibold">
                  {s.benefit}
                </div>

                <div className="col-span-2 flex justify-end">
                  <button
                    onClick={() => handleApplyPortal(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      isApplied
                        ? "bg-emerald-600 text-white"
                        : "bg-brand-navy dark:bg-white text-white dark:text-brand-navy hover:bg-slate-800"
                    }`}
                  >
                    <span>{isApplied ? "Applied" : "Apply"}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
