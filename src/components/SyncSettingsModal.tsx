import React, { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  LogOut,
  Trash2,
  Loader2,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  X,
  Database,
  CloudLightning,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  auth,
  loginWithEmail,
  registerWithEmail,
  logout,
  deleteAllCloudData,
  fetchUserData,
  saveWorkbookToCloud,
  saveProgressToCloud,
  saveHistoryToCloud,
} from "../lib/firebase";
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
  syncEnabled: boolean;
  onToggleSync: (enabled: boolean) => void;
}

export default function SyncSettingsModal({
  onClose,
  tests,
  progress,
  examHistory,
  onImportCloudData,
  syncEnabled,
  onToggleSync,
}: SyncSettingsModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Email/Password authenticating states
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const currentHost = typeof window !== "undefined" ? window.location.hostname : "your-app-domain.run.app";

  // Monitor Auth Changes
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setSyncMessage({ text: "Please fill in all blanks.", type: "error" });
      return;
    }
    if (authMode === "register" && !displayName) {
      setSyncMessage({ text: "Please specify a Display Name.", type: "error" });
      return;
    }

    try {
      setActionLoading(true);
      setSyncMessage(null);

      let res;
      if (authMode === "login") {
        res = await loginWithEmail(email, password);
        setSyncMessage({ text: `Logged in successfully as ${res.user.displayName || res.user.email}!`, type: "success" });
      } else {
        res = await registerWithEmail(email, password, displayName);
        setSyncMessage({ text: "Success! Your new NEET Sync account is created and logged in.", type: "success" });
      }

      if (res.user) {
        // Clear inputs on success
        setEmail("");
        setPassword("");
        setDisplayName("");
        await handlePullAndMergeCloud(res.user.uid);
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = e.message || "An authenticating error occurred.";
      if (e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        errMsg = "Incorrect password or email. Please verify and try again.";
      } else if (e.code === "auth/user-not-found") {
        errMsg = "No account exists under this email address. Try Registering!";
      } else if (e.code === "auth/email-already-in-use") {
        errMsg = "An account under this email already exists. Please Sign In!";
      } else if (e.code === "auth/weak-password") {
        errMsg = "Password should be at least 6 characters long.";
      } else if (e.code === "auth/invalid-email") {
        errMsg = "Please provide a valid email format.";
      }
      setSyncMessage({ text: errMsg, type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setAuthLoading(true);
      await logout();
      setCurrentUser(null);
      setSyncMessage({ text: "Logged out of NEET Sync.", type: "info" });
    } catch (e: any) {
      console.error(e);
      setSyncMessage({ text: "Failed to logout.", type: "error" });
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePullAndMergeCloud = async (userId: string) => {
    try {
      setSyncLoading(true);
      const cloudData = await fetchUserData(userId);
      if (cloudData) {
        const { workbooks, progress: cloudProgress, history: cloudHistory } = cloudData;

        // Run client-side merging logic: preserve local custom items, populate missing, upload uniquely local
        const mergedTests = [...tests];
        let testsAddedFromCloudCount = 0;
        let testsUploadedToCloudCount = 0;

        // 1. Upload unique local custom tests (non-sample) that are missing in cloud
        for (const localTest of tests) {
          if (localTest.isSample) continue;
          const foundInCloud = workbooks.some((ct) => ct.id === localTest.id);
          if (!foundInCloud && syncEnabled) {
            await saveWorkbookToCloud(userId, localTest);
            testsUploadedToCloudCount++;
          }
        }

        // 2. Add cloud tests to local state if missing
        for (const cloudTest of workbooks) {
          const foundLocally = tests.some((lt) => lt.id === cloudTest.id);
          if (!foundLocally) {
            mergedTests.push(cloudTest);
            testsAddedFromCloudCount++;
          }
        }

        // 3. Merge progress maps (latest update date takes priority)
        const mergedProgress = { ...progress };
        for (const [tId, cloudProg] of Object.entries(cloudProgress)) {
          const localProg = progress[tId];
          const cloudDate = cloudProg.lastUpdatedAt ? new Date(cloudProg.lastUpdatedAt).getTime() : 0;
          const localDate = localProg?.lastUpdatedAt ? new Date(localProg.lastUpdatedAt).getTime() : 0;

          if (!localProg || cloudDate > localDate) {
            mergedProgress[tId] = cloudProg;
          } else if (localProg && localDate > cloudDate && syncEnabled) {
            await saveProgressToCloud(userId, localProg);
          }
        }

        // If a local progress is missing in cloud, sync it
        if (syncEnabled) {
          for (const [tId, localProg] of Object.entries(progress)) {
            if (!cloudProgress[tId]) {
              await saveProgressToCloud(userId, localProg);
            }
          }
        }

        // 4. Merge historic attempts list (merge unique entries by id)
        const mergedHistory = [...examHistory];
        for (const ch of cloudHistory) {
          const existsLocally = examHistory.some((lh) => lh.id === ch.id);
          if (!existsLocally) {
            mergedHistory.push(ch);
          }
        }

        if (syncEnabled) {
          for (const lh of examHistory) {
            const existsInCloud = cloudHistory.some((ch) => ch.id === lh.id);
            if (!existsInCloud) {
              await saveHistoryToCloud(userId, lh);
            }
          }
        }

        onImportCloudData({
          workbooks: mergedTests,
          progress: mergedProgress,
          history: mergedHistory,
        });

        let feedbackText = "Synchronisation complete.";
        if (testsAddedFromCloudCount > 0 || testsUploadedToCloudCount > 0) {
          feedbackText += ` Synced ${testsAddedFromCloudCount} workbooks from cloud and uploaded ${testsUploadedToCloudCount} workbooks.`;
        }
        setSyncMessage({ text: feedbackText, type: "success" });
      }
    } catch (e: any) {
      console.error(e);
      setSyncMessage({ text: "Error pulling or merging cloud synchronization snapshots.", type: "error" });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleManualSyncPush = async () => {
    if (!currentUser) return;
    try {
      setSyncLoading(true);
      setSyncMessage(null);
      // Sync custom workbooks
      for (const t of tests) {
        if (!t.isSample) {
          await saveWorkbookToCloud(currentUser.uid, t);
        }
      }
      // Sync progress
      for (const p of Object.values(progress)) {
        await saveProgressToCloud(currentUser.uid, p);
      }
      // Sync history
      for (const h of examHistory) {
        await saveHistoryToCloud(currentUser.uid, h);
      }
      setSyncMessage({ text: "All local test data successfully pushed to cloud!", type: "success" });
    } catch (e: any) {
      console.error(e);
      setSyncMessage({ text: "Failed manual sync push.", type: "error" });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDeleteCloudData = async () => {
    if (!currentUser) return;
    try {
      setDeleteLoading(true);
      setSyncMessage(null);
      await deleteAllCloudData(currentUser.uid);
      setConfirmDelete(false);
      setSyncMessage({
        text: "Permanently deleted all your exam analysis and workbook files from the cloud database successfully.",
        type: "success",
      });
    } catch (e: any) {
      console.error(e);
      setSyncMessage({ text: "Erase database action failed.", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Trigger sync on open if authenticated
  useEffect(() => {
    if (currentUser && !syncLoading && !authLoading) {
      handlePullAndMergeCloud(currentUser.uid);
    }
  }, [currentUser]);

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
            <Cloud className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-zinc-100">
              Cloud Synchronization Workspace
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
          {syncMessage && (
            <div
              id="sync-status-notification"
              className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-medium leading-relaxed ${
                syncMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-100/30 dark:border-emerald-900/30"
                  : syncMessage.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-100/30 dark:border-rose-900/30"
                  : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-950/30"
              }`}
            >
              {syncMessage.type === "success" ? (
                <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-500" />
              ) : syncMessage.type === "error" ? (
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-500" />
              ) : (
                <CloudLightning className="w-4.5 h-4.5 shrink-0 text-indigo-500 animate-pulse" />
              )}
              <span className="flex-1">{syncMessage.text}</span>
            </div>
          )}

          {authLoading ? (
            <div id="auth-connecting-state" className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400 dark:text-zinc-500">Connecting to secure account systems...</p>
            </div>
          ) : !currentUser ? (
            /* Tabbed Email/Password Register-Login flows */
            <div id="auth-credential-section" className="space-y-4 text-left">
              <div className="mx-auto w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-900/50 flex items-center justify-center mb-2">
                <CloudLightning className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="font-extrabold text-sm text-slate-850 dark:text-zinc-150">Cloud Synchronization System</h4>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Avoid browser popup limits and save your full study worksheets and timers safely across any browser or device.
                </p>
              </div>

              {/* Selector Tabs for Login vs Register */}
              <div className="grid grid-cols-2 gap-1 bg-slate-50 dark:bg-zinc-900/60 p-1 rounded-2xl border border-slate-100 dark:border-zinc-800/80 mt-4 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setSyncMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === "login"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-450 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-350 cursor-pointer"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setSyncMessage(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === "register"
                      ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-450 dark:text-zinc-500 hover:text-slate-700 dark:hover:text-zinc-350 cursor-pointer"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Input Forms */}
              <form onSubmit={handleEmailAction} className="space-y-3 mt-3 animate-fade-in">
                {authMode === "register" && (
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase mb-1 tracking-wider">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-850 dark:text-zinc-150 focus:border-indigo-500/55 focus:outline-none transition-all shadow-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase mb-1 tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-850 dark:text-zinc-150 focus:border-indigo-500/55 focus:outline-none transition-all shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 dark:text-zinc-550 uppercase mb-1 tracking-wider">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-850 dark:text-zinc-150 focus:border-indigo-500/55 focus:outline-none transition-all shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-extrabold text-xs tracking-wide transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : authMode === "login" ? (
                    "Authorize & Sign In"
                  ) : (
                    "Register & Enable Sync"
                  )}
                </button>
              </form>

              {/* Direct email guidance summary footer note */}
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850/80 rounded-2xl p-3.5 mt-2 space-y-1 text-slate-500 dark:text-zinc-450">
                <p className="font-extrabold text-slate-700 dark:text-zinc-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  No Browser Popups Needed
                </p>
                <p className="text-[10.5px] leading-relaxed">
                  Because this uses native credentials directly, it is immune to iframe blockages, cookies restriction, or popups policy blockers. Your passwords/emails are encrypted safely by Google Firebase authentication.
                </p>
              </div>
            </div>
          ) : (
            /* Logged in configurations detail workspace */
            <div id="auth-logged-in-section" className="space-y-4">
              <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-2xl p-3 border border-slate-200/50 dark:border-zinc-800/50 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
                    {currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : "US"}
                  </div>
                  <div className="text-left">
                    <p className="font-extrabold text-xs text-slate-800 dark:text-zinc-200">
                      {currentUser.displayName || "NEET Student"}
                    </p>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-500 font-mono">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <button
                  id="google-signout-action"
                  onClick={handleLogout}
                  className="p-2 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
                  title="Disconnect user session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Real-time synchronization activation state settings toggler */}
              <div className="bg-white dark:bg-zinc-905 rounded-2xl p-4 border border-slate-200 dark:border-zinc-805 space-y-3">
                <div className="flex items-center justify-between select-none">
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <Cloud className={`w-4 h-4 ${syncEnabled ? "text-emerald-500 animate-pulse" : "text-slate-400"}`} />
                      Real-time Cloud Sync
                    </h5>
                    <p className="text-[10px] text-slate-450 dark:text-zinc-500 mt-0.5">
                      Auto-sync local changes and custom tests.
                    </p>
                  </div>
                  <button
                    id="sync-toggle-action"
                    onClick={() => onToggleSync(!syncEnabled)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      syncEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        syncEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Database Metrics indicators */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-900 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                    <p className="text-[10px] text-slate-400">Workbooks</p>
                    <p className="font-black text-xs text-slate-800 dark:text-zinc-200 mt-0.5">
                      {tests.filter((t) => !t.isSample).length}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                    <p className="text-[10px] text-slate-400">Progess Maps</p>
                    <p className="font-black text-xs text-slate-800 dark:text-zinc-200 mt-0.5">
                      {Object.keys(progress).length}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-zinc-900 rounded-xl">
                    <p className="text-[10px] text-slate-400">Exam Logs</p>
                    <p className="font-black text-xs text-slate-800 dark:text-zinc-200 mt-0.5">
                      {examHistory.length}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    id="cloud-pulse-sync-action"
                    onClick={() => handlePullAndMergeCloud(currentUser.uid)}
                    disabled={syncLoading}
                    className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all cursor-pointer font-bold text-[10px] flex items-center justify-center gap-1.5 select-none"
                  >
                    {syncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                    Pull & Merge Cloud
                  </button>
                  <button
                    id="cloud-push-sync-action"
                    onClick={handleManualSyncPush}
                    disabled={syncLoading}
                    className="flex-1 py-1.5 px-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-805 text-slate-600 dark:text-zinc-400 rounded-xl transition-all cursor-pointer font-bold text-[10px] flex items-center justify-center gap-1.5 select-none"
                  >
                    {syncLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                    Push Data to Cloud
                  </button>
                </div>
              </div>

              {/* Danger Management Area: Storage erasure & suspension controls */}
              <div className="p-4 rounded-2xl border border-rose-200/50 dark:border-rose-950/30 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
                <div>
                  <h6 className="font-extrabold text-xs text-rose-850 dark:text-rose-450 flex items-center gap-1.5 select-none">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Danger Zone & Cloud Controls
                  </h6>
                  <p className="text-[10px] text-slate-450 dark:text-rose-400/80 mt-0.5 leading-normal">
                    Turn off automatic background triggers or wipe your sync state data files completely from the cloud servers.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!confirmDelete ? (
                    <button
                      id="request-erase-cloud-data-btn"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-105 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-650 dark:text-rose-400 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Wipe Data from Cloud Database
                    </button>
                  ) : (
                    <div className="space-y-2 animate-pulse bg-white dark:bg-[#121214] border border-rose-200 dark:border-rose-950 p-3 rounded-xl">
                      <p className="text-[10px] font-bold text-slate-800 dark:text-zinc-200">
                        Confirm Database Wipe? This deletes all workbooks and exam logs on cloud storage forever.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          id="confirm-erase-cloud-data-btn"
                          onClick={handleDeleteCloudData}
                          disabled={deleteLoading}
                          className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                        >
                          {deleteLoading ? "Erasing..." : "Yes, Erase Cloud Storage"}
                        </button>
                        <button
                          id="cancel-erase-cloud-data-btn"
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 rounded-lg font-bold text-[10px] transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer branding */}
        <div id="sync-settings-footer" className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-t border-slate-100 dark:border-zinc-900 select-none text-center">
          <p className="text-[9px] text-slate-400 dark:text-zinc-500 flex items-center justify-center gap-1">
            <Database className="w-3 h-3" /> Secure sync architecture built on Google Firebase Firestore & Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
