import React, { useState, useMemo } from "react";
import {
  Dumbbell,
  BookOpen,
  Bookmark,
  Flag,
  CheckCircle,
  XCircle,
  Info,
  PenSquare,
  Sparkles,
  RefreshCw,
  Trophy,
  ChevronDown,
  ChevronUp,
  Brain
} from "lucide-react";
import { Test, TestProgress, Question } from "../types";

interface MistakeGymProps {
  tests: Test[];
  progress: Record<string, TestProgress>;
  onUpdateProgress: (testId: string, partial: Partial<TestProgress>) => void;
  onSelectTest: (testId: string, activeQuestionNumber: number) => void;
}

interface GymTarget {
  testId: string;
  testTitle: string;
  question: Question;
  userAnswerIndex: number | undefined;
  isBookmarked: boolean;
  isFlagged: boolean;
  isIncorrect: boolean;
  confidence?: string;
  note?: string;
}

export default function MistakeGym({
  tests,
  progress,
  onUpdateProgress,
  onSelectTest,
}: MistakeGymProps) {
  const [filterType, setFilterType] = useState<"all" | "incorrect" | "saved" | "sure_wrong">("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);
  
  // State for active re-attempts inside the Mistake Gym
  // Key format: `${testId}_${qNumber}` -> optionIndex
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState<Record<string, boolean>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  // 1. Gather all questions that qualify as mistakes or saves across all workbooks
  const gymTargets = useMemo(() => {
    const targets: GymTarget[] = [];

    tests.forEach((test) => {
      const prog = progress[test.id];
      if (!prog) return;

      test.questions.forEach((q) => {
        const userAns = prog.answers[q.number];
        const isBookmarked = (prog.bookmarked || []).includes(q.number);
        const isFlagged = (prog.flagged || []).includes(q.number);
        
        const isIncorrect = userAns !== undefined && userAns !== q.correctOptionIndex;
        const confidence = prog.confidences?.[q.number];
        const note = prog.userNotes?.[q.number];

        const qualifies = isIncorrect || isBookmarked || isFlagged;

        if (qualifies) {
          targets.push({
            testId: test.id,
            testTitle: test.title,
            question: q,
            userAnswerIndex: userAns,
            isBookmarked,
            isFlagged,
            isIncorrect,
            confidence,
            note,
          });
        }
      });
    });

    return targets;
  }, [tests, progress]);

  // Extract unique subjects for the filter dropdown
  const subjects = useMemo(() => {
    const set = new Set<string>();
    gymTargets.forEach((t) => {
      if (t.question.subject) {
        set.add(t.question.subject);
      }
    });
    return Array.from(set);
  }, [gymTargets]);

  // 2. Filter targets based on user criteria
  const filteredTargets = useMemo(() => {
    return gymTargets.filter((t) => {
      // Type filtering
      if (filterType === "incorrect" && !t.isIncorrect) return false;
      if (filterType === "saved" && !t.isBookmarked && !t.isFlagged) return false;
      if (filterType === "sure_wrong" && !(t.isIncorrect && t.confidence === "sure")) return false;

      // Subject filtering
      if (selectedSubject !== "all" && t.question.subject !== selectedSubject) return false;

      return true;
    });
  }, [gymTargets, filterType, selectedSubject]);

  // 3. Handlers
  const handleToggleBookmarkInGym = (target: GymTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    const prog = progress[target.testId];
    if (!prog) return;

    let updatedBookmarks = [...(prog.bookmarked || [])];
    if (target.isBookmarked) {
      updatedBookmarks = updatedBookmarks.filter((n) => n !== target.question.number);
    } else {
      updatedBookmarks.push(target.question.number);
    }

    onUpdateProgress(target.testId, { bookmarked: updatedBookmarks });
  };

  const handleToggleFlagInGym = (target: GymTarget, e: React.MouseEvent) => {
    e.stopPropagation();
    const prog = progress[target.testId];
    if (!prog) return;

    let updatedFlagged = [...(prog.flagged || [])];
    if (target.isFlagged) {
      updatedFlagged = updatedFlagged.filter((n) => n !== target.question.number);
    } else {
      updatedFlagged.push(target.question.number);
    }

    onUpdateProgress(target.testId, { flagged: updatedFlagged });
  };

  // Submit notes from mistake gym directly
  const handleSaveNote = (testId: string, qNumber: number) => {
    const qKey = `${testId}_${qNumber}`;
    const text = noteInputs[qKey]?.trim();
    if (text === undefined) return;

    const prog = progress[testId];
    const notesCopy = { ...(prog?.userNotes || {}) };
    if (text) {
      notesCopy[qNumber] = text;
    } else {
      delete notesCopy[qNumber];
    }

    onUpdateProgress(testId, { userNotes: notesCopy });
    // Keep a notification status or clear input focus
  };

  // Perform interactive attempt inside Gym view
  const handleGymAttempt = (testId: string, qNumber: number, optionIdx: number) => {
    const key = `${testId}_${qNumber}`;
    setAttempts((prev) => ({ ...prev, [key]: optionIdx }));
    setShowExplanation((prev) => ({ ...prev, [key]: true }));
  };

  // Claim Mastery: replace the saved answer with the correct index AND remove bookmark/flag to clear it
  const handleMasteryClimb = (target: GymTarget) => {
    const { testId, question } = target;
    const prog = progress[testId];
    if (!prog) return;

    // Update answers to be correct option!
    const answersCopy = { ...(prog.answers || {}) };
    answersCopy[question.number] = question.correctOptionIndex;

    // Remove bookmarked and flagged
    const updatedBookmarked = (prog.bookmarked || []).filter((n) => n !== question.number);
    const updatedFlagged = (prog.flagged || []).filter((n) => n !== question.number);

    onUpdateProgress(testId, {
      answers: answersCopy,
      bookmarked: updatedBookmarked,
      flagged: updatedFlagged,
    });

    // Clear local state
    const key = `${testId}_${question.number}`;
    setAttempts((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    setExpandedTargetId(null);
  };

  return (
    <div id="gym-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* Header Panel */}
      <header id="gym-header" className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold tracking-widest text-[#ef4444] uppercase flex items-center gap-1.5 animate-pulse">
            <Dumbbell className="w-3.5 h-3.5" /> High-Intensity Practice
          </span>
          <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
            Mistake Gym
          </h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
          💪
        </div>
      </header>

      {/* Gym Stats Banner */}
      <div id="gym-dashboard-stats" className="bg-gradient-to-br from-red-650/10 via-red-900/5 to-transparent dark:from-red-950/20 border border-red-500/20 rounded-2xl p-3.5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-red-500/80 dark:text-red-400 font-mono tracking-wider">Troubled Focus Targets</span>
          <p className="text-sm text-slate-700 dark:text-zinc-300 leading-normal">
            You currently have <strong className="text-red-500 font-extrabold">{gymTargets.length}</strong> active problems to master.
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-white dark:bg-[#121214] border border-red-500/30 flex items-center justify-center shadow-xs">
          <Trophy className="w-5 h-5 text-amber-500" />
        </div>
      </div>

      {/* Control Filters Area */}
      <div id="gym-filters" className="space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1 select-none no-scrollbar">
          {[
            { key: "all", label: "🏋️ All ({n})" },
            { key: "incorrect", label: "❌ Incorrect ({n})" },
            { key: "saved", label: "🔖 Saved ({n})" },
            { key: "sure_wrong", label: "🧠 Overconfident ({n})" },
          ].map((tab) => {
            let count = 0;
            if (tab.key === "all") count = gymTargets.length;
            else if (tab.key === "incorrect") count = gymTargets.filter(t => t.isIncorrect).length;
            else if (tab.key === "saved") count = gymTargets.filter(t => t.isBookmarked || t.isFlagged).length;
            else if (tab.key === "sure_wrong") count = gymTargets.filter(t => t.isIncorrect && t.confidence === "sure").length;

            const isSelected = filterType === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as any)}
                className={`py-1.5 px-3 rounded-full text-[10px] font-extrabold whitespace-nowrap border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-[#ef4444] text-white border-[#ef4444] shadow-xs scale-102"
                    : "bg-white dark:bg-[#121214] border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
                }`}
              >
                {tab.label.replace("{n}", String(count))}
              </button>
            );
          })}
        </div>

        {/* Subject Filter Selector */}
        {subjects.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-[#121214] p-2 rounded-xl border border-slate-150 dark:border-zinc-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">Filter Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs text-slate-700 dark:text-zinc-200 focus:outline-none outline-none font-bold cursor-pointer"
            >
              <option value="all" className="dark:bg-zinc-900">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub} className="dark:bg-zinc-900">{sub}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Target Workout List */}
      <div id="target-workout-shelf" className="flex-1 space-y-3">
        {filteredTargets.length === 0 ? (
          <div id="clean-sheet-card" className="flex flex-col items-center justify-center py-12 px-6 bg-white dark:bg-[#121214] rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800 transition-colors text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-500">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-black text-slate-800 dark:text-zinc-200">
              Gym Workspace Cleared!
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-[240px] leading-normal">
              No matching mistakes or saves. Practice study chapters to find concepts you need to harden.
            </p>
          </div>
        ) : (
          filteredTargets.map((target) => {
            const qKey = `${target.testId}_${target.question.number}`;
            const isExpanded = expandedTargetId === qKey;
            const currentAttempt = attempts[qKey];
            const hasAttempted = currentAttempt !== undefined;
            const showExp = showExplanation[qKey] || false;

            // Highlight tag styles based on status
            return (
              <div
                key={qKey}
                id={`gym-card-${qKey}`}
                className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl transition-all flex flex-col relative group ${
                  isExpanded
                    ? "border-red-500/40 ring-1 ring-red-500/20 shadow-md"
                    : "border-slate-100 dark:border-zinc-800/80 hover:border-red-100 dark:hover:border-red-950/20"
                }`}
              >
                {/* Collapsed Top Header Block */}
                <div
                  onClick={() => setExpandedTargetId(isExpanded ? null : qKey)}
                  className="cursor-pointer flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 capitalize max-w-[120px] truncate">
                        {target.testTitle}
                      </span>
                      {target.question.subject && (
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">
                          {target.question.subject}
                        </span>
                      )}
                      {target.isIncorrect && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-red-400/10 text-red-500">
                          Incorrect
                        </span>
                      )}
                      {target.confidence && (
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                          target.confidence === "sure"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : target.confidence === "guess"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        }`}>
                          🧠 {target.confidence.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleToggleBookmarkInGym(target, e)}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          target.isBookmarked
                            ? "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                        title="Bookmark status"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={(e) => handleToggleFlagInGym(target, e)}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          target.isFlagged
                            ? "text-[#ef4444] bg-red-50 dark:bg-red-950/20"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                        title="Flagged review status"
                      >
                        <Flag className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Question Text Sneak-Peek */}
                  <div className="flex items-start justify-between">
                    <p className={`text-xs font-bold text-slate-800 dark:text-zinc-100 flex-1 leading-snug ${isExpanded ? "" : "line-clamp-2"}`}>
                      Q.{target.question.number}: {target.question.questionText}
                    </p>
                    <div className="text-slate-400 shrink-0 ml-2 mt-0.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Workspace Drill */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-3.5">
                    
                    {/* Active Option Re-attempt list */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">👉 TRY A NEW WORKOUT ATTEMPT:</span>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                        {target.question.options.map((opt, idx) => {
                          const isCorrectSymbol = idx === target.question.correctOptionIndex;
                          const wasOriginalWrong = target.userAnswerIndex === idx && idx !== target.question.correctOptionIndex;
                          
                          let optStyle = "border-slate-150 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900";
                          
                          if (hasAttempted) {
                            if (idx === currentAttempt) {
                              optStyle = isCorrectSymbol 
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/10"
                                : "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/10";
                            } else if (isCorrectSymbol) {
                              optStyle = "border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";
                            }
                          } else if (wasOriginalWrong) {
                            optStyle = "border-red-500/50 bg-red-500/5 text-red-500/80 line-through opacity-80";
                          }

                          return (
                            <button
                              key={idx}
                              disabled={hasAttempted}
                              onClick={() => handleGymAttempt(target.testId, target.question.number, idx)}
                              className={`p-3 rounded-xl text-left text-xs leading-relaxed border transition-all flex items-start gap-2 ${optStyle} ${!hasAttempted ? "cursor-pointer" : ""}`}
                            >
                              <span className="w-4.5 h-4.5 rounded-md bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] shrink-0 text-slate-500">
                                {idx + 1}
                              </span>
                              <span className="flex-1">{opt}</span>
                              {hasAttempted && idx === currentAttempt && (
                                isCorrectSymbol ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Solutions and Explanations Block */}
                    {showExp && (
                      <div className="bg-slate-50/70 dark:bg-zinc-900/70 p-3 rounded-xl border border-slate-150 dark:border-zinc-800 space-y-1.5 animate-slide-up duration-150">
                        <span className="text-[10px] text-indigo-500 font-extrabold uppercase block font-mono">🩺 SOLUTION & ANALYTICS:</span>
                        <p className="text-xs text-slate-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                          {target.question.solution || "No detailed analytical walkthrough documented."}
                        </p>
                        
                        {/* Mastered / Clear from Gym prompt if answered correctly in re-attempt! */}
                        {hasAttempted && currentAttempt === target.question.correctOptionIndex && (
                          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-4.5 h-4.5 animate-bounce" /> Correct Concept Unlocked!
                            </span>
                            <button
                              onClick={() => handleMasteryClimb(target)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1 cursor-pointer transition-transform duration-100 hover:scale-105"
                            >
                              Claim Mastery & Archive Q
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Custom Note-taking specifically targeting mistakes */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold uppercase">
                        <span>📝 Personal Study Notes:</span>
                        {noteInputs[qKey] !== undefined && noteInputs[qKey].trim() !== (target.note || "") && (
                          <button
                            onClick={() => handleSaveNote(target.testId, target.question.number)}
                            className="text-xs text-indigo-400 font-bold lowercase bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer"
                          >
                            Save Note
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <textarea
                          placeholder="Write key equations, keywords, or memory hacks regarding this mistake..."
                          value={noteInputs[qKey] !== undefined ? noteInputs[qKey] : (target.note || "")}
                          onChange={(e) => setNoteInputs({ ...noteInputs, [qKey]: e.target.value })}
                          className="flex-1 min-h-[50px] p-2 bg-transparent dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800/85 text-xs text-slate-700 dark:text-zinc-200 rounded-xl outline-none focus:border-indigo-400/50"
                        />
                      </div>
                    </div>

                    {/* Launch original Workspace view to practice rest of paper */}
                    <div className="flex gap-2.5">
                      <button
                        onClick={() => onSelectTest(target.testId, target.question.number)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Launch Original Workbook Workspace</span>
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
