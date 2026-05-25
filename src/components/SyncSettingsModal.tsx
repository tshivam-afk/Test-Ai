import React, { useState, useRef, useEffect } from "react";
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
  Info,
  Copy,
  Check,
  ClipboardList,
  Share2,
  Cloud,
  RefreshCw,
  LogIn,
  LogOut
} from "lucide-react";
import { Test, TestProgress, ExamHistoryItem } from "../types";
import { User } from "firebase/auth";
import {
  googleSignIn,
  logoutUser,
  getCachedAccessToken,
  initAuthListener,
  findBackupFile,
  downloadBackupContent,
  uploadBackupContent,
  auth
} from "../lib/driveSync";

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
  const [copied, setCopied] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);

  // Google Drive integrations state
  const [driveUser, setDriveUser] = useState<User | null>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveBackupId, setDriveBackupId] = useState<string | null>(null);
  const [isDriveAuthed, setIsDriveAuthed] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuthListener(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
        setIsDriveAuthed(true);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
        setIsDriveAuthed(false);
      }
    );
    const cachedTok = getCachedAccessToken();
    if (cachedTok && auth.currentUser) {
      setDriveUser(auth.currentUser);
      setDriveToken(cachedTok);
      setIsDriveAuthed(true);
    }
    return () => unsubscribe();
  }, []);

  const handleDriveSignIn = async () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      setIsDriveLoading(true);
      const res = await googleSignIn();
      if (res) {
        setDriveUser(res.user);
        setDriveToken(res.accessToken);
        setIsDriveAuthed(true);
        setSuccessMsg(`Signed in as ${res.user.displayName || res.user.email} successfully! Accessing Drive with your permission.`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Google Sign-in failed: ${err.message || err}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDriveSignOut = async () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      await logoutUser();
      setDriveUser(null);
      setDriveToken(null);
      setIsDriveAuthed(false);
      setDriveBackupId(null);
      setSuccessMsg("Signed out from Google account.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Sign out failed: ${err.message || err}`);
    }
  };

  const handleBackupToDrive = async () => {
    const token = driveToken || getCachedAccessToken();
    if (!token) {
      setErrorMsg("Please Sign In with Google first to authorize Drive backup.");
      return;
    }

    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      setIsDriveLoading(true);

      const confirmed = window.confirm(
        "Are you sure you want to write your current local workspace backup (tests, progress, logs) to Google Drive? This will create or update 'neet_prep_workspace_backup.json' in your drive storage with your permission."
      );
      if (!confirmed) return;

      const dataToBackup = {
        app: "NEET PREP COMPANION",
        version: "1.0.0",
        backupTimestamp: new Date().toISOString(),
        workbooks: tests,
        progress,
        history: examHistory,
      };

      // 1. Find if a file already exists
      const existingId = await findBackupFile(token);
      
      // 2. Upload / update content
      const fileId = await uploadBackupContent(token, dataToBackup, existingId);
      setDriveBackupId(fileId);
      setSuccessMsg("Manual Cloud Backup to your Google Drive completed successfully! Your data is saved safely in 'neet_prep_workspace_backup.json'.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Drive backup failed: ${err.message || err}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    const token = driveToken || getCachedAccessToken();
    if (!token) {
      setErrorMsg("Please Sign In with Google first to authorize Drive restore.");
      return;
    }

    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      setIsDriveLoading(true);

      // 1. Search for file in drive
      const fileId = await findBackupFile(token);
      if (!fileId) {
        setErrorMsg("No prior backup named 'neet_prep_workspace_backup.json' was found in your Google Drive. Tap 'Backup to Google Drive' first to save one.");
        return;
      }

      // 2. Download content
      const content = await downloadBackupContent(token, fileId);
      if (!content || typeof content !== "object") {
        throw new Error("Invalid or corrupted backup content retrieved from Google Drive.");
      }

      const importedWorkbooks = Array.isArray(content.workbooks) ? content.workbooks : [];
      const importedProgress = content.progress && typeof content.progress === "object" ? content.progress : {};
      const importedHistory = Array.isArray(content.history) ? content.history : [];

      if (importedWorkbooks.length === 0 && Object.keys(importedProgress).length === 0 && importedHistory.length === 0) {
        throw new Error("The backup file retrieved from Google Drive contains no valid data.");
      }

      setParsedBackup({
        workbooks: importedWorkbooks,
        progress: importedProgress,
        history: importedHistory,
      });
      setParsedFilename("Google Drive Cloud Archive");
      setDriveBackupId(fileId);
      setSuccessMsg("Successfully fetched background archive from your Google Drive! Choose an import mode below to restore.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Drive restore failed: ${err.message || err}`);
    } finally {
      setIsDriveLoading(false);
    }
  };

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

      setSuccessMsg("Download request sent! Since browser sandboxes can occasionally block automatic downloads inside iframe wrappers, we highly recommend also tapping 'Copy Backup to Clipboard' below to save your text safely!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate backup JSON file.");
    }
  };

  const handleCopyBackupText = () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);
      setCopied(false);

      const dataToBackup = {
        app: "NEET PREP COMPANION",
        version: "1.0.0",
        backupTimestamp: new Date().toISOString(),
        workbooks: tests,
        progress,
        history: examHistory,
      };

      const jsonStr = JSON.stringify(dataToBackup, null, 2);
      
      navigator.clipboard.writeText(jsonStr)
        .then(() => {
          setCopied(true);
          setSuccessMsg("Backup text copied to clipboard successfully! You can paste and save this text safely in any memo, WhatsApp, or notes application.");
          setTimeout(() => setCopied(false), 4000);
        })
        .catch((err) => {
          console.error(err);
          // Standard document execCommand backup fallback
          const textArea = document.createElement("textarea");
          textArea.value = jsonStr;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setSuccessMsg("Backup text copied (fallback mode) to clipboard! Paste and save it securely.");
            setTimeout(() => setCopied(false), 4000);
          } catch (fallbackErr) {
            setErrorMsg("Direct clipboard copy was blocked by the browser wrapper. Please tap \"Show Backup String\" to copy manually.");
          }
          document.body.removeChild(textArea);
        });
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to generate backup text string.");
    }
  };

  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShareBackup = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const backupData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        tests,
        progress,
        examHistory
      };
      const jsonString = JSON.stringify(backupData, null, 2);

      if (navigator.share) {
        const shareFile = new File([jsonString], `neet_preparation_backup_${Date.now()}.json`, {
          type: "application/json"
        });

        if (navigator.canShare && navigator.canShare({ files: [shareFile] })) {
          await navigator.share({
            files: [shareFile],
            title: "NEET Prep Study Workspace Backup",
            text: "My NEET custom mock workbooks, progress, and history backup."
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
          return;
        }

        await navigator.share({
          title: "NEET Workspace Backup JSON String",
          text: jsonString
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      } else {
        await navigator.clipboard.writeText(jsonString);
        setSuccessMsg("Backup JSON copied! Web Share is restricted inside iframe preview - you can paste directly into WhatsApp / Drive / Mail.");
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Web share failed", err);
        setErrorMsg("Sharing was blocked. You can still download the backup file or use the copy button.");
      }
    }
  };

  const handleParsePastedJson = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setParsedBackup(null);
    setParsedFilename(null);

    const txt = pastedJsonText.trim();
    if (!txt) {
      setErrorMsg("Please paste your JSON backup text first.");
      return;
    }

    try {
      const parsed = JSON.parse(txt);

      // Validation checks
      if (!parsed || (typeof parsed !== "object")) {
        throw new Error("Invalid format. Pasted content is not a valid JSON object.");
      }

      const importedWorkbooks = Array.isArray(parsed.workbooks) ? parsed.workbooks : [];
      const importedProgress = parsed.progress && typeof parsed.progress === "object" ? parsed.progress : {};
      const importedHistory = Array.isArray(parsed.history) ? parsed.history : [];

      if (importedWorkbooks.length === 0 && Object.keys(importedProgress).length === 0 && importedHistory.length === 0) {
        throw new Error("Pasted text does not contain any valid NEET companion workbook or progression data.");
      }

      setParsedBackup({
        workbooks: importedWorkbooks,
        progress: importedProgress,
        history: importedHistory,
      });
      setParsedFilename("Pasted Backup Archive Content");
      setShowPasteArea(false);
      setPastedJsonText("");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Invalid JSON markup. Ensure you copied the entire backup text completely without leaving out any curly brackets.");
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

            <div className="flex flex-col gap-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Local Backup (.json)
              </button>

              <button
                onClick={handleShareBackup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {shareSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    Shared Successfully!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-emerald-100" />
                    Share Workspace Backup Directly
                  </>
                )}
              </button>

              <button
                onClick={handleCopyBackupText}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-205 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-100 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-zinc-800"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-500" />
                    Copy Backup text to Clipboard
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Import Action Card */}
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-150 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider">
                2. Restore / Import Archive
              </h4>
              <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-0.5">
                Load a previously exported '.json' backup file, or paste your copied JSON backup string below to restore custom NEET material.
              </p>
            </div>

            {/* Drag & Drop Upload Zone */}
            {!parsedBackup ? (
              <div className="space-y-3">
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
                  <p className="text-[10px] text-slate-400 font-medium">JSON format archives</p>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-150 dark:border-zinc-850"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-widest">or</span>
                  <div className="flex-grow border-t border-slate-150 dark:border-zinc-850"></div>
                </div>

                {showPasteArea ? (
                  <div className="space-y-2.5 animate-slide-up bg-slate-50 dark:bg-zinc-900/45 p-3 rounded-2xl border border-dashed border-indigo-200/50 dark:border-zinc-800">
                    <textarea
                      placeholder="Paste your copied JSON backup text here..."
                      value={pastedJsonText}
                      onChange={(e) => setPastedJsonText(e.target.value)}
                      rows={5}
                      className="w-full text-[11px] font-mono p-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-505 resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleParsePastedJson}
                        className="flex-1 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Load Backup Text
                      </button>
                      <button
                        onClick={() => {
                          setShowPasteArea(false);
                          setPastedJsonText("");
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => setShowPasteArea(true)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Paste Backup Text Instead
                    </button>
                  </div>
                )}
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
                    <span className="block font-black text-slate-805 dark:text-zinc-200 text-sm">
                      {parsedBackup.workbooks.length}
                    </span>
                    Workbooks
                  </div>
                  <div>
                    <span className="block font-black text-slate-805 dark:text-zinc-200 text-sm">
                      {Object.keys(parsedBackup.progress).length}
                    </span>
                    Progress Maps
                  </div>
                  <div>
                    <span className="block font-black text-slate-805 dark:text-zinc-200 text-sm">
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

          {/* Google Drive Synchronization (User Requested) */}
          <div className="bg-white dark:bg-zinc-900/30 border border-slate-150 dark:border-zinc-800 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-indigo-500" />
                  Google Drive Cloud Sync
                </h4>
                <p className="text-[11px] text-slate-450 dark:text-zinc-500 mt-0.5 leading-relaxed">
                  Backup your materials directly and retrieve them manually across devices.
                </p>
              </div>
            </div>

            {!isDriveAuthed ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleDriveSignIn}
                  disabled={isDriveLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 disabled:opacity-50 px-4 py-2.5 rounded-xl text-xs font-extrabold text-slate-700 dark:text-zinc-200 shadow-xs cursor-pointer transition-colors"
                >
                  {isDriveLoading ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin text-indigo-500" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0 animate-pulse" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  )}
                  <span>{isDriveLoading ? "Authorizing Security..." : "Sign in with Google"}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-850 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2 truncate">
                    {driveUser?.photoURL ? (
                      <img src={driveUser.photoURL} alt={driveUser.displayName || "User"} className="w-5.5 h-5.5 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-5.5 h-5.5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        {(driveUser?.displayName || driveUser?.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                      {driveUser?.displayName || driveUser?.email}
                    </span>
                  </div>
                  <button
                    onClick={handleDriveSignOut}
                    className="text-[10px] text-rose-500 hover:underline font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleBackupToDrive}
                    disabled={isDriveLoading}
                    className="py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDriveLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Backup to Drive</span>
                  </button>

                  <button
                    onClick={handleRestoreFromDrive}
                    disabled={isDriveLoading}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-880 dark:hover:bg-zinc-750 text-slate-800 dark:text-zinc-100 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-zinc-800"
                  >
                    {isDriveLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Restore from Drive</span>
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
