'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, CheckCircle2, AlertTriangle, Sparkles, X, Loader2, RefreshCw, Eye, ShieldCheck
} from 'lucide-react';
import { updateRealtimeState } from '@/lib/realtimeSync';

interface DocuScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentVerified?: (docName: string) => void;
}

export default function DocuScanModal({ isOpen, onClose, onDocumentVerified }: DocuScanModalProps) {
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar Card');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    docName: string;
    docNumber: string;
    issueDate: string;
    validity: string;
    status: 'VALID' | 'EXPIRED' | 'REQUIRES_RENEWAL';
    confidence: number;
    extractedFields: Record<string, string>;
  } | null>(null);

  const docTypes = [
    'Aadhaar Card',
    'Income Certificate',
    'Caste Certificate (OBC/SC/ST)',
    'Ration Card (NFSA)',
    'Kisan Credit Card (KCC)',
    'Disability Certificate (UDID)',
  ];

  const handleSimulateScan = (fileName: string) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      let result;

      if (selectedDocType.includes('Income')) {
        result = {
          docName: 'State Income Certificate',
          docNumber: `INC/UP/2025/${Math.floor(100000 + Math.random() * 900000)}`,
          issueDate: '15-Jan-2025',
          validity: 'Valid till Jan 2028 (3 Years)',
          status: 'VALID' as const,
          confidence: 99.2,
          extractedFields: {
            'Annual Family Income': '₹1,80,000 / Year',
            'Issuing Tehsildar': 'Tehsil Sadar, Varanasi',
            'Category': 'Low Income Group (LIG)',
          },
        };
      } else if (selectedDocType.includes('Caste')) {
        result = {
          docName: 'OBC Caste Certificate',
          docNumber: `OBC/UP/2024/${Math.floor(100000 + Math.random() * 900000)}`,
          issueDate: '10-Mar-2024',
          validity: 'Lifetime (Non-Creamy Layer)',
          status: 'VALID' as const,
          confidence: 98.7,
          extractedFields: {
            'Category': 'OBC (Other Backward Classes)',
            'Sub-Caste': 'Yadav / Maurya',
            'Issuing Authority': 'Sub-Divisional Magistrate (SDM)',
          },
        };
      } else {
        result = {
          docName: 'Aadhaar Identity Card',
          docNumber: `xxxx-xxxx-${Math.floor(1000 + Math.random() * 9000)}`,
          issueDate: 'Verified via UIDAI',
          validity: 'Permanent',
          status: 'VALID' as const,
          confidence: 99.9,
          extractedFields: {
            'Name': 'Verified Citizen',
            'Biometric Status': 'Locked & Active',
            'Address Link': 'State Verified',
          },
        };
      }

      setScanResult(result);
      if (onDocumentVerified) {
        onDocumentVerified(selectedDocType);
      }
    }, 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-saffron to-amber-500 flex items-center justify-center text-white font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xl font-black text-brand-navy dark:text-white">AI Document Inspector & OCR</h3>
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              ADD-ON • OCR Vision AI
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Upload any government certificate to instantly verify authenticity, extract validity, and update checklist status.
        </p>

        {/* Document Type Selector */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Select Document Type to Verify
          </label>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-saffron"
          >
            {docTypes.map((dt) => (
              <option key={dt} value={dt}>{dt}</option>
            ))}
          </select>
        </div>

        {/* Upload / Drag and Drop Area */}
        <div
          onClick={() => handleSimulateScan('certificate_sample.jpg')}
          className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-brand-saffron dark:hover:border-brand-saffron rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-900/50 cursor-pointer transition-all group mb-6"
        >
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-brand-saffron animate-spin mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">AI OCR Vision Engine Scanning...</p>
              <p className="text-xs text-slate-400 mt-1">Extracting Certificate ID, Dates & Watermarks</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-brand-saffron flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-brand-navy dark:text-white">Click or drag image to scan document</p>
              <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, PDF up to 10MB</p>
            </div>
          )}
        </div>

        {/* OCR Result Card */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  {scanResult.docName} — Verified Valid
                </span>
              </div>
              <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
                {scanResult.confidence}% AI Confidence
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-emerald-200/60 dark:border-emerald-900/60 pt-2">
              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Certificate No:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{scanResult.docNumber}</p>
              </div>
              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Validity:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{scanResult.validity}</p>
              </div>
            </div>

            {Object.entries(scanResult.extractedFields).map(([key, val]) => (
              <div key={key} className="flex justify-between text-xs border-t border-emerald-100 dark:border-emerald-950 pt-1.5">
                <span className="text-slate-500 dark:text-slate-400">{key}:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-brand-navy dark:bg-white text-white dark:text-brand-navy font-bold text-xs px-5 py-2.5 rounded-xl shadow-md"
          >
            Close Inspector
          </button>
        </div>
      </motion.div>
    </div>
  );
}
