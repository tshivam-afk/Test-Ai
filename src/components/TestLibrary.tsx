import { useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Search,
  FileText,
  Clock,
  ArrowRight,
  Trash2,
  BookOpen,
  Sparkles,
  Award,
  Pencil,
  Check,
  X,
  ClipboardList
} from "lucide-react";
import { Test, TestProgress } from "../types";

interface TestLibraryProps {
  tests: Test[];
  progress: Record<string, TestProgress>;
  onSelectTest: (testId: string) => void;
  onDeleteTest: (testId: string) => void;
  onOpenUpload: () => void;
  quote?: { text: string; author: string };
  onRenameTest?: (testId: string, newTitle: string) => void;
  remainingPlannerTasksCount?: number;
  setActiveTab?: (tab: any) => void;
}

export default function TestLibrary({
  tests,
  progress,
  onSelectTest,
  onDeleteTest,
  onOpenUpload,
  quote,
  onRenameTest,
  remainingPlannerTasksCount = 0,
  setActiveTab,
}: TestLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState("");

  const filteredTests = tests.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate high level student achievements
  const totalTestsCount = tests.length;
  const totalTimeSeconds = Object.values(progress).reduce(
    (sum, cur) => sum + (cur.timeSpent || 0),
    0
  );
  const totalQuestionsAnswered = Object.values(progress).reduce(
    (sum, cur) => sum + Object.keys(cur.answers || {}).length,
    0
  );

  const formatHours = (seconds: number) => {
    if (seconds <= 0) return "0m";
    const mins = Math.ceil(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  };

  return (
    <div id="library-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
      {/* Title greeting bar */}
      <header id="library-header" className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
            Workbook Desk
          </span>
          <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
            Study Companion
          </h2>
        </div>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white dark:bg-indigo-600 dark:text-zinc-100 flex items-center justify-center font-bold text-xs shadow-md select-none shrink-0 font-sans">
          NEET
        </div>
      </header>

      {/* Inspirational Quote Card */}
      {quote && (
        <div id="motivational-quote-card" className="bg-gradient-to-r from-indigo-50/50 to-indigo-100/20 dark:from-indigo-950/20 dark:to-zinc-900/10 border border-indigo-100/50 dark:border-indigo-950/40 rounded-2xl p-4 mb-4 select-none relative overflow-hidden shrink-0 animate-fade-in">
          <div className="absolute right-3 bottom-0.5 text-indigo-500/10 dark:text-indigo-400/5 pointer-events-none">
            <Sparkles className="w-16 h-16 stroke-[1.2]" />
          </div>
          <p className="text-[12px] italic font-semibold text-slate-800 dark:text-zinc-100 leading-relaxed font-sans pr-8">
            "{quote.text}"
          </p>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold tracking-wide block mt-1.5 text-right">
            — {quote.author}
          </span>
        </div>
      )}

      {/* Stats Summary Bento grid */}
      <div id="stats-bento" className="grid grid-cols-3 gap-2.5 mb-5 select-none shrink-0">
        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between shadow-xs">
          <BookOpen className="w-5 h-5 text-indigo-500 mb-2" />
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium block mb-0.5">
              Workbooks
            </span>
            <span className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 leading-none">
              {totalTestsCount}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between shadow-xs">
          <Clock className="w-5 h-5 text-emerald-500 mb-2 animate-pulse" />
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium block mb-0.5">
              Time Spent
            </span>
            <span className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 leading-none truncate block">
              {formatHours(totalTimeSeconds)}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 flex flex-col justify-between shadow-xs">
          <Award className="w-5 h-5 text-amber-500 mb-2" />
          <div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-medium block mb-0.5">
              Solved Qs
            </span>
            <span className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 leading-none">
              {totalQuestionsAnswered}
            </span>
          </div>
        </div>
      </div>

      {/* Daily Study Planner agenda quick widget (redefined for custom requirement) */}
      {remainingPlannerTasksCount > 0 && setActiveTab && (
        <div
          onClick={() => setActiveTab("planner")}
          className="mb-4 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-200/50 hover:border-amber-350 dark:border-amber-900/35 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all animate-slide-up select-none shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-550/15 flex items-center justify-center text-amber-505 shrink-0">
              <ClipboardList className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-zinc-100">
                You have {remainingPlannerTasksCount} target{remainingPlannerTasksCount > 1 ? "s" : ""} left on your daily planner!
              </p>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">Keep up your daily NEET disciplines to stay on target.</p>
            </div>
          </div>
          <div className="text-amber-500 dark:text-amber-400 shrink-0 flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider">
            <span>Planner Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Search and control bar */}
      <div id="search-bar" className="flex items-center gap-2 mb-4 shrink-0">
        <div className="flex-1 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-100 dark:border-zinc-800 p-2.5 flex items-center gap-2 shadow-xs focus-within:border-indigo-500/50 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            id="test-search-field"
            type="text"
            placeholder="Search workbooks, subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-slate-800 dark:text-zinc-200 placeholder-zinc-700 dark:placeholder-zinc-700 outline-none focus:outline-none"
          />
        </div>

        <button
          id="btn-trigger-upload"
          onClick={onOpenUpload}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-650/10 active:scale-95 transition-all duration-155 cursor-pointer"
          title="Import question set"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Worksheet List Section */}
      <div id="tests-list-container" className="flex-1 space-y-3">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 tracking-wider">
          PRACTICE WORKBOOKS
        </h3>

        {filteredTests.length === 0 ? (
          <div
            id="empty-library-state"
            className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-[#18181b] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 transition-colors text-center"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">
              No matching workbooks
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[240px]">
              Tap the plus button to analyze and study.
            </p>
          </div>
        ) : (
          filteredTests.map((test) => {
            const prog = progress[test.id];
            const answeredCount = prog ? Object.keys(prog.answers || {}).length : 0;
            const totalCount = test.questions.length;
            const isCompleted = prog?.completed || false;
            const progressPercent =
              totalCount > 0 ? Math.floor((answeredCount / totalCount) * 100) : 0;

            return (
              <div
                id={`test-card-${test.id}`}
                key={test.id}
                className="p-4 bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-800/80 rounded-2xl hover:shadow-md hover:border-zinc-700/50 dark:hover:border-zinc-700/50 transition-all flex flex-col relative group"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {totalCount} Questions
                      </span>
                      {test.isSample && (
                        <span className="text-[9px] font-extrabold tracking-wide px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> Sample Class Test
                        </span>
                      )}
                    </div>
                    {editingTestId === test.id ? (
                      <div className="flex items-center gap-1 mt-1 pr-2 w-full">
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editTitleText.trim() && onRenameTest) {
                                onRenameTest(test.id, editTitleText.trim());
                              }
                              setEditingTestId(null);
                            } else if (e.key === "Escape") {
                              setEditingTestId(null);
                            }
                          }}
                          className="flex-1 text-xs px-2.5 py-1.5 border border-indigo-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (editTitleText.trim() && onRenameTest) {
                              onRenameTest(test.id, editTitleText.trim());
                            }
                            setEditingTestId(null);
                          }}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTestId(null);
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-400 rounded-lg transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group/title w-full mt-1.5">
                        <h4 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTestId(test.id);
                            setEditTitleText(test.title);
                          }}
                          className="font-bold text-sm text-slate-900 dark:text-zinc-100 tracking-tight leading-snug flex-1 line-clamp-2 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                          title="Click to rename workbook"
                        >
                          {test.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTestId(test.id);
                            setEditTitleText(test.title);
                          }}
                          className="p-1.5 text-slate-450 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-all cursor-pointer inline-flex items-center shrink-0"
                          title="Rename workbook"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Delete Option (do not allow deleting default sample to keep fail-safe active) */}
                  {!test.isSample && (
                    <button
                      id={`delete-btn-${test.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Permanently archive this companion test?")) {
                          onDeleteTest(test.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      aria-label="Delete test paper"
                    >
                      <Trash2 className="w-3.8 h-3.8" />
                    </button>
                  )}
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-500 mb-2 mt-auto">
                  <span>
                    {isCompleted
                      ? "Test Reviewed"
                      : answeredCount > 0
                      ? `In Progress (${answeredCount}/${totalCount})`
                      : "Unstarted"}
                  </span>
                  <span className="font-bold">{progressPercent}%</span>
                </div>

                {/* Simulated dynamic progress bar width */}
                <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCompleted ? "bg-emerald-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Launch / Practice Resume Actions */}
                <button
                  id={`launch-test-${test.id}`}
                  onClick={() => onSelectTest(test.id)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-slate-800 dark:text-zinc-150 flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-200/40 dark:border-zinc-800"
                >
                  {answeredCount > 0 && !isCompleted ? "Resume Practice Session" : "Start Study Session"}
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
