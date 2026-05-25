import React, { useState, useMemo } from "react";
import {
  X,
  Clock,
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Brain,
  Filter,
  ArrowLeft,
  Calendar,
  Sparkles,
  Search,
  BookMarked
} from "lucide-react";
import { ExamHistoryItem, Question } from "../types";

interface DetailedHistoryReviewProps {
  item: ExamHistoryItem;
  onClose: () => void;
  onRetest: (testId: string) => void;
}

export default function DetailedHistoryReview({
  item,
  onClose,
  onRetest,
}: DetailedHistoryReviewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "mistakes" | "skipped" | "all">("summary");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [searchQuery, setSearchQuery] = useState("");

  const totalQs = item.questions.length;
  const maxScore = totalQs * 4;
  const percentage = Math.round((item.score.finalScore / Math.max(1, maxScore)) * 100);

  // Subjects available in this test paper
  const subjectsList = useMemo(() => {
    const subs = new Set(item.questions.map((q) => q.subject));
    return ["All Subjects", ...Array.from(subs)];
  }, [item.questions]);

  // Average time spent per question
  const avgSecPerQuestion = useMemo(() => {
    if (totalQs === 0) return 0;
    return Math.round(item.timeSpent / totalQs);
  }, [item.timeSpent, totalQs]);

  // Categorize questions
  const wrongQuestions = useMemo(() => {
    return item.questions.filter((q) => {
      const selected = item.answers[q.number];
      return selected !== undefined && selected !== q.correctOptionIndex;
    });
  }, [item.questions, item.answers]);

  const skippedQuestions = useMemo(() => {
    return item.questions.filter((q) => {
      return item.answers[q.number] === undefined;
    });
  }, [item.questions, item.answers]);

  const correctQuestions = useMemo(() => {
    return item.questions.filter((q) => {
      const selected = item.answers[q.number];
      return selected === q.correctOptionIndex;
    });
  }, [item.questions, item.answers]);

  // Filters output
  const filteredQuestions = useMemo(() => {
    let list = item.questions;

    if (activeSubTab === "mistakes") {
      list = wrongQuestions;
    } else if (activeSubTab === "skipped") {
      list = skippedQuestions;
    }

    if (subjectFilter !== "All Subjects") {
      list = list.filter((q) => q.subject === subjectFilter);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (q) =>
          q.questionText.toLowerCase().includes(query) ||
          q.solution?.toLowerCase().includes(query) ||
          `q.${q.number}`.includes(query)
      );
    }

    return list;
  }, [item.questions, activeSubTab, wrongQuestions, skippedQuestions, subjectFilter, searchQuery]);

  const formatTimer = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}m ${ss}s`;
  };

  // Detailed subject accuracy calculations
  const subjectBreakdown = useMemo(() => {
    const stats: Record<string, { correct: number; incorrect: number; blank: number; total: number }> = {};
    
    item.questions.forEach((q) => {
      if (!stats[q.subject]) {
        stats[q.subject] = { correct: 0, incorrect: 0, blank: 0, total: 0 };
      }
      stats[q.subject].total++;
      
      const selected = item.answers[q.number];
      if (selected === undefined) {
        stats[q.subject].blank++;
      } else if (selected === q.correctOptionIndex) {
        stats[q.subject].correct++;
      } else {
        stats[q.subject].incorrect++;
      }
    });

    return Object.entries(stats).map(([subj, data]) => {
      const score = data.correct * 4 - data.incorrect;
      const accuratePercent = data.total > 0 ? Math.round((data.correct / (data.correct + data.incorrect || 1)) * 100) : 0;
      return { subject: subj, ...data, score, accuracy: accuratePercent };
    });
  }, [item.questions, item.answers]);

  return (
    <div
      id="detailed-history-review-root"
      className="absolute inset-0 bg-slate-50 dark:bg-[#09090b] z-50 flex flex-col font-sans animate-fade-in"
    >
      {/* Top sticky navbar */}
      <div className="h-14 px-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between select-none">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-zinc-350 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-505" />
          <span>Back to List</span>
        </button>

        <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 tracking-tight max-w-[180px] truncate" title={item.testTitle}>
          {item.testTitle}
        </span>

        <button
          onClick={() => {
            if (confirm(`Do you wish to reset answers & retest this NEET paper?`)) {
              onRetest(item.testId);
              onClose();
            }
          }}
          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-xl text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all border border-indigo-150 dark:border-indigo-900/30"
        >
          <RotateCcw className="w-3 h-3" />
          Repeat Test
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
        {/* Header Hero Area */}
        <div className="bg-white dark:bg-[#0c0c0e] py-6 px-5 border-b border-slate-100 dark:border-zinc-850 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-black tracking-widest text-[#ef4444] uppercase px-2 py-0.5 rounded-md bg-rose-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 mb-1.5 inline-block">
                NEET Performance Analysis Report
              </span>
              <h2 className="font-black text-xl text-slate-900 dark:text-zinc-100 tracking-tight leading-snug">
                {item.testTitle}
              </h2>
              <div className="text-[10px] text-slate-450 dark:text-zinc-550 flex items-center gap-1 mt-1 font-semibold uppercase">
                <Calendar className="w-3 h-3" /> 
                {new Date(item.dateTime).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20 text-center shadow-xs shrink-0">
              <span className="text-[9px] text-indigo-405 dark:text-indigo-400 uppercase tracking-wider block font-bold">Total Marks</span>
              <span className="font-black text-2xl text-indigo-650 dark:text-indigo-300">
                {item.score.finalScore > 0 ? `+${item.score.finalScore}` : item.score.finalScore}
              </span>
              <span className="text-[10px] text-slate-400 block font-bold">/{maxScore}</span>
            </div>
          </div>

          {/* KPI Dashboard (Refined to responsive layout to prevent overlaps on mobile / narrow viewports) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/35 rounded-2xl flex flex-col justify-center">
              <span className="block text-[9px] uppercase tracking-wider text-emerald-500 dark:text-emerald-400 font-extrabold mb-1">Correct Answers</span>
              <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">+{item.score.correctCount * 4} Marks</span>
              <span className="block text-[10px] text-slate-450 mt-1 font-bold">({item.score.correctCount} / {totalQs} Qs)</span>
            </div>
            
            <div className="p-3 bg-rose-50/50 dark:bg-rose-955/15 border border-rose-100 dark:border-rose-900/35 rounded-2xl flex flex-col justify-center">
              <span className="block text-[9px] uppercase tracking-wider text-rose-500 dark:text-rose-400 font-extrabold mb-1">Negative Penalty</span>
              <span className="font-extrabold text-base text-rose-600 dark:text-rose-400">-{item.score.incorrectCount * 1} Marks</span>
              <span className="block text-[10px] text-slate-450 mt-1 font-bold">({item.score.incorrectCount} / {totalQs} Qs)</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl flex flex-col justify-center">
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">Skipped Questions</span>
              <span className="font-extrabold text-base text-slate-500 dark:text-zinc-400">0 Penalty</span>
              <span className="block text-[10px] text-slate-450 mt-1 font-bold">({item.score.blankCount} Skip Qs)</span>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl flex flex-col justify-center">
              <span className="block text-[9px] uppercase tracking-wider text-indigo-500 dark:text-indigo-400 font-extrabold mb-1">Average Pace</span>
              <span className="font-extrabold text-base text-indigo-650 dark:text-indigo-400">{avgSecPerQuestion}s / Q</span>
              <span className="block text-[10px] text-slate-450 mt-1 font-bold">Recommended: &lt; 60s</span>
            </div>
          </div>
        </div>

        {/* Evaluation Toggle Ribbon Tabs */}
        <div className="bg-slate-100/60 dark:bg-[#121214] p-1.5 border-b border-slate-150 dark:border-zinc-850 flex items-center justify-between sticky top-0 z-40 select-none">
          <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => setActiveSubTab("summary")}
              className={`px-3 py-1.8 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSubTab === "summary"
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-zinc-700"
                  : "text-slate-550 dark:text-zinc-450 hover:bg-slate-200/40 dark:hover:bg-zinc-900"
              }`}
            >
              📊 Performance Summary & Confidence Matrix
            </button>
            <button
              onClick={() => setActiveSubTab("mistakes")}
              className={`px-3 py-1.8 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activeSubTab === "mistakes"
                  ? "bg-rose-500/10 border border-rose-200/40 text-red-600 dark:text-rose-400 shadow-xs"
                  : "text-slate-550 dark:text-zinc-450 hover:bg-rose-500/5"
              }`}
            >
              ❌ Mistakes Gym ({wrongQuestions.length})
            </button>
            <button
              onClick={() => setActiveSubTab("skipped")}
              className={`px-3 py-1.8 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activeSubTab === "skipped"
                  ? "bg-amber-500/10 border border-amber-200/40 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-550 dark:text-zinc-450 hover:bg-amber-500/5"
              }`}
            >
              ❓ Skipped Qs ({skippedQuestions.length})
            </button>
            <button
              onClick={() => setActiveSubTab("all")}
              className={`px-3 py-1.8 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                activeSubTab === "all"
                  ? "bg-indigo-500/10 border border-indigo-200/40 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-550 dark:text-zinc-450 hover:bg-indigo-500/5"
              }`}
            >
              📖 All Qs ({totalQs})
            </button>
          </div>
        </div>

        {/* Conditional Sub-Tab Workspace */}
        <div className="flex-1 p-4 space-y-4">
          {activeSubTab === "summary" ? (
            <div className="space-y-4 animate-slide-up">
              {/* NEET Percentile Insights */}
              <div className="p-4 bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <span className="font-extrabold text-sm text-slate-800 dark:text-zinc-200">
                    Symptom Performance Diagnostics
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-slate-100 dark:border-zinc-850">
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                      Diagnose Bracket
                    </span>
                    <span className={`text-[9.5px] font-black px-2 py-0.5 rounded ${
                      percentage >= 80 ? "bg-emerald-500/10 text-emerald-500" :
                      percentage >= 60 ? "bg-indigo-500/10 text-indigo-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      {percentage >= 80 ? "PRESTIGIOUS RANKING" : percentage >= 60 ? "HIGH COMPETENCY" : "CLINICAL REMEDIAL TRAINING RECOMMENDED"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-zinc-350 leading-relaxed font-medium">
                    {percentage >= 80
                      ? "Outstanding speed and conceptual accuracy! Perfect execution, maintaining exam mistakes below 20%. Strongly recommend taking full-syllabus physical length simulations to reinforce endurance limits."
                      : percentage >= 60
                      ? "Competitive standing. Excellent grasp on key modules, but dropping marks due to minor negative penalties or guess errors. Review option reasoning and confidence calibration matrix below to stop leaking points."
                      : "We recommend reviewing basic high-yield concept summaries of NCERT text pages for the topics missed. Retest this paper blank in Study Mode to stabilize active recall deduction."}
                  </p>
                </div>

                {/* Score visualizer horizontal bar */}
                <div className="space-y-1.5 select-none pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-550 dark:text-zinc-400 font-bold">
                    <span>Performance Target Index</span>
                    <span className="font-extrabold">{percentage}% Match Score</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800 flex">
                    <div className="h-full bg-emerald-550 rounded-l-full" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} />
                    <div className="h-full bg-rose-500/80" style={{ width: `${Math.max(0, Math.min(100, 100 - percentage))}%` }} />
                  </div>
                </div>
              </div>

              {/* Confidence vs. Reality Calibration Matrix - BRAND NEW METRIC PANEL */}
              <div className="p-4 bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 rounded-2xl space-y-3.5 shadow-xs">
                <span className="text-[10px] font-black tracking-widest text-indigo-500 uppercase flex items-center gap-1 font-mono">
                  ✨ Mental Calibration Matrix (Confidence vs. Fact)
                </span>
                <p className="text-[11px] text-slate-400 dark:text-zinc-450 leading-relaxed">
                  NEET ranks are lost on <strong>Overconfidence</strong> and <strong>Hesitation</strong>. This calibrator compares your marked confidence tags against actual question outcome parameters to trace cognitive biases:
                </p>

                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
                  {/* Calibrator 1: Sure */}
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-black tracking-tight text-slate-700 dark:text-zinc-200 block">
                        🎯 marked "SURE"
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Your absolute conviction. Mistaking here implies blindspots.
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px] font-extrabold font-mono">
                      <span className="text-emerald-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number] || "sure";
                          return conf === "sure" && item.answers[q.number] === q.correctOptionIndex;
                        }).length} Correct
                      </span>
                      <span className="text-rose-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number] || "sure";
                          return conf === "sure" && item.answers[q.number] !== undefined && item.answers[q.number] !== q.correctOptionIndex;
                        }).length} Wrong
                      </span>
                    </div>
                  </div>

                  {/* Calibrator 2: Doubt */}
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-black tracking-tight text-slate-700 dark:text-zinc-200 block">
                        🧐 marked "DOUBT"
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Felt hesitant. Getting these wrong indicates weak roots.
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px] font-extrabold font-mono">
                      <span className="text-emerald-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number];
                          return conf === "doubt" && item.answers[q.number] === q.correctOptionIndex;
                        }).length} Correct
                      </span>
                      <span className="text-rose-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number];
                          return conf === "doubt" && item.answers[q.number] !== undefined && item.answers[q.number] !== q.correctOptionIndex;
                        }).length} Wrong
                      </span>
                    </div>
                  </div>

                  {/* Calibrator 3: Guess */}
                  <div className="p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] font-black tracking-tight text-slate-700 dark:text-zinc-200 block">
                        🎲 marked "GUESS"
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Instinctive guess. Correct entries are purely random luck.
                      </p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px] font-extrabold font-mono">
                      <span className="text-emerald-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number];
                          return conf === "guess" && item.answers[q.number] === q.correctOptionIndex;
                        }).length} Correct
                      </span>
                      <span className="text-rose-500">
                        {item.questions.filter(q => {
                          const conf = item.confidences?.[q.number];
                          return conf === "guess" && item.answers[q.number] !== undefined && item.answers[q.number] !== q.correctOptionIndex;
                        }).length} Wrong
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject wise analysis breakdown list */}
              <div className="space-y-2.5">
                <h4 className="text-[11px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-wider font-mono px-1">
                  NCERT Core Subject Performance Breakdown
                </h4>

                <div className="space-y-2">
                  {subjectBreakdown.map((row) => (
                    <div
                      key={row.subject}
                      className="p-3.5 bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 rounded-2xl flex flex-col gap-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800 dark:text-zinc-100">
                          {row.subject}
                        </span>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 font-extrabold px-2 py-0.5 rounded-lg border border-indigo-100/50 dark:border-indigo-900/20">
                          Net score: {row.score > 0 ? `+${row.score}` : row.score} pts
                        </span>
                      </div>

                      {/* Bar metrics */}
                      <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] text-slate-450 font-bold select-none py-1">
                        <div className="bg-emerald-500/5 border border-emerald-150/40 py-1.5 rounded-xl dark:border-emerald-900/10">
                          <span className="text-emerald-500 dark:text-emerald-400 block font-black">{row.correct}</span>
                          Correct
                        </div>
                        <div className="bg-red-500/5 border border-red-155/40 py-1.5 rounded-xl dark:border-rose-900/10">
                          <span className="text-red-500 dark:text-rose-450 block font-black">{row.incorrect}</span>
                          Wrong
                        </div>
                        <div className="bg-slate-50 py-1.5 rounded-xl dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-400 block font-black">{row.blank}</span>
                          Blank
                        </div>
                        <div className="bg-indigo-500/5 border border-indigo-150/30 py-1.5 rounded-xl dark:border-indigo-900/10">
                          <span className="text-indigo-650 dark:text-indigo-400 block font-black">{row.accuracy}%</span>
                          Accuracy
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Questions List View (Mistakes, Skipped or All) */
            <div className="space-y-3.5 animate-slide-up">
              {/* Question list bar controllers */}
              <div className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 p-2.5 rounded-2xl flex flex-col sm:flex-row gap-2 select-none">
                {/* Subject drop filter */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Filter className="w-3.8 h-3.8 text-indigo-500 shrink-0" />
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-zinc-200 outline-none w-full w-max font-bold cursor-pointer"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s} className="dark:bg-zinc-900">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub search inside questions */}
                <div className="relative flex items-center bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-2 py-1 rounded-xl flex-1 focus-within:border-indigo-500/40 transition-colors">
                  <Search className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search terms, solutions or numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-zinc-200 outline-none w-full placeholder-slate-400 font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-[10px] text-slate-400 hover:text-slate-650 font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Sequence Shelf */}
              <div className="space-y-3 min-h-[30vh]">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-10 bg-white dark:bg-[#121214] border border-dashed border-slate-150 dark:border-zinc-850 p-6 rounded-3xl select-none">
                    <BookMarked className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-700 dark:text-zinc-300 font-extrabold">No Questions Matching Criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try altering your filters to study other question series.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q) => {
                    const selectedIdx = item.answers[q.number];
                    const isCorrect = selectedIdx === q.correctOptionIndex;
                    const isSkipped = selectedIdx === undefined;

                    return (
                      <div
                        key={q.number}
                        id={`q-card-review-${q.number}`}
                        className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl flex flex-col gap-3 shadow-xs transition-colors relative ${
                          isCorrect
                            ? "border-emerald-100 dark:border-emerald-950/20"
                            : isSkipped
                            ? "border-amber-100 dark:border-amber-950/20"
                            : "border-red-100 dark:border-red-955/20"
                        }`}
                      >
                        {/* Subject + Number Header */}
                        <div className="flex items-center justify-between pointer-events-none select-none">
                          <span className="font-black text-xs text-indigo-505 dark:text-indigo-400 flex items-center gap-1">
                            Q. {q.number}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                              {q.subject}
                            </span>
                            <span className={`text-[9px] font-black px-1.8 py-0.5 rounded ${
                              isCorrect ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                              isSkipped ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                              "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}>
                              {isCorrect ? "CORRECT (+4)" : isSkipped ? "UNATTEMPTED" : "WRONG (-1)"}
                            </span>
                          </div>
                        </div>

                        {/* Question core text */}
                        <p className="text-xs font-extrabold text-slate-805 dark:text-zinc-100 leading-relaxed font-sans">
                          {q.questionText}
                        </p>

                        {/* Options selection stack */}
                        <div className="space-y-2 select-none">
                          {q.options.map((opt, optIndex) => {
                            const isUserSelection = selectedIdx === optIndex;
                            const isCorrectAns = q.correctOptionIndex === optIndex;

                            let optionClasses = "bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850";
                            let iconElement = null;

                            if (isCorrectAns) {
                              optionClasses = "bg-emerald-500/8 border border-emerald-200/40 text-emerald-800 dark:text-emerald-400 font-bold";
                              iconElement = <CheckCircle className="w-3.8 h-3.8 text-emerald-500 shrink-0" />;
                            } else if (isUserSelection) {
                              optionClasses = "bg-rose-500/8 border border-red-200/40 text-red-800 dark:text-red-400 font-bold line-through";
                              iconElement = <XCircle className="w-3.8 h-3.8 text-red-500 shrink-0" />;
                            }

                            return (
                              <div
                                key={optIndex}
                                className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 border leading-normal transition-colors ${optionClasses}`}
                              >
                                <span>{opt}</span>
                                {iconElement}
                              </div>
                            );
                          })}
                        </div>

                        {/* Solutions summary blueprint */}
                        {q.solution && (
                          <div className="p-3 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/40 dark:border-indigo-900/20 mt-1 select-text">
                            <span className="text-[9px] text-indigo-500 font-black tracking-widest uppercase font-mono block mb-1 flex items-center gap-1 select-none">
                              <Brain className="w-3 h-3 text-indigo-500" /> Solution Blueprint Explanation
                            </span>
                            <p className="text-[11px] text-slate-550 dark:text-zinc-300 leading-normal whitespace-pre-wrap font-medium">
                              {q.solution}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
