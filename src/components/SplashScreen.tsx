import { useState, useEffect } from "react";
import { Sparkles, Award, ShieldAlert, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      id="splash-overlay"
      className="absolute inset-0 bg-[#09090b] text-white flex flex-col items-center justify-between p-8 z-50 select-none"
    >
      {/* Top Section - Status indicators */}
      <div className="w-full flex justify-between items-center text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>SYSTEM_BOOT_SECURE</span>
        </div>
        <div className="flex items-center gap-1 text-indigo-400">
          <Cpu className="w-3.5 h-3.5 animate-spin" />
          <span>API_34_ACTIVE</span>
        </div>
      </div>

      {/* Center Logo Icon and Premium Branding */}
      <div className="flex flex-col items-center text-center">
        {/* Modern App Icon with Custom Design */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-indigo-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 flex items-center justify-center border-4 border-zinc-900 shadow-xl relative z-10">
            {/* Dynamic emblem symbol representing NEET success & medical academy */}
            <span className="text-3xl font-extrabold text-white tracking-tighter drop-shadow-md">
              N+
            </span>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-zinc-900">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-widest text-zinc-100 uppercase">
          LUMEN NEET PREP
        </h1>
        <p className="text-[11px] text-indigo-400 tracking-widest font-mono mt-1 font-bold">
          BIOLOGY & PHYSICAL SCIENCES WORKBOOK
        </p>
      </div>

      {/* Bottom Progress loader & Skipping controls */}
      <div className="w-full max-w-[280px] flex flex-col items-center space-y-4">
        {/* Loading status text */}
        <div className="flex justify-between w-full text-[10px] font-mono text-zinc-500">
          <span>Caching MCQ slides...</span>
          <span className="font-bold text-zinc-350">{progress}%</span>
        </div>

        {/* Custom progress rail */}
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Version info footer */}
        <div className="pt-2 text-center">
          <span className="text-[10px] font-mono text-zinc-650 tracking-wider">
            Lumen OS • v2.5.0 • Signed Release
          </span>
        </div>

        {/* Instant Skip button for fast usage */}
        <button
          onClick={onComplete}
          className="text-[10px] text-zinc-500 hover:text-indigo-400 font-mono tracking-wider transition-colors pt-2 underline cursor-pointer"
        >
          Skip Intro
        </button>
      </div>
    </div>
  );
}
