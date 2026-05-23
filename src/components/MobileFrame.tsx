import { ReactNode, useEffect, useState } from "react";
import { Battery, Wifi, Signal } from "lucide-react";

interface MobileFrameProps {
  children: ReactNode;
  theme: "light" | "dark";
}

export default function MobileFrame({ children, theme }: MobileFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateClock();
    const timerId = setInterval(updateClock, 30000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <div
      id="android-frame-root"
      className="flex items-center justify-center min-h-screen bg-neutral-100 dark:bg-zinc-950 transition-colors duration-300 p-0 sm:p-4 outline-none select-none"
    >
      {/* Immersive Smartphone Bezel container */}
      <div
        id="android-device-wrapper"
        className="w-full sm:max-w-[450px] sm:h-[840px] max-h-screen sm:rounded-[36px] bg-white dark:bg-[#09090b] border-0 sm:border-8 border-slate-900 dark:border-zinc-800 flex flex-col shadow-2xl overflow-hidden relative transition-colors duration-300 sm:ring-4 sm:ring-slate-900/10 dark:sm:ring-zinc-800/20"
      >
        {/* Android Status Bar emulator */}
        <div
          id="android-status-bar"
          className="h-8 bg-slate-50 dark:bg-[#121214] border-b border-gray-100 dark:border-zinc-800/50 flex items-center justify-between px-6 text-slate-850 dark:text-zinc-400 font-mono text-[10px] select-none transition-colors"
        >
          <div id="status-bar-time" className="font-semibold select-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {time || "12:00 PM"}
          </div>

          {/* Android Notch / Speaker / Camera bar centered */}
          <div
            id="device-notch"
            className="hidden sm:block absolute left-1/2 -translate-x-1/2 top-1.5 w-24 h-4 bg-slate-950 dark:bg-zinc-950 rounded-full"
          />

          <div id="status-bar-icons" className="flex items-center gap-1.5 opacity-85">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic App Content Space */}
        <main
          id="android-app-content"
          className="flex-1 overflow-hidden flex flex-col bg-slate-50 dark:bg-[#09090b] relative"
        >
          {children}
        </main>

        {/* Immersive Android Bottom Navigation Bar Pills */}
        <div
          id="android-navigation-pill"
          className="h-5 bg-slate-50 dark:bg-[#121214] border-t border-gray-100 dark:border-zinc-800/10 flex items-center justify-center transition-colors"
        >
          <div
            id="nav-navigation-bar-pill"
            className="w-24 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full cursor-pointer hover:bg-slate-400 active:bg-slate-500 duration-150"
          />
        </div>
      </div>
    </div>
  );
}
