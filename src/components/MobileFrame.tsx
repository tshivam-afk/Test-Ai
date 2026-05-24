import { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
  theme: "light" | "dark" | "amoled";
}

export default function MobileFrame({ children, theme }: MobileFrameProps) {
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
