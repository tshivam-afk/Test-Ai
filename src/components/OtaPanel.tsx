import { useState, useEffect } from "react";
import {
  Download,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  Tablet,
  Settings,
  Github,
  Award
} from "lucide-react";

interface OtaPanelProps {
  currentVersion: string;
  onUpdateVersion: (newVer: string) => void;
}

export default function OtaPanel({ currentVersion, onUpdateVersion }: OtaPanelProps) {
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [justUpdated, setJustUpdated] = useState(false);
  const [activeTab, setActiveTab] = useState<"ota" | "apk" | "about">("ota");

  const latestVersion = "2.5.0";

  useEffect(() => {
    // If current version is already 2.5.0, update is not available
    if (currentVersion === latestVersion) {
      setUpdateAvailable(false);
    } else {
      setUpdateAvailable(true);
    }
  }, [currentVersion]);

  const handleCheckUpdates = () => {
    setCheckingForUpdates(true);
    setTimeout(() => {
      setCheckingForUpdates(false);
      if (currentVersion !== latestVersion) {
        setUpdateAvailable(true);
      } else {
        alert("Your companion is up-to-date with version: " + currentVersion);
      }
    }, 1200);
  };

  const handleInstallUpdate = () => {
    setIsUpdating(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUpdating(false);
            onUpdateVersion(latestVersion);
            setJustUpdated(true);
            setUpdateAvailable(false);
          }, 600);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div id="ota-workspace" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-[#09090b]">
      {/* Title greeting bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-500/20">
          🤖
        </div>
        <div>
          <span className="text-[9px] font-bold tracking-widest text-indigo-400 uppercase block">Android Core Settings</span>
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 leading-tight">Device & OTA Control</h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-zinc-800/80 mb-4 text-xs font-bold font-mono">
        <button
          onClick={() => setActiveTab("ota")}
          className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
            activeTab === "ota"
              ? "border-indigo-500 text-indigo-505 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-zinc-500"
          }`}
        >
          📶 OTA Upgrades
        </button>
        <button
          onClick={() => setActiveTab("apk")}
          className={`flex-1 pb-2 text-center border-b-2 transition-colors ${
            activeTab === "apk"
              ? "border-indigo-500 text-indigo-505 dark:text-indigo-400"
              : "border-transparent text-slate-500 dark:text-zinc-500"
          }`}
        >
          📂 Signed APK Flow
        </button>
      </div>

      {activeTab === "ota" && (
        <div className="space-y-4">
          {/* Active Version State Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-805 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-500">System Version</span>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-[#18181b] px-2 py-0.5 rounded-md text-slate-700 dark:text-zinc-350">
                v{currentVersion}
              </span>
            </div>

            {justUpdated && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">
                  <strong>OTA Update Completed!</strong> Successfully migrated application systems to production release: <strong>v{currentVersion}</strong>.
                </p>
              </div>
            )}

            {updateAvailable ? (
              <div className="p-4.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-400 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-905 dark:text-indigo-305">OTA Patch Available: v{latestVersion}</h4>
                    <p className="text-slate-650 dark:text-zinc-400 mt-1">
                      A high-priority signed production build containing biology sectional practice, signed APK CI actions, and high-DPI icons is ready for deployment.
                    </p>
                  </div>
                </div>

                {isUpdating ? (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono font-bold">
                      <span>Downloading patch package...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-150"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallUpdate}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    Install & Restart Companion (v{latestVersion})
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-zinc-805/50">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 animate-bounce" />
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200">Your Companion is Fully Updated</p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">Compatible with latest Android API 34 security models</p>
              </div>
            )}
          </div>

          {/* Changelog & Version Log */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-805 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Info className="w-3.8 h-3.8" />
              Changelog Logs (v2.5.0)
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-650 dark:text-zinc-400 font-mono">
              <div className="border-l-2 border-indigo-505 pl-2.5">
                <span className="font-bold text-slate-800 dark:text-zinc-150 block text-[11px]">🧬 Dedicated Biology Session Toggle:</span>
                Practice high-yield Biology questions specifically mapped within index bounds 91 to 180 (standard NEET format).
              </div>

              <div className="border-l-2 border-indigo-505 pl-2.5">
                <span className="font-bold text-slate-800 dark:text-zinc-150 block text-[11px]">📦 Manual Signed APK Compilation:</span>
                Integrated modular GitHub compilation actions with multi-step Gradle security signing for release `.apk` builds.
              </div>

              <div className="border-l-2 border-indigo-505 pl-2.5">
                <span className="font-bold text-slate-800 dark:text-zinc-150 block text-[11px]">📱 High-DPI Android Icon & Splash screen:</span>
                Polished boot sequence displaying neon-glowing high-DPI adaptive launching emblems.
              </div>

              <div className="border-l-2 border-indigo-505 pl-2.5">
                <span className="font-bold text-slate-800 dark:text-zinc-150 block text-[11px]">📶 OTA Infrastructure Integration:</span>
                Support live check/download states preserving student databases (`localStorage`).
              </div>
            </div>

            {currentVersion !== latestVersion && (
              <button
                disabled={checkingForUpdates}
                onClick={handleCheckUpdates}
                className="w-full mt-2 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-[#18181b] rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingForUpdates ? "animate-spin" : ""}`} />
                {checkingForUpdates ? "Checking server..." : "Check for OTA Updates"}
              </button>
            )}
          </div>
        </div>
      )}

      {activeTab === "apk" && (
        <div className="space-y-4">
          {/* APK workflow explainer */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-805 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-905 dark:text-zinc-200 flex items-center gap-1.5">
              <Github className="w-4 h-4 text-indigo-505" />
              Build Signed APK via GitHub Action
            </h3>
            
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              We have provisioned a completely automated, secure Gradle compiler workflow that generates a production-signed Android APK.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200/50 dark:border-zinc-805 text-[11px] font-mono space-y-2 text-slate-505 dark:text-zinc-550 leading-relaxed">
              <span className="font-bold text-indigo-505 block">How to trigger build on GitHub:</span>
              <ul className="list-decimal list-inside space-y-1">
                <li>Go to your GitHub Repository</li>
                <li>Navigate to the <span className="text-slate-800 dark:text-zinc-200">Actions</span> tab</li>
                <li>Select the <span className="text-slate-850 dark:text-zinc-200 font-bold">"Build Signed Android APK"</span> workflow</li>
                <li>Click <span className="text-slate-850 dark:text-zinc-200 bg-slate-205 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Run Workflow</span> and specify variables:
                  <div className="mt-1 bg-white dark:bg-[#121214] p-1.5 rounded border border-slate-100 dark:border-zinc-800/60 font-semibold space-y-0.5 text-[9px]">
                    <p>• Version Code: 12</p>
                    <p>• Version Name: 2.5.0</p>
                    <p>• Type: Release</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-550/20 rounded-xl text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2 leading-normal select-none">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                <strong>Keystore Sign Secrets:</strong> Make sure to upload your Base64 encrypted android release keystore inside repository settings as <code className="bg-amber-100 dark:bg-amber-950/20 px-1 rounded font-bold font-mono">ANDROID_SIGNING_KEY</code>, alongside store passwords.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
