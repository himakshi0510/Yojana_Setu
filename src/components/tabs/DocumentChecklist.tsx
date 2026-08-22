'use client';

import React, { useState, useEffect } from "react";
import { Download, Share2, Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import { getUserChecklistProgress, toggleDocumentStatus } from "@/app/actions/checklist.action";
import { updateRealtimeState } from "@/lib/realtimeSync";
import DocuScanModal from "@/components/DocuScanModal";
import { Sparkles } from "lucide-react";

interface DocItem {
  id: string;
  name: string;
  status: "ready" | "pending" | "expired";
  date: string;
}

const DEFAULT_DOCS: DocItem[] = [
  { id: "doc-1", name: "Identity Verification (Aadhaar)", status: "ready", date: "Verified via DigiLocker" },
  { id: "doc-2", name: "Bank Passbook (DBT Seeded)", status: "ready", date: "Updated Oct 2023" },
  { id: "doc-3", name: "Income Certificate (Tehsildar Issued)", status: "ready", date: "Valid till Mar 2026" },
  { id: "doc-4", name: "Land Khatauni / Revenue Records", status: "pending", date: "Requires physical copy" },
  { id: "doc-5", name: "Caste Certificate (SC/ST/OBC)", status: "expired", date: "Expired in 2022" },
  { id: "doc-6", name: "Domicile / Residence Certificate", status: "ready", date: "Verified" },
];

export default function DocumentChecklist() {
  const [docs, setDocs] = useState<DocItem[]>(DEFAULT_DOCS);
  const [loading, setLoading] = useState<boolean>(false);
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);

  const readyCount = docs.filter((d) => d.status === "ready").length;
  const totalCount = docs.length;
  const progress = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  // Load progress from Server Action
  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        const res = await getUserChecklistProgress();
        if (res.success && res.data && res.data.checklist.length > 0) {
          const mapped: DocItem[] = res.data.checklist.map((item) => ({
            id: item.id,
            name: item.documentName,
            status: item.isUploadedOrReady ? "ready" : "pending",
            date: item.isUploadedOrReady ? "Verified / Ready" : "Pending Upload",
          }));
          setDocs(mapped);
        }
      } catch (err) {
        console.error("Error loading checklist progress", err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, []);

  // Toggle document readiness
  const toggleDoc = async (id: string) => {
    const targetDoc = docs.find((d) => d.id === id);
    if (!targetDoc) return;

    const newIsReady = targetDoc.status !== "ready";
    const newStatus = newIsReady ? "ready" : "pending";

    // Optimistic UI update
    const updatedDocs = docs.map((d) =>
      d.id === id
        ? {
            ...d,
            status: newStatus as "ready" | "pending" | "expired",
            date: newIsReady ? "Just Now" : "Pending Upload",
          }
        : d
    );
    setDocs(updatedDocs);

    const readyCount = updatedDocs.filter((d) => d.status === "ready").length;
    const percentage = Math.round((readyCount / updatedDocs.length) * 100);
    updateRealtimeState({ completedDocsPercentage: percentage });

    try {
      await toggleDocumentStatus({
        documentName: targetDoc.name,
        isReady: newIsReady,
      });
    } catch (err) {
      console.error("Error toggling document status", err);
    }
  };

  // Handle file upload
  const handleUpload = async (id: string) => {
    const targetDoc = docs.find((d) => d.id === id);
    if (!targetDoc) return;

    setDocs((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "ready", date: "Uploaded Just Now" } : d
      )
    );

    try {
      await toggleDocumentStatus({
        documentName: targetDoc.name,
        isReady: true,
      });
    } catch (err) {
      console.error("Error saving upload status", err);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const readyDocs = docs
      .filter((d) => d.status === "ready")
      .map((d) => `✅ ${d.name}`)
      .join("\n");
    const pendingDocs = docs
      .filter((d) => d.status !== "ready")
      .map((d) => `❌ ${d.name}`)
      .join("\n");

    const text = `*My Government Scheme Document Checklist (Yojana Setu)*\n\n*Ready Documents:*\n${
      readyDocs || "None"
    }\n\n*Pending/Expired:*\n${pendingDocs || "None"}\n\n_Generated via Yojana Setu Portal_`;
    const encodedText = encodeURIComponent(text);

    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto relative min-h-screen">
      {/* -------------------- PRINT/PDF LAYOUT -------------------- */}
      <div className="hidden print:block w-full text-black relative z-10 p-4">
        <div className="flex items-center justify-between border-b-2 border-slate-300 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-navy rounded-xl flex items-center justify-center text-white font-black text-xl">
              YS
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Yojana Setu</h1>
              <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mt-0.5">
                Government Schemes. Made Simple.
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-slate-800">Document Checklist Summary</h2>
            <p className="text-slate-500 text-sm font-medium">Generated on {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="border-2 border-slate-300 rounded-2xl p-4 mb-6 bg-slate-50">
          <h2 className="text-lg font-black mb-3 text-slate-800 border-b border-slate-200 pb-1 uppercase tracking-wider">
            Citizen Profile & Document Status
          </h2>
          <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm">
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
              <span className="font-bold text-slate-500">Total Standard Documents</span>
              <span className="font-bold text-slate-900">{totalCount}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-1">
              <span className="font-bold text-slate-500">Ready & Verified</span>
              <span className="font-bold text-emerald-700">{readyCount} ({progress}%)</span>
            </div>
          </div>
        </div>

        <h2 className="text-lg font-black mb-4 text-slate-800 uppercase tracking-wider">
          Document Status Report
        </h2>
        <div className="space-y-2">
          {docs.map((doc, index) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border-2 border-slate-200 rounded-xl bg-white"
            >
              <div className="w-6 font-black text-xl text-slate-400">{index + 1}.</div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-base">{doc.name}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{doc.date}</p>
              </div>
              <div className="flex flex-col items-end justify-center min-w-[100px]">
                {doc.status === "ready" ? (
                  <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-1 rounded">
                    ✓ Ready
                  </span>
                ) : (
                  <span className="text-amber-700 font-bold text-xs bg-amber-50 px-2 py-1 rounded">
                    Pending
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------- WEB LAYOUT -------------------- */}
      <div className="print:hidden space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm gap-6">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">
              Citizen Document Readiness Checklist
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Keep your master certificates updated to 1-click apply for government schemes.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-slate-100 dark:text-slate-800"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="175"
                  strokeDashoffset={175 - (175 * progress) / 100}
                  className="text-emerald-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-navy dark:text-white">
                {progress}%
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {readyCount} of {totalCount} Ready
              </div>
              <div className="text-xs font-medium text-slate-500">
                {progress === 100 ? "All documents verified!" : "Sync with DigiLocker or Upload"}
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsScanOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-brand-saffron to-amber-500 hover:opacity-90 text-white py-3 rounded-xl font-bold transition-all text-xs shadow-md"
          >
            <Sparkles className="w-4 h-4" /> Scan Certificate with AI OCR
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-brand-navy dark:text-white border border-slate-200 dark:border-slate-800 py-3 rounded-xl font-bold transition-all text-xs shadow-sm"
          >
            <Download className="w-4 h-4" /> Download Summary PDF
          </button>
          <button
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700 py-3 rounded-xl font-bold transition-all text-xs shadow-sm"
          >
            <Share2 className="w-4 h-4" /> Share via WhatsApp
          </button>
        </div>

        {/* Checklist items */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-saffron animate-spin mb-2" />
            <p className="text-xs font-semibold text-slate-500">Fetching live document checklist...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
              Standard Required Government Certificates
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <button
                    onClick={() => toggleDoc(doc.id)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                      doc.status === "ready"
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {doc.status === "ready" && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>

                  <div className="flex-1">
                    <div
                      className={`font-bold text-sm ${
                        doc.status === "ready"
                          ? "text-slate-800 dark:text-slate-200"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {doc.name}
                    </div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                      {doc.status === "expired" && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      {doc.status === "pending" && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                      <span
                        className={
                          doc.status === "expired"
                            ? "text-red-500 font-semibold"
                            : doc.status === "pending"
                            ? "text-amber-500 font-semibold"
                            : ""
                        }
                      >
                        {doc.date}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => document.getElementById(`file-upload-${doc.id}`)?.click()}
                      className="text-xs font-bold text-brand-saffron hover:text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-colors"
                    >
                      {doc.status === "ready" ? "Update Document" : "Upload Document"}
                    </button>
                    <input
                      type="file"
                      id={`file-upload-${doc.id}`}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUpload(doc.id);
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <DocuScanModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onDocumentVerified={(docName) => {
          // Auto-check doc if found
          const target = docs.find((d) => d.name.toLowerCase().includes(docName.toLowerCase().split(' ')[0]));
          if (target) {
            toggleDoc(target.id);
          }
        }}
      />
    </div>
  );
}
