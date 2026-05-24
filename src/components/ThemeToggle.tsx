import { Sun, Moon, Sparkles } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark" | "amoled";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggler"
      onClick={onToggle}
      className="p-2 mr-1 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center gap-1 active:scale-95 cursor-pointer"
      title={
        theme === "light"
          ? "Switch to Midnight Dark"
          : theme === "dark"
          ? "Switch to AMOLED Pure Black"
          : "Switch to Sunlight Light"
      }
      aria-label="Toggle theme mode"
    >
      {theme === "light" ? (
        <Moon id="moon-icon" className="w-4.5 h-4.5 text-slate-700" />
      ) : theme === "dark" ? (
        <Sparkles id="sparkles-icon" className="w-4.5 h-4.5 text-indigo-400" />
      ) : (
        <Sun id="sun-icon" className="w-4.5 h-4.5 text-amber-400" />
      )}
    </button>
  );
}
