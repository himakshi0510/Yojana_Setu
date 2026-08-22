'use client';

import React, { useState, useEffect } from "react";
import { ExternalLink, Edit2, CheckCircle2, ArrowRight, Loader2, Plus, Sparkles, CalendarClock } from "lucide-react";
import { getUserTrackedApplications, updateApplicationStatus } from "@/app/actions/tracker.action";
import { updateRealtimeState } from "@/lib/realtimeSync";
import { ApplicationStatus } from "@prisma/client";
import SchemeTimelinePredictor from "@/components/SchemeTimelinePredictor";

interface TrackedApp {
  id: string;
  schemeId: string;
  schemeName: string;
  stage: ApplicationStatus;
  date: string;
  ref: string | null;
  alert: string | null;
  officialUrl: string;
  ministry: string;
}

const DEFAULT_TRACKED_APPS: TrackedApp[] = [
  {
    id: "app-1",
    schemeId: "scheme-pm-kisan",
    schemeName: "PM-Kisan Samman Nidhi",
    stage: ApplicationStatus.APPLIED,
    date: "Oct 12, 2023",
    ref: "PMK-98237-A",
    alert: null,
    officialUrl: "https://pmkisan.gov.in/",
    ministry: "Ministry of Agriculture",
  },
  {
    id: "app-2",
    schemeId: "scheme-mudra",
    schemeName: "Mudra Yojana (Shishu)",
    stage: ApplicationStatus.DOCS_PENDING,
    date: "Oct 28, 2023",
    ref: null,
    alert: "Missing Bank Statement",
    officialUrl: "https://www.mudra.org.in/",
    ministry: "Ministry of Finance",
  },
  {
    id: "app-3",
    schemeId: "scheme-ayushman",
    schemeName: "Ayushman Bharat PM-JAY",
    stage: ApplicationStatus.APPLIED,
    date: "Nov 02, 2023",
    ref: "AB-22910-X",
    alert: null,
    officialUrl: "https://pmjay.gov.in/",
    ministry: "Ministry of Health",
  },
  {
    id: "app-4",
    schemeId: "scheme-pmay-g",
    schemeName: "Awas Yojana (Gramin)",
    stage: ApplicationStatus.UNDER_REVIEW,
    date: "Sep 15, 2023",
    ref: "PMAY-0091",
    alert: "Physical Verification Pending",
    officialUrl: "https://pmayg.nic.in/",
    ministry: "Ministry of Rural Dev",
  },
];

