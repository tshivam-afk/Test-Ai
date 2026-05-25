import React, { useState, useMemo } from "react";
import {
  History,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trash2,
  BookOpen,
  Info,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain
} from "lucide-react";
import { ExamHistoryItem, TestProgress } from "../types";
import DetailedHistoryReview from "./DetailedHistoryReview";

interface ExamHistoryProps {
  historyItems: ExamHistoryItem[];
  onDeleteHistoryItem: (itemId: string) => void;
  onRetest: (testId: string) => void;
}

export default function ExamHistory({
  historyItems,
  onDeleteHistoryItem,
  onRetest,
}: ExamHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReviewItem, setActiveReviewItem] = useState<ExamHistoryItem | null>(null);

  const filteredItems = useMemo(() => {
    return historyItems.filter((item) =>
      item.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [historyItems, searchQuery]);

  // General statistics
  const totalSimulated = historyItems.length;
  const bestScore = useMemo(() => {
    if (historyItems.length === 0) return 0;
    return Math.max(...historyItems.map((item) => item.score.finalScore));
  }, [historyItems]);

  const averageAccuracy = useMemo(() => {
    if (historyItems.length === 0) return 0;
    const totalAttempted = historyItems.reduce(
      (sum, item) => sum + item.score.correctCount + item.score.incorrectCount,
      0
    );
    if (totalAttempted === 0) return 0;
    const totalCorrect = historyItems.reduce((sum, item) => sum + item.score.correctCount, 0);
    return Math.round((totalCorrect / totalAttempted) * 100);
  }, [historyItems]);

  // Calculate overall average time spent per question across all attempts
  const averagePace = useMemo(() => {
    if (historyItems.length === 0) return 0;
    const totalTimeSpent = historyItems.reduce((sum, item) => sum + item.timeSpent, 0);
    const totalQsCount = historyItems.reduce((sum, item) => sum + item.questions.length, 0);
    if (totalQsCount === 0) return 0;
    return Math.round(totalTimeSpent / totalQsCount);
  }, [historyItems]);

  const formatTimer = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}m ${ss}s`;
  };

  return (
    <div id="exam-history-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4 relative">
      {/* Title */}
      <div>
        <span className="text-[10px] font-extrabold tracking-widest text-[#ef4444] uppercase flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> Simulation Records
        </span>
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
          Exam History
        </h2>
      </div>

       {/* Stats Cards Dashboard (redefined as a responsive stats grid to prevent narrow overlap) */}
      <div id="history-stats-dashboard" className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-200 dark:border-zinc-805 flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500">
            <History className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Simulated</span>
            <span className="font-extrabold text-base text-slate-800 dark:text-zinc-100 leading-tight">
              {totalSimulated} <span className="text-[10px] font-medium text-slate-400">Tests</span>
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-200 dark:border-zinc-805 flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Best Mark</span>
            <span className="font-extrabold text-base text-slate-800 dark:text-zinc-100 leading-tight">
              {bestScore > 0 ? `+${bestScore}` : bestScore}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-200 dark:border-zinc-850 flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Avg. Accu.</span>
            <span className="font-extrabold text-base text-slate-800 dark:text-zinc-100 leading-tight">
              {averageAccuracy}%
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-200 dark:border-zinc-850 flex items-center gap-3 shadow-xs">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider leading-none">Avg. Pace</span>
            <span className="font-extrabold text-base text-slate-800 dark:text-zinc-100 leading-tight">
              {averagePace}s <span className="text-[10px] text-slate-450 font-normal">/Q</span>
            </span>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div id="history-search" className="flex items-center gap-2">
        <div className="flex-1 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-zinc-800/80 p-2.5 flex items-center gap-2 shadow-xs focus-within:border-indigo-500/50 transition-all">
          <input
            id="history-search-input"
            type="text"
            placeholder="Search completed exam papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-zinc-750 outline-none focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* History Items list */}
      <div id="history-log-shelf" className="flex-1 space-y-3">
        {filteredItems.length === 0 ? (
          <div id="empty-history-card" className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-[#121214] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800/80 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-3 text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-zinc-300">No Exam Attempts Logged</p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[240px] leading-normal">
              Simulate questions under <strong>Exam Mode</strong> inside workbooks. Once submitted, your NEET analysis report logs will populate here.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const totalQs = item.questions.length;
            const maxScore = totalQs * 4;
            const attemptPace = totalQs > 0 ? Math.round(item.timeSpent / totalQs) : 0;

            return (
              <div
                key={item.id}
                id={`history-[${item.id}]`}
                onClick={() => setActiveReviewItem(item)}
                className="p-4 bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl transition-all flex flex-col relative group cursor-pointer shadow-xs hover:shadow-md"
              >
                {/* Header overview */}
                <div className="space-y-2 select-none">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4">
                      <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center gap-1 max-w-[170px] truncate">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.dateTime).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-zinc-100 tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.testTitle}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase leading-tight">Total Marks</span>
                      <span className={`text-sm font-black tracking-tight ${item.score.finalScore > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-500"}`}>
                        {item.score.finalScore > 0 ? `+${item.score.finalScore}` : item.score.finalScore}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">/{maxScore}</span>
                    </div>
                  </div>

                   {/* High level info pills list */}
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-dashed border-slate-100 dark:border-zinc-850">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        {item.score.correctCount} Correct
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-rose-500 dark:text-rose-400">
                        {item.score.incorrectCount} Incorrect
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-zinc-400 font-semibold">
                        {item.score.blankCount} Skip
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 flex items-center gap-0.5 font-mono">
                        <Clock className="w-2.5 h-2.5 text-indigo-500" />
                        {attemptPace}s/Q
                      </span>
                    </div>

                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-0.5 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      <span>Detailed diagnostics</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Direct quick delete shortcut button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this completed attempt log permanently from history?")) {
                      onDeleteHistoryItem(item.id);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:text-zinc-650 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer border border-transparent hover:border-slate-150 dark:hover:border-zinc-700/50"
                  title="Wipe attempt permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Maximized Detailed Report view loaded elegantly as absolute frame takeover */}
      {activeReviewItem && (
        <DetailedHistoryReview
          item={activeReviewItem}
          onClose={() => setActiveReviewItem(null)}
          onRetest={onRetest}
        />
      )}
    </div>
  );
}
