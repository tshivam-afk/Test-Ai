import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggler"
      onClick={onToggle}
      className="p-2 mr-1 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-[#18181b] dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Toggle theme mode"
    >
      {theme === "dark" ? (
        <Sun id="sun-icon" className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon id="moon-icon" className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
}