export default function ApplicationTracker() {
  const [apps, setApps] = useState<TrackedApp[]>(DEFAULT_TRACKED_APPS);
  const [loading, setLoading] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<TrackedApp | null>(null);
  const [newRef, setNewRef] = useState("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [timelineApp, setTimelineApp] = useState<TrackedApp | null>(null);

  const columns: Array<{ id: ApplicationStatus; title: string }> = [
    { id: ApplicationStatus.INTERESTED, title: "Interested" },
    { id: ApplicationStatus.DOCS_PENDING, title: "Documents Pending" },
    { id: ApplicationStatus.APPLIED, title: "Applied" },
    { id: ApplicationStatus.UNDER_REVIEW, title: "Under Review" },
    { id: ApplicationStatus.APPROVED, title: "Approved" },
  ];

  // Fetch real applications on load
  useEffect(() => {
    async function loadApps() {
      try {
        setLoading(true);
        const res = await getUserTrackedApplications();
        if (res.success && res.data && res.data.length > 0) {
          const mapped: TrackedApp[] = res.data.map((item) => ({
            id: item.id,
            schemeId: item.schemeId,
            schemeName: item.scheme.title,
            stage: item.status,
            date: new Date(item.updatedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            ref: item.applicationReferenceNo || null,
            alert: item.notes || null,
            officialUrl: item.scheme.officialUrl || "https://myscheme.gov.in/",
            ministry: item.scheme.ministry,
          }));
          setApps(mapped);
          const active = mapped.filter(a => a.stage !== "REJECTED").length;
          updateRealtimeState({ activeApplicationsCount: active });
        }
      } catch (err) {
        console.error("Error loading tracked apps", err);
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  // Update status via Server Action
  const handleStageChange = async (appId: string, newStage: ApplicationStatus) => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;

    setStatusUpdating(appId);
    // Optimistic UI update
    const updatedApps = apps.map((a) => (a.id === appId ? { ...a, stage: newStage } : a));
    setApps(updatedApps);

    const activeCount = updatedApps.filter(a => a.stage !== "REJECTED").length;
    updateRealtimeState({ activeApplicationsCount: activeCount });

    try {
      await updateApplicationStatus({
        schemeId: app.schemeId,
        status: newStage,
        applicationReferenceNo: app.ref || undefined,
        notes: app.alert || undefined,
      });
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setStatusUpdating(null);
    }
  };

  // Open official portal
  const handleOpenPortal = (url: string) => {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    window.open(formattedUrl, "_blank", "noopener,noreferrer");
  };

  // Save reference number update
  const handleSaveRef = async () => {
    if (!editingApp) return;
    const updatedRef = newRef.trim();

    setApps((prev) =>
      prev.map((a) => (a.id === editingApp.id ? { ...a, ref: updatedRef || null } : a))
    );

    try {
      await updateApplicationStatus({
        schemeId: editingApp.schemeId,
        status: editingApp.stage,
        applicationReferenceNo: updatedRef || undefined,
      });
    } catch (err) {
      console.error("Failed to update ref", err);
    } finally {
      setEditingApp(null);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-navy dark:text-white">
            Application Tracker & Portal Bridge
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Monitor real-time status, manage reference numbers, and jump to official portal sites.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Real-time Sync Active</span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-saffron animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-500">Loading citizen application status board...</p>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[480px]">
          {columns.map((col) => {
            const colApps = apps.filter((a) => a.stage === col.id);

            return (
              <div
                key={col.id}
                className="min-w-[300px] w-[300px] bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col h-full"
              >
                <div className="flex justify-between items-center px-2 py-2 mb-3 border-b border-slate-200/60 dark:border-slate-800/60">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{col.title}</h3>
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-saffron transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {app.date}
                        </span>
                        <button
                          onClick={() => {
                            setEditingApp(app);
                            setNewRef(app.ref || "");
                          }}
                          className="text-slate-400 hover:text-brand-navy dark:hover:text-amber-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="font-bold text-brand-navy dark:text-white text-sm leading-snug mb-2">
                        {app.schemeName}
                      </h4>

                      {app.ref ? (
                        <div className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-mono px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 mb-2.5 flex items-center justify-between">
                          <span>Ref: {app.ref}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingApp(app);
                            setNewRef("");
                          }}
                          className="text-[11px] font-bold text-brand-saffron hover:underline mb-2.5 block"
                        >
                          + Add Application Ref No.
                        </button>
                      )}

                      {app.alert && (
                        <div className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium px-2.5 py-1.5 rounded border border-amber-200 dark:border-amber-800 mb-3">
                          ⚠️ {app.alert}
                        </div>
                      )}

                      {/* Stage Move Dropdown */}
                      <div className="mb-3">
                        <select
                          value={app.stage}
                          disabled={statusUpdating === app.id}
                          onChange={(e) => handleStageChange(app.id, e.target.value as ApplicationStatus)}
                          className="w-full bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-800 focus:outline-none"
                        >
                          <option value={ApplicationStatus.INTERESTED}>Stage: Interested</option>
                          <option value={ApplicationStatus.DOCS_PENDING}>Stage: Docs Pending</option>
                          <option value={ApplicationStatus.APPLIED}>Stage: Applied</option>
                          <option value={ApplicationStatus.UNDER_REVIEW}>Stage: Under Review</option>
                          <option value={ApplicationStatus.APPROVED}>Stage: Approved</option>
                        </select>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleOpenPortal(app.officialUrl)}
                          className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:text-emerald-800 transition-colors"
                        >
                          Official Portal <ExternalLink className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setTimelineApp(app)}
                          className="flex items-center gap-1 text-brand-saffron hover:text-orange-600 text-xs font-bold transition-colors"
                        >
                          <CalendarClock className="w-3 h-3" /> Timeline
                        </button>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-xs font-medium text-slate-400">
                      <span>No schemes in this stage</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Reference Number Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-brand-navy dark:text-white mb-1">
              Update Application Details
            </h3>
            <p className="text-xs text-slate-500 mb-4">{editingApp.schemeName}</p>

            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official Application Reference Number:
            </label>
            <input
              type="text"
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
              placeholder="e.g. PMK-98237-A or PMAY-0091"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-saffron mb-4 text-slate-900 dark:text-white"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingApp(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRef}
                className="px-4 py-2 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-xl text-xs font-bold shadow-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Timeline Predictor Modal */}
      <SchemeTimelinePredictor
        isOpen={!!timelineApp}
        onClose={() => setTimelineApp(null)}
        schemeName={timelineApp?.schemeName}
        currentStage={timelineApp?.stage}
      />
    </div>
  );
}
