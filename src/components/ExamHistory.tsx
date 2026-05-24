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
  ArrowRight
} from "lucide-react";
import { ExamHistoryItem, TestProgress } from "../types";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Remark generator based on NEET performance scoring percentile
  const getSimulatedRemark = (score: {
    correctCount: number;
    incorrectCount: number;
    blankCount: number;
    finalScore: number;
  }, totalQs: number) => {
    const maxScore = totalQs * 4;
    const percentage = maxScore > 0 ? (score.finalScore / maxScore) * 100 : 0;

    if (percentage >= 85) {
      return {
        tag: "CRITICAL EXCELLENCE",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        text: "Outstanding conceptual precision. Keep up this consistency to rank among the top NEET aspirants! Potential AIIMS contender.",
      };
    } else if (percentage >= 65) {
      return {
        tag: "COMPETITIVE STANDING",
        color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
        text: "Highly competitive performance. Target the specific wrong answers shown below in the Mistake Gym to secure a government medical seat.",
      };
    } else if (percentage >= 40) {
      return {
        tag: "CONCEPT STABILIZATION",
        color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
        text: "A stable attempt. You have solid knowledge but are dropping heavy negative marks. Minimize blind guessing and verify solutions.",
      };
    } else {
      return {
        tag: "URGENT DRILLS REQUIRED",
        color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
        text: "Requires intensive conceptual practice. Convert your wrong options into bookmarks and review high-yield chapters immediately.",
      };
    }
  };

  const formatTimer = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}m ${ss}s`;
  };

  return (
    <div id="exam-history-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* Title */}
      <div>
        <span className="text-[10px] font-extrabold tracking-widest text-[#ef4444] uppercase flex items-center gap-1">
          <History className="w-3.5 h-3.5" /> Simulation Records
        </span>
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
          Exam History
        </h2>
      </div>

      {/* Stats Cards Dashboard */}
      <div id="history-stats-dashboard" className="grid grid-cols-3 gap-2.5 select-none">
        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <History className="w-4 h-4 text-rose-500 mb-1" />
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">Simulated</span>
            <span className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 leading-none">
              {totalSimulated}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <Award className="w-4 h-4 text-amber-500 mb-1" />
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">Best Mark</span>
            <span className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 leading-none">
              {bestScore > 0 ? `+${bestScore}` : bestScore}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-150 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-500 mb-1" />
          <div>
            <span className="text-[9px] text-slate-400 font-bold block">Avg. Accu.</span>
            <span className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 leading-none">
              {averageAccuracy}%
            </span>
          </div>
        </div>
      </div>

      {/* Search Input Filter */}
      <div id="history-search" className="flex items-center gap-2">
        <div className="flex-1 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-150 dark:border-zinc-800/80 p-2.5 flex items-center gap-2 shadow-xs focus-within:border-indigo-500/50 transition-all">
          <input
            id="history-search-input"
            type="text"
            placeholder="Search completed exam papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-zinc-700 outline-none focus:outline-none font-medium"
          />
        </div>
      </div>

      {/* History Items list */}
      <div id="history-log-shelf" className="flex-1 space-y-3">
        {filteredItems.length === 0 ? (
          <div id="empty-history-card" className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-[#121214] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800/80 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-855 flex items-center justify-center mb-3 text-slate-400">
              <History className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-850 dark:text-zinc-300">No Exam Attempts Logged</p>
            <p className="text-xs text-slate-450 dark:text-zinc-500 mt-1 max-w-[240px] leading-normal">
              Simulate questions under <strong>Exam Mode</strong> inside workbooks. Once submitted, your NEET analysis report logs will populate here.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const totalQs = item.questions.length;
            const maxScore = totalQs * 4;
            const percentage = Math.round((item.score.finalScore / Math.max(1, maxScore)) * 100);
            
            const remark = getSimulatedRemark(item.score, totalQs);

            // Separate wrongs and blank (unattempted)
            const wrongQuestions = item.questions.filter((q) => {
              const ansIdx = item.answers[q.number];
              return ansIdx !== undefined && ansIdx !== q.correctOptionIndex;
            });

            const unattemptedQuestions = item.questions.filter((q) => {
              return item.answers[q.number] === undefined;
            });

            return (
              <div
                key={item.id}
                id={`history-[${item.id}]`}
                className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl transition-all flex flex-col relative ${
                  isExpanded
                    ? "border-rose-450 ring-1 ring-rose-500/15 shadow-md"
                    : "border-slate-100 dark:border-zinc-800/80 hover:border-slate-350 dark:hover:border-zinc-700"
                }`}
              >
                {/* Header overview - click to expand details */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="cursor-pointer space-y-2 select-none"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4">
                      <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-1 py-0.5 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center gap-1 max-w-[170px] truncate">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(item.dateTime).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-850 dark:text-zinc-100 tracking-tight leading-snug line-clamp-2">
                        {item.testTitle}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase">Marks Collected</span>
                      <span className={`text-sm font-black tracking-tight ${item.score.finalScore > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-amber-500"}`}>
                        {item.score.finalScore > 0 ? `+${item.score.finalScore}` : item.score.finalScore}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium">/{maxScore}</span>
                    </div>
                  </div>

                  {/* High level info pills list */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-605 dark:text-emerald-400">
                        {item.score.correctCount} Correct
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-505 dark:text-rose-400">
                        {item.score.incorrectCount} Wrong
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-505 dark:text-zinc-400">
                        {item.score.blankCount} Blank
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-50 dark:bg-zinc-800 text-slate-450 dark:text-zinc-400 font-mono flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimer(item.timeSpent)}
                      </span>
                    </div>
                    <div className="text-slate-450 dark:text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Report Panel */}
                {isExpanded && (
                  <div id={`history-expanded-${item.id}`} className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4">
                    {/* Remarks Section */}
                    <div className={`p-3 rounded-2xl border ${remark.color}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-extrabold tracking-widest uppercase font-mono">
                          📢 Clinician Remarks
                        </span>
                        <span className="text-[9px] font-extrabold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white dark:bg-zinc-950 font-mono">
                          {remark.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-zinc-200 leading-normal font-sans font-medium">
                        {remark.text}
                      </p>
                    </div>

                    {/* Mistakes Sub-panel (Questions went WRONG) */}
                    <div>
                      <h5 className="text-[10px] text-red-500 font-black tracking-widest uppercase font-mono mb-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Questions Went Wrong ({wrongQuestions.length})
                      </h5>
                      {wrongQuestions.length === 0 ? (
                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 italic py-1 pl-1 bg-emerald-500/5 rounded-lg border border-dashed border-emerald-500/10">
                          🎯 Outstanding! Zero negative marks dropped.
                        </p>
                      ) : (
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {wrongQuestions.map((q) => {
                            const userOptionIdx = item.answers[q.number];
                            const correctOptionIdx = q.correctOptionIndex;
                            return (
                              <div
                                key={q.number}
                                className="p-3.5 bg-rose-500/5 dark:bg-rose-950/10 border border-red-500/10 rounded-2xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[10px] text-slate-400 dark:text-transparent dark:bg-gradient-to-r dark:from-indigo-400 dark:to-teal-400 dark:bg-clip-text">
                                    Q.{q.number}
                                  </span>
                                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 font-extrabold px-1.5 py-0.5 rounded-md">
                                    {q.subject}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-zinc-250 leading-relaxed">
                                  {q.questionText}
                                </p>
                                <div className="space-y-1.5 pl-1 select-none">
                                  <div className="text-[10px] text-slate-450">
                                    Your choice: <span className="font-bold text-rose-500 line-through pr-1">{q.options[userOptionIdx!] || "None"}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-450">
                                    Correct: <span className="font-bold text-emerald-500">{q.options[correctOptionIdx]}</span>
                                  </div>
                                </div>
                                {q.solution && (
                                  <div className="mt-2.5 pt-2 border-t border-red-500/10">
                                    <span className="text-[9px] text-indigo-500 font-black tracking-wider uppercase font-mono block mb-1">
                                      Solution Blueprint
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-300 leading-normal whitespace-pre-wrap">
                                      {q.solution}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Unattempted Sub-panel (Questions went UNATTEMPTED) */}
                    <div>
                      <h5 className="text-[10px] text-slate-500 font-black tracking-widest uppercase font-mono mb-2 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Questions Left Unattempted ({unattemptedQuestions.length})
                      </h5>
                      {unattemptedQuestions.length === 0 ? (
                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 italic py-1 pl-1 bg-indigo-500/5 rounded-lg border border-dashed border-indigo-500/10">
                          🎉 Complete Coverage! You answered all questions.
                        </p>
                      ) : (
                        <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {unattemptedQuestions.map((q) => {
                            const correctOptionIdx = q.correctOptionIndex;
                            return (
                              <div
                                key={q.number}
                                className="p-3.5 bg-slate-50 dark:bg-zinc-900/60 border border-slate-150 dark:border-zinc-800/80 rounded-2xl space-y-2 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[10px] text-slate-400">
                                    Q.{q.number}
                                  </span>
                                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 font-extrabold px-1.5 py-0.5 rounded-md">
                                    {q.subject}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-zinc-250 leading-relaxed">
                                  {q.questionText}
                                </p>
                                <div className="text-[10px] text-slate-450 select-none pl-1">
                                  Correct Answer: <span className="font-bold text-emerald-500">{q.options[correctOptionIdx]}</span>
                                </div>
                                {q.solution && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800">
                                    <span className="text-[9px] text-indigo-500 font-black tracking-wider uppercase font-mono block mb-1">
                                      Solution Blueprint
                                    </span>
                                    <p className="text-[11px] text-slate-500 dark:text-zinc-300 leading-normal whitespace-pre-wrap">
                                      {q.solution}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Retest & Delete Actions */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          if (confirm(`Do you want to reset all active answers and retest '${item.testTitle}'?`)) {
                            onRetest(item.testId);
                          }
                        }}
                        className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition-all active:scale-97 cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <RotateCcw className="w-3.8 h-3.8" />
                        <span>Retest This Paper</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Delete this completed attempt log permanently from history? (Does not affect dashboard general roadmap logs)")) {
                            onDeleteHistoryItem(item.id);
                          }
                        }}
                        className="p-3 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border border-slate-200/50 dark:border-zinc-800"
                        title="Delete attempt record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
