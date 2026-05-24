import React, { useState, useRef } from "react";
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
  ShieldAlert,
  Info
} from "lucide-react";
import { Test, TestProgress, ExamHistoryItem } from "../types";

interface SyncSettingsModalProps {
  onClose: () => void;
  tests: Test[];
  progress: Record<string, TestProgress>;
  examHistory: ExamHistoryItem[];
  onImportCloudData: (data: {
    workbooks: Test[];
    progress: Record<string, TestProgress>;
    history: ExamHistoryItem[];
  }) => void;
  // Unused properties can be accepted and ignored gracefully to keep parent compatibility
  syncEnabled?: boolean;
  onToggleSync?: (enabled: boolean) => void;
}

export default function SyncSettingsModal({
  onClose,
  tests,
  progress,
  examHistory,
  onImportCloudData,
}: SyncSettingsModalProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Read-in backup state
  const [parsedBackup, setParsedBackup] = useState<{
    workbooks: Test[];
    progress: Record<string, TestProgress>;
    history: ExamHistoryItem[];
  } | null>(null);
  const [parsedFilename, setParsedFilename] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export current local state to JSON
  const handleExportBackup = () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);

      // Extract custom created tests (non-sample) and all other items
      // To guarantee a complete portability, we backup everything (both custom and sample state)
      const dataToBackup = {
        app: "NEET PREP COMPANION",
        version: "1.0.0",
        backupTimestamp: new Date().toISOString(),
        workbooks: tests,
        progress,
        history: examHistory,
      };

      const jsonStr = JSON.stringify(dataToBackup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      const timeStr = new Date().toTimeString().split(" ")[0].replace(/:/g, "-");
      
      a.href = url;
      a.download = `neet_prep_workspace_backup_${dateStr}_${timeStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg("Backup downloaded successfully! Store it safely or send it to another browser.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate backup JSON file.");
    }
  };

  // 2. Parse uploaded JSON backup
  const handleFileParse = (file: File) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setParsedBackup(null);
    setParsedFilename(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation checks
        if (!parsed || (typeof parsed !== "object")) {
          throw new Error("Invalid format. File is not a valid JSON structure.");
        }

        const importedWorkbooks = Array.isArray(parsed.workbooks) ? parsed.workbooks : [];
        const importedProgress = parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {};
        const importedHistory = Array.isArray(parsed.history) ? parsed.history : [];

        if (importedWorkbooks.length === 0 && Object.keys(importedProgress).length === 0 && importedHistory.length === 0) {
          throw new Error("The selected backup file is empty and contains no workspace states.");
        }

        setParsedBackup({
          workbooks: importedWorkbooks,
          progress: importedProgress,
          history: importedHistory,
        });
        setParsedFilename(file.name);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || "Invalid or corrupt backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileParse(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileParse(e.dataTransfer.files[0]);
    }
  };

  // 3. Keep current data, merge in new data (intelligent merge)
  const executeMergeImport = () => {
    if (!parsedBackup) return;

    try {
      // Merge custom tests by ID (incoming overrides existing if duplicate, otherwise Appends)
      const mergedTestsMap = new Map<string, Test>();
      tests.forEach((t) => mergedTestsMap.set(t.id, t));
      parsedBackup.workbooks.forEach((t) => mergedTestsMap.set(t.id, t));
      const mergedTests = Array.from(mergedTestsMap.values());

      // Merge progress metrics
      const mergedProgress = { ...progress, ...parsedBackup.progress };

      // Merge history items by unique ID
      const mergedHistoryMap = new Map<string, ExamHistoryItem>();
      examHistory.forEach((item) => mergedHistoryMap.set(item.id, item));
      parsedBackup.history.forEach((item) => mergedHistoryMap.set(item.id, item));
      const mergedHistory = Array.from(mergedHistoryMap.values());

      // Trigger state push back to the parent app state
      onImportCloudData({
        workbooks: mergedTests,
        progress: mergedProgress,
        history: mergedHistory,
      });

      setSuccessMsg(`Merged backup successfully! Added/Updated ${parsedBackup.workbooks.length} workbooks, progress states, and logs.`);
      setParsedBackup(null);
      setParsedFilename(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to complete data merging.");
    }
  };

  // 4. Overwrite everything
  const executeOverwriteImport = () => {
    if (!parsedBackup) return;

    try {
      onImportCloudData({
        workbooks: parsedBackup.workbooks,
        progress: parsedBackup.progress,
        history: parsedBackup.history,
      });

      setSuccessMsg(`Restored fresh backup! Overwrote existing local space with ${parsedBackup.workbooks.length} workbooks.`);
      setParsedBackup(null);
      setParsedFilename(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to complete backup restoration.");
    }
  };

  // 5. Hard Reset/Wipe database
  const executeLocalWipe = () => {
    try {
      // Call with default sample states
      onImportCloudData({
        workbooks: [], // This forces App to load default blank or sample files on next bootstrap or clean refresh
        progress: {},
        history: [],
      });
      setShowWipeConfirm(false);
      setSuccessMsg("Local workspace data successfully wiped! App is reverted to default sample templates.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Reset action failed.");
    }
  };

  return (
    <div
      id="sync-settings-backdrop"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans"
    >
      <div
        id="sync-settings-box"
        className="w-full max-w-md bg-white dark:bg-[#0c0c0e] rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div id="sync-settings-header" className="px-5 py-4.5 border-b border-slate-100 dark:border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-505 shrink-0" />
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-zinc-100">
              Workspace Backup & Portability
            </span>
          </div>
          <button
            id="close-sync-modal"
            onClick={onClose}
            className="p-1 px-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div id="sync-settings-body" className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar max-h-[80vh]">
          {/* Info intro banner */}
          <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 flex gap-3 text-xs text-slate-600 dark:text-zinc-400">
            <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-slate-800 dark:text-zinc-200">No Sign-in or Internet Required!</p>
              <p className="leading-relaxed text-[11px] text-slate-500 dark:text-zinc-500">
                Instantly backup mock worksheets, notes, OMR answers, and full performance analysis logs directly. Perfect for transferring worksheets or saving your streak progress safely offline.
              </p>
            </div>
          </div>

          {/* Messages */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-400 rounded-2xl flex items-start gap-2 text-xs">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-500 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/25 border border-rose-100/50 dark:border-rose-900/40 text-rose-800 dark:text-rose-400 rounded-2xl flex items-start gap-2 text-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Current Workspace Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100/50 dark:border-zinc-850">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Workbooks</p>
              <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mt-0.5">
                {tests.length}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100/50 dark:border-zinc-850">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Progress</p>
              <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mt-0.5">
                {Object.keys(progress).length}
              </p>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100/50 dark:border-zinc-850">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Exam Logs</p>
              <p className="font-black text-sm text-slate-800 dark:text-zinc-100 mt-0.5">
                {examHistory.length}
              </p>
            </div>
          </div>

          {/* Export Action Card */}
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-150 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                1. Save Backup Archive
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-0.5">
                Export and download all current MCQ mock workbooks & studies to a backup file.
              </p>
            </div>

            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Local Backup (.json)
            </button>
          </div>

          {/* Import Action Card */}
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-150 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                2. Restore / Import Archive
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-0.5">
                Load a previously exported '.json' backup file to restore custom NEET material.
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            {!parsedBackup ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20"
                    : "border-slate-200 dark:border-zinc-800 hover:border-slate-350 dark:hover:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950/20"
                }`}
              >
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-6 h-6 text-indigo-500" />
                <div className="text-xs text-slate-650 dark:text-zinc-350">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Click to browse
                  </span>{" "}
                  or drag backup file here
                </div>
                <p className="text-[10px] text-slate-400">JSON format archives only</p>
              </div>
            ) : (
              /* Backup File Details & Action Confirmation */
              <div className="bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/30 rounded-2xl p-4 space-y-3.5 animate-slide-up">
                <div className="flex items-center gap-2 text-xs border-b border-indigo-100/50 dark:border-indigo-900/30 pb-2">
                  <FileText className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <span className="font-extrabold text-slate-800 dark:text-zinc-200 max-w-[200px] truncate select-all" title={parsedFilename || ""}>
                    {parsedFilename}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600 dark:text-zinc-450">
                  <div>
                    <span className="block font-black text-slate-800 dark:text-zinc-205 text-sm">
                      {parsedBackup.workbooks.length}
                    </span>
                    Workbooks
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 dark:text-zinc-205 text-sm">
                      {Object.keys(parsedBackup.progress).length}
                    </span>
                    Progress Maps
                  </div>
                  <div>
                    <span className="block font-black text-slate-800 dark:text-zinc-205 text-sm">
                      {parsedBackup.history.length}
                    </span>
                    Exam Logs
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1 font-sans">
                  <button
                    onClick={executeMergeImport}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                  >
                    Merge with Current Data
                  </button>
                  <button
                    onClick={executeOverwriteImport}
                    className="w-full py-2 bg-rose-605 hover:bg-rose-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer"
                  >
                    Overwrite to Pure Backup (Replace All)
                  </button>
                  <button
                    onClick={() => {
                      setParsedBackup(null);
                      setParsedFilename(null);
                    }}
                    className="w-full py-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
                  >
                    Cancel / Pick Another File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="border border-rose-200/50 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/10 rounded-2xl p-4 space-y-3">
            <div>
              <h5 className="text-xs font-extrabold text-rose-800 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Danger Zone
              </h5>
              <p className="text-[11px] text-slate-450 dark:text-rose-450 mt-0.5 leading-normal">
                Wipe your local storage data entirely. This reverts everything back to default template presets.
              </p>
            </div>

            {!showWipeConfirm ? (
              <button
                onClick={() => setShowWipeConfirm(true)}
                className="w-full py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-650 dark:text-rose-405 border border-rose-100 dark:border-rose-900/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Wipe ALL Local Storage Data
              </button>
            ) : (
              <div className="bg-white dark:bg-[#121214] border border-rose-200 dark:border-rose-950/80 p-3 rounded-2xl space-y-2.5 animate-pulse">
                <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200">
                  Are you absolutely sure? This permanently deletes all your study workbooks and historical log analytics!
                </p>
                <div className="flex items-center gap-2 font-sans">
                  <button
                    onClick={executeLocalWipe}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Confirm Wipe
                  </button>
                  <button
                    onClick={() => setShowWipeConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Footer branding */}
        <div id="sync-settings-footer" className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-900 select-none text-center">
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1">
            <Database className="w-3 h-3" /> Fully Local Backup Utility • No cookies blocks or password leakage risk.
          </p>
        </div>
      </div>
    </div>
  );
}
