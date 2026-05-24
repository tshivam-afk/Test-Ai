import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Flag,
  Star,
  Check,
  X,
  Clock,
  Menu,
  Award,
  PenSquare,
  RotateCcw,
  BookMarked,
  Sparkles,
  Play,
  Pause,
  ArrowLeft,
  Info
} from "lucide-react";
import { Question, Test, TestProgress } from "../types";

interface QuizViewProps {
  test: Test;
  progress: TestProgress | undefined;
  practiceMode: "study" | "exam";
  onChangeMode: (mode: "study" | "exam") => void;
  onUpdateProgress: (updatedProg: Partial<TestProgress>) => void;
  onBackToLibrary: () => void;
  onSubmitExamSuccess?: (
    score: {
      correctCount: number;
      incorrectCount: number;
      blankCount: number;
      finalScore: number;
    },
    answers: Record<number, number>,
    confidences?: Record<number, string>
  ) => void;
}

export default function QuizView({
  test,
  progress,
  practiceMode,
  onChangeMode,
  onUpdateProgress,
  onBackToLibrary,
  onSubmitExamSuccess,
}: QuizViewProps) {
  // Ensure we safely load or initialize default student progress matching structure
  const answers = progress?.answers || {};
  const flagged = progress?.flagged || [];
  const bookmarked = progress?.bookmarked || [];
  const userNotes = progress?.userNotes || {};
  const confidences = progress?.confidences || {};
  const isCompleted = progress?.completed || false;
  const timeSpent = progress?.timeSpent || 0;
  const currentIdx = progress?.lastActiveQuestionNumber 
    ? test.questions.findIndex((q) => q.number === progress.lastActiveQuestionNumber) 
    : 0;

  const initialAnsweredCount = Object.keys(answers).length;
  // If no mode is saved but progress exists, fallback safely to prevent blocking
  const resolvedMode: "study" | "exam" | undefined = progress?.mode || (initialAnsweredCount > 0 ? "study" : undefined);

  const activeIdx = currentIdx >= 0 ? currentIdx : 0;
  const currentQuestion: Question = test.questions[activeIdx] || test.questions[0];

  const [omrOpen, setOmrOpen] = useState(false);
  const [scratchPadOpen, setScratchPadOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(true);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("sm");
  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [omrFilter, setOmrFilter] = useState<"all" | "review" | "answered" | "blank">("all");

  // 1. Local Time State & Synchronized auto-save mechanics to block render-loops
  const [localTimeSpent, setLocalTimeSpent] = useState(timeSpent || 0);
  const localTimeRef = useRef(localTimeSpent);

  useEffect(() => {
    localTimeRef.current = localTimeSpent;
  }, [localTimeSpent]);

  // Sync state if different test or props reload cleanly
  useEffect(() => {
    setLocalTimeSpent(timeSpent || 0);
  }, [test.id, timeSpent]);

  // Unified safe progress saver that guarantees timeSpent tracking
  const saveProgress = (partial: Partial<TestProgress>) => {
    onUpdateProgress({
      ...partial,
      timeSpent: localTimeRef.current,
    });
  };

  const handleLeaveQuiz = () => {
    onUpdateProgress({ timeSpent: localTimeRef.current });
    onBackToLibrary();
  };

  // NEET scoring scheme multipliers (+4, -1)
  const NEET_CORRECT_SCORE = 4;
  const NEET_INCORRECT_SCORE = -1;

  // Real-time ticking time spent increment running entirely locally without triggering App re-renders
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (timerActive && !isCompleted) {
      intervalId = setInterval(() => {
        setLocalTimeSpent((prev) => prev + 1);
        setQuestionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerActive, isCompleted]);

  // Question-wise timer resetting on question change
  useEffect(() => {
    setQuestionSeconds(0);
  }, [currentQuestion.number]);

  // Background silent periodic sync to parent state (every 5 seconds)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (timerActive && !isCompleted) {
        onUpdateProgress({ timeSpent: localTimeRef.current });
      }
    }, 5000);
    return () => clearInterval(syncInterval);
  }, [timerActive, isCompleted, onUpdateProgress]);

  // Handle paginate actions
  const handleJumpToQuestion = (qNumber: number) => {
    saveProgress({ lastActiveQuestionNumber: qNumber });
    setOmrOpen(false);
  };

  const handleNext = () => {
    if (activeIdx < test.questions.length - 1) {
      const nextQ = test.questions[activeIdx + 1];
      saveProgress({ lastActiveQuestionNumber: nextQ.number });
    }
  };

  const handlePrev = () => {
    if (activeIdx > 0) {
      const prevQ = test.questions[activeIdx - 1];
      saveProgress({ lastActiveQuestionNumber: prevQ.number });
    }
  };

  // Toggle flag reviews
  const handleToggleFlag = (qNum: number) => {
    const isFlagged = flagged.includes(qNum);
    const updatedFlagged = isFlagged
      ? flagged.filter((n) => n !== qNum)
      : [...flagged, qNum];
    saveProgress({ flagged: updatedFlagged });
  };

  // Toggle stars
  const handleToggleBookmark = (qNum: number) => {
    const isBookmarked = bookmarked.includes(qNum);
    const updatedBookmarked = isBookmarked
      ? bookmarked.filter((n) => n !== qNum)
      : [...bookmarked, qNum];
    saveProgress({ bookmarked: updatedBookmarked });
  };

  // Option selection
  const handleSelectOption = (optionIdx: number) => {
    if (isCompleted) return; // Locked on complete

    // Lock answers in study mode to prevent retroactive changes
    if (resolvedMode === "study" && answers[currentQuestion.number] !== undefined) {
      return;
    }

    const updatedAnswers = { ...answers, [currentQuestion.number]: optionIdx };
    
    // Automatically default confidence level to "sure" representing "confident" (custom request)
    const updatedConfidences = { ...confidences };
    if (!updatedConfidences[currentQuestion.number]) {
      updatedConfidences[currentQuestion.number] = "sure";
    }

    saveProgress({ 
      answers: updatedAnswers,
      confidences: updatedConfidences
    });
  };

  // Select confidence level
  const handleSelectConfidence = (level: string) => {
    const updatedConfidences = { ...confidences, [currentQuestion.number]: level };
    saveProgress({ confidences: updatedConfidences });
  };

  // Draft pad notes update
  const handleNotesChange = (text: string) => {
    const updatedNotes = { ...userNotes, [currentQuestion.number]: text };
    saveProgress({ userNotes: updatedNotes });
  };

  // Clean wipe to retry test
  const handleResetTestSession = () => {
    if (confirm("Reset test progress, reset metrics and restart this paper?")) {
      setLocalTimeSpent(0);
      setQuestionSeconds(0);
      localTimeRef.current = 0;
      onUpdateProgress({
        answers: {},
        flagged: [],
        bookmarked: [],
        userNotes: {},
        confidences: {},
        completed: false,
        score: undefined,
        timeSpent: 0,
        lastActiveQuestionNumber: test.questions[0]?.number || 1,
      });
      setTimerActive(true);
    }
  };

  // Final evaluation for NEET OMR submission
  const handleSubmitTest = () => {
    if (confirm("Analyze progress and submit OMR answers now?")) {
      let correct = 0;
      let incorrect = 0;
      let blank = 0;

      test.questions.forEach((q) => {
        const selected = answers[q.number];
        if (selected === undefined) {
          blank++;
        } else if (selected === q.correctOptionIndex) {
          correct++;
        } else {
          incorrect++;
        }
      });

      const finalScore = correct * NEET_CORRECT_SCORE + incorrect * NEET_INCORRECT_SCORE;
      const computedScore = {
        correctCount: correct,
        incorrectCount: incorrect,
        blankCount: blank,
        finalScore: finalScore,
      };

      onUpdateProgress({
        completed: true,
        timeSpent: localTimeRef.current,
        score: computedScore,
      });
      setTimerActive(false);

      if (onSubmitExamSuccess && resolvedMode === "exam") {
        onSubmitExamSuccess(computedScore, answers, confidences);
      }
    }
  };

  const formatTimer = (sec: number) => {
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = test.questions.length;
  const progressPercent = Math.floor((answeredCount / totalCount) * 100);

  // Filter categories to navigate subjects
  const groupedSubjects = Array.from(new Set(test.questions.map((q) => q.subject)));

  return (
    <div id="quiz-screen-root" className="flex-1 flex flex-col overflow-hidden relative select-none">
      {/* Quiz Top Action navigation bar */}
      <div id="quiz-view-top-navbar" className="bg-white dark:bg-[#121214] p-3 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2">
          <button
            id="back-to-library-nav"
            onClick={handleLeaveQuiz}
            className="p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-200 line-clamp-1 max-w-[160px]">
              {test.title}
            </h4>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold block mt-0.5">
              Subject: {currentQuestion.subject}
            </span>
          </div>
        </div>

        {/* Timer, play/pause and navigation OMR list */}
        {resolvedMode ? (
          <div className="flex items-center gap-1">
            <div
              id="quiz-countdown"
              className="bg-slate-50 dark:bg-[#18181b] text-[11px] font-mono px-2 py-1 rounded-lg text-slate-700 dark:text-zinc-300 flex items-center gap-1 border border-slate-150/55 dark:border-zinc-800"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(localTimeSpent)}</span>
              <button
                 id="quiz-timer-pause-toggle"
                 onClick={() => setTimerActive(!timerActive)}
                 className="ml-1 focus:outline-none"
                 title="Pause/Run time tracker"
              >
                {timerActive ? (
                  <Pause className="w-2.5 h-2.5 text-slate-400 hover:text-red-400" />
                ) : (
                  <Play className="w-2.5 h-2.5 text-slate-400 hover:text-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            <button
              id="omr-board-toggler"
              onClick={() => setOmrOpen(!omrOpen)}
              className="p-2 aspect-square rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 cursor-pointer transition-colors"
              title="Toggle OMR quick grid map"
            >
              <Menu className="w-5.2 h-5.2 animate-none" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-indigo-500 font-black tracking-widest uppercase animate-pulse pr-2">NEET</span>
        )}
      </div>

      {/* Progress slider bar */}
      <div id="quiz-progress-gauge" className="h-[2px] w-full bg-slate-100 dark:bg-zinc-800 relative">
        <div
          className="h-full bg-indigo-500 duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Core Question & interactive panel workspace */}
      <div id="main-test-questions-scroller" className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {!resolvedMode ? (
          /* Premium Mode Selection Splash */
          <div
            id="practice-mode-selector-panel"
            className="flex-1 flex flex-col justify-center items-center py-6 px-4 space-y-6 animate-fade-in"
          >
            <div className="text-center space-y-1.5 max-w-sm">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider font-mono">
                🧪 mode initialization
              </span>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-zinc-50 tracking-tight">
                How will you practice this session?
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-normal">
                Choose a mode suited for your learning target. Note that exam simulation parameters lock once started.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
              {/* Option 1: Study Mode */}
              <button
                id="select-onboarding-study"
                onClick={() => onUpdateProgress({ mode: "study" })}
                className="w-full text-left p-5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 hover:border-emerald-500/55 dark:hover:border-emerald-500/55 rounded-3xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-550 dark:text-emerald-400">
                    <BookMarked className="w-5 h-5 group-hover:scale-110 duration-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-emerald-555 dark:group-hover:text-emerald-400 transition-colors">
                      Study Mode 📖
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Instant validation and solutions reveal after every option click. **Answers are locked once chosen** to enforce self-honesty.
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 2: Exam Mode */}
              <button
                id="select-onboarding-exam"
                onClick={() => onUpdateProgress({ mode: "exam" })}
                className="w-full text-left p-5 bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 hover:border-red-500/55 dark:hover:border-rose-500/55 rounded-3xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/10 flex items-center justify-center shrink-0 text-rose-550 dark:text-rose-455">
                    <Clock className="w-5 h-5 group-hover:scale-110 duration-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-rose-550 dark:group-hover:text-rose-400 transition-colors">
                      Simulated NEET Exam ⏱️
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-normal">
                      Full scorecard simulation with standard NEET evaluation (+4/-1). Metacognitive surety tagging active. Solutions are locked until full OMR submission.
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <button
              id="onboarding-back-to-library-btn"
              onClick={handleLeaveQuiz}
              className="text-xs text-slate-450 hover:text-slate-600 dark:hover:text-zinc-300 font-bold underline transition-colors cursor-pointer"
            >
              Cancel and Return
            </button>
          </div>
        ) : isCompleted ? (
          /* Detailed Performance analysis scorecard when exam is completed */
          <div
            id="exam-complete-scorecard"
            className="bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm text-center animate-fade-in"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-zinc-800/80 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-zinc-50 tracking-tight mb-0.5">
              Practice Submitted!
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Your Re-NEET simulated marks are analyzed.
            </p>

            {/* Score box display */}
            <div className="mt-5 mb-5 bg-[#18181b] border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl shadow-md text-white">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-extrabold block">
                NEET Simulated Score
              </span>
              <span className="text-3xl font-extrabold block mt-1 tracking-tight text-indigo-400">
                {progress.score?.finalScore !== undefined ? (progress.score.finalScore > 0 ? `+${progress.score.finalScore}` : progress.score.finalScore) : 0}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1.5 block">
                Marks based on standard (+4/-1) NEET evaluation.
              </span>
            </div>

            {/* Complete Breakdown stats */}
            <div className="grid grid-cols-3 gap-2 text-xs select-none">
              <div className="bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                <span className="font-bold text-emerald-500 block mb-0.5">
                  {progress.score?.correctCount}
                </span>
                <span className="text-[10px] text-slate-400">Correct</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                <span className="font-bold text-red-500 block mb-0.5">
                  {progress.score?.incorrectCount}
                </span>
                <span className="text-[10px] text-slate-400">Wrong</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                <span className="font-bold text-slate-500 block mb-0.5">
                  {progress.score?.blankCount}
                </span>
                <span className="text-[10px] text-slate-400">Blank</span>
              </div>
            </div>

            {/* Metacognitive guess analysis */}
            {(() => {
              const sureCorrect = test.questions.filter((q) => answers[q.number] === q.correctOptionIndex && confidences[q.number] === "sure").length;
              const sureTotal = test.questions.filter((q) => answers[q.number] !== undefined && confidences[q.number] === "sure").length;
              
              const guessCorrect = test.questions.filter((q) => answers[q.number] === q.correctOptionIndex && confidences[q.number] === "guess").length;
              const guessTotal = test.questions.filter((q) => answers[q.number] !== undefined && confidences[q.number] === "guess").length;

              const doubtCorrect = test.questions.filter((q) => answers[q.number] === q.correctOptionIndex && confidences[q.number] === "doubt").length;
              const doubtTotal = test.questions.filter((q) => answers[q.number] !== undefined && confidences[q.number] === "doubt").length;

              if (sureTotal > 0 || guessTotal > 0 || doubtTotal > 0) {
                return (
                  <div className="mt-4 bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-slate-150 dark:border-zinc-800 text-left space-y-2 select-none">
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-wider block font-mono">
                      🧠 metacognitive analysis
                    </span>
                    <div className="space-y-2 text-xs">
                      {sureTotal > 0 && (
                        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-400 font-bold">🎯 Sure Answers Accuracy:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                            {sureCorrect}/{sureTotal} ({Math.round((sureCorrect / sureTotal) * 100)}%)
                          </span>
                        </div>
                      )}
                      {guessTotal > 0 && (
                        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-400 font-bold">🤔 Guessing Accuracy (50/50):</span>
                          <span className={`font-mono font-bold ${guessCorrect / guessTotal >= 0.5 ? "text-emerald-500" : "text-amber-500"}`}>
                            {guessCorrect}/{guessTotal} ({Math.round((guessCorrect / guessTotal) * 100)}%)
                          </span>
                        </div>
                      )}
                      {doubtTotal > 0 && (
                        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2 rounded-xl border border-slate-100 dark:border-zinc-850">
                          <span className="text-slate-500 dark:text-zinc-400 font-bold">💀 Doubts/Blind Guesses Accuracy:</span>
                          <span className="font-mono font-bold text-purple-500">
                            {doubtCorrect}/{doubtTotal} ({Math.round((doubtCorrect / doubtTotal) * 100)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Dynamic review workspace controls */}
            <div className="mt-6 flex gap-2.5">
              <button
                id="view-review-paper"
                onClick={() => saveProgress({ completed: false })} // Re-unlocks for revision/reviewing
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/10 transition-colors cursor-pointer"
              >
                Review Explanation Slides
              </button>
              <button
                id="reset-practice-test"
                onClick={handleResetTestSession}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-[#18181b] dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                title="Restart this study paper"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Question details */
          <div id="active-question-card" className="space-y-4">
            {/* Committed mode indicator feedback widget */}
            {resolvedMode === "exam" ? (
              <div
                id="committed-exam-indicator"
                className="bg-indigo-500/10 dark:bg-zinc-800/80 border border-indigo-500/20 p-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 select-none tracking-wide uppercase"
              >
                ⏱️ NEET Exam Mode Simulated (Study Mode Locked 🔒)
              </div>
            ) : (
              <div
                id="committed-study-indicator"
                className="bg-emerald-500/10 dark:bg-zinc-800/80 border border-emerald-500/20 p-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 select-none tracking-wide uppercase"
              >
                📖 Active Study Mode (Answers Locked Once Chosen 🔒)
              </div>
            )}
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 bg-slate-150/50 dark:bg-zinc-800/30 px-2 py-0.5 rounded-md">
                  Q. {currentQuestion.number} of {totalCount}
                </span>

                {/* Font Size Zoom Tool */}
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-850/50 px-1 py-0.5 rounded-lg border border-slate-250/20 dark:border-zinc-800">
                  <button
                    type="button" 
                    onClick={() => setFontSize("sm")}
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontSize === "sm" ? "bg-indigo-500 text-white shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"}`}
                    title="Small font size"
                  >
                    A
                  </button>
                  <button
                    type="button" 
                    onClick={() => setFontSize("base")}
                    className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontSize === "base" ? "bg-indigo-500 text-white shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"}`}
                    title="Normal font size"
                  >
                    A
                  </button>
                  <button
                    type="button" 
                    onClick={() => setFontSize("lg")}
                    className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded transition-all cursor-pointer ${fontSize === "lg" ? "bg-indigo-500 text-white shadow-xs" : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"}`}
                    title="Large font size"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Status actions (Flag / Star) */}
              <div className="flex items-center gap-1">
                <button
                  id={`flag-btn-${currentQuestion.number}`}
                  onClick={() => handleToggleFlag(currentQuestion.number)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    flagged.includes(currentQuestion.number)
                      ? "bg-amber-50 dark:bg-amber-950/10 text-amber-500"
                      : "text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                  title="Flag for second revision"
                >
                  <Flag className="w-4 h-4 fill-current" />
                </button>

                <button
                  id={`star-btn-${currentQuestion.number}`}
                  onClick={() => handleToggleBookmark(currentQuestion.number)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    bookmarked.includes(currentQuestion.number)
                      ? "bg-indigo-50 dark:bg-indigo-950/10 text-indigo-500"
                      : "text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                  title="Star bookmark is highly difficult"
                >
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>

            {/* Speed warning / pacing indicator */}
            <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded-xl flex items-center justify-between text-[11px] px-3 select-none">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${questionSeconds > 60 ? "bg-red-500 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
                <span className="text-slate-550 dark:text-zinc-400">
                  Question timer: <span className={`font-mono font-bold ${questionSeconds > 60 ? "text-red-500 font-extrabold" : "text-emerald-500"}`}>{questionSeconds}s</span> <span className="text-[10px] text-slate-400 dark:text-zinc-500">(Target: &lt; 60s)</span>
                </span>
              </div>
              {questionSeconds > 60 && (
                <span className="text-[9px] text-red-500 font-bold bg-red-500/10 dark:bg-red-950/20 px-1.5 py-0.5 rounded tracking-wide animate-pulse uppercase">
                  ⚠️ Pacing slow!
                </span>
              )}
            </div>

            {/* Question Text with support for custom workspace scrolling */}
            <div id="question-text-field" className="bg-white dark:bg-[#18181b] p-5 shadow-xs rounded-2xl border border-slate-200 dark:border-zinc-800/80">
              <p className={`text-slate-900 dark:text-zinc-50 leading-relaxed whitespace-pre-line tracking-wide ${
                fontSize === "lg" ? "text-lg font-bold" : fontSize === "base" ? "text-base font-semibold" : "text-sm font-medium"
              }`}>
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Options grid selectors list */}
            <div id="options-choices-stack" className="space-y-2.5">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestion.number] === idx;
                const isCorrect = idx === currentQuestion.correctOptionIndex;
                const hasAnswered = answers[currentQuestion.number] !== undefined;

                // Configure immediate colors for STUDY mode feedback
                let optionStyleClass =
                  "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-slate-900 dark:text-zinc-50 hover:bg-slate-50 dark:hover:bg-[#18181b]";

                if (resolvedMode === "study" && hasAnswered) {
                  if (isCorrect) {
                    optionStyleClass =
                      "border-emerald-500 dark:border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-semibold cursor-not-allowed";
                  } else if (isSelected) {
                    optionStyleClass =
                      "border-red-500 dark:border-red-600 bg-red-500/10 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-semibold cursor-not-allowed";
                  } else {
                    optionStyleClass = "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-slate-400 dark:text-zinc-500 opacity-40 cursor-not-allowed";
                  }
                } else if (resolvedMode === "exam") {
                  if (isSelected) {
                    optionStyleClass =
                      "border-indigo-500 dark:border-indigo-600 bg-indigo-500/10 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm ring-2 ring-indigo-500/20";
                  }
                }

                return (
                  <button
                    id={`option-${currentQuestion.number}-${idx}`}
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    className={`w-full text-left p-3.5 border rounded-2xl text-[13px] leading-relaxed transition-all cursor-pointer flex items-start gap-3 ${optionStyleClass}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-slate-200 dark:border-zinc-750 shrink-0 flex items-center justify-center font-bold text-[10px] bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-mono">
                      {idx + 1}
                    </span>
                    <span className="flex-1 mt-0.5">{option}</span>
                    {resolvedMode === "study" && hasAnswered && isCorrect && (
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 animate-bounce" />
                    )}
                    {resolvedMode === "study" && hasAnswered && isSelected && !isCorrect && (
                      <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Metacognitive Confidence Rating Selection */}
            {answers[currentQuestion.number] !== undefined && (
              <div className="bg-slate-50/50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 p-3 rounded-2xl space-y-2 select-none animate-slide-up duration-150">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase tracking-wide block font-mono">
                  🧠 Student surety level in this answer?
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "sure", label: "✅ 100% Sure", accent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
                    { key: "guess", label: "🤔 50/50 Guess", accent: "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400" },
                    { key: "doubt", label: "💀 Blind/Doubt", accent: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400" },
                  ].map((lvl) => {
                    const isSelected = confidences[currentQuestion.number] === lvl.key;
                    return (
                      <button
                        type="button"
                        key={lvl.key}
                        onClick={() => handleSelectConfidence(lvl.key)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${
                          isSelected
                            ? `${lvl.accent} ring-1 ring-offset-1 dark:ring-offset-[#121214] ring-indigo-500`
                            : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121214] text-slate-500 dark:text-zinc-400"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Instant Mode indicator widget */}
            {resolvedMode === "study" && answers[currentQuestion.number] === undefined && (
              <div className="rounded-xl bg-indigo-500/5 dark:bg-indigo-950/15 p-3 flex items-start gap-2 border border-indigo-200/40 dark:border-indigo-950/40 text-[11px] text-indigo-600 dark:text-indigo-400">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500 animate-pulse" />
                <p className="leading-normal">
                  You are in <strong>Study Mode</strong>. Selecting any option instantly checks consistency & expands the corresponding analytical steps slide.
                </p>
              </div>
            )}

            {/* Expansions slide panel: Immediate "Hints & Solutions" when answered in Study Mode */}
            {resolvedMode === "study" && answers[currentQuestion.number] !== undefined && (
              <div
                id="instant-explanation-accordion"
                className="bg-indigo-50/50 dark:bg-zinc-900/40 border border-indigo-100 dark:border-zinc-800 rounded-3xl p-5 shadow-xs animate-slide-up"
              >
                <div id="solution-header" className="flex items-center gap-1.5 mb-2.5 border-b border-indigo-100 dark:border-zinc-800/80 pb-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="font-extrabold text-xs text-indigo-950 dark:text-zinc-100 uppercase tracking-widest leading-relaxed">
                    Hints & Solutions
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-zinc-200 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                  {currentQuestion.solution || "No explicit explanation steps are matched to this worksheet."}
                </p>
              </div>
            )}

            {/* Workspace Digital Scratchpad toggle */}
            <div id="scratch-toggle-panel" className="pt-2">
              <button
                id="scratchpad-opener"
                onClick={() => setScratchPadOpen(!scratchPadOpen)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-[#121214] hover:bg-slate-200 active:bg-slate-250 dark:hover:bg-zinc-800 transition-colors duration-150 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-zinc-300 cursor-pointer border border-slate-200/20 dark:border-zinc-800"
              >
                <PenSquare className="w-4 h-4 text-indigo-400" />
                <span>{scratchPadOpen ? "Fold Workspace Scratchpad" : "Open Workspace Scratchpad"}</span>
              </button>

              {scratchPadOpen && (
                <div id="scratchpad-text-area-box" className="mt-2.5 animate-slide-up">
                  <textarea
                    id="user-sketch-board"
                    rows={4}
                    placeholder="Scribble formula layouts, constant parameters, or draft calculation steps here on your device..."
                    value={userNotes[currentQuestion.number] || ""}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="w-full p-3 font-mono text-xs bg-zinc-50 dark:bg-[#18181b] border border-slate-150 dark:border-zinc-800 rounded-2xl text-slate-800 dark:text-zinc-200 placeholder-zinc-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 font-mono italic block mt-1">
                    Your scratch space notes are dynamically saved in real-time on your device.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation OMR jump panel side-drawer overlay */}
      {omrOpen && (
        <div
          id="omr-drawer-overlay"
          onClick={() => setOmrOpen(false)}
          className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs z-40 animate-fade-in"
        >
          <div
            id="omr-drawer"
            onClick={(e) => e.stopPropagation()}
            className="w-80 max-w-full h-full bg-white dark:bg-[#121214] border-l border-slate-100 dark:border-zinc-800 p-5 flex flex-col absolute right-0 transition-all shadow-2xl animate-slide-left"
          >
            {/* OMR Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800/80">
              <span className="font-extrabold text-[10px] text-indigo-400 tracking-wider font-mono">
                OMR SIMULATOR
              </span>
              <button
                id="close-omr-btn"
                onClick={() => setOmrOpen(false)}
                className="text-slate-400 cursor-pointer hover:text-indigo-400 text-xs font-semibold"
              >
                Close Map
              </button>
            </div>

            {/* Explanation Guide metrics */}
            <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-[#18181b] p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800 mb-4 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <span className="text-slate-600 dark:text-zinc-400">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-zinc-700" />
                <span className="text-slate-600 dark:text-zinc-400">Blank ({totalCount - answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-zinc-400">Flagged ({flagged.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-slate-600 dark:text-zinc-400">Bookmarked ({bookmarked.length})</span>
              </div>
            </div>

            {/* Numbers List scrollable grid container */}
            <div className="flex-1 overflow-y-auto pr-1 select-none custom-scrollbar">
              {/* OMR Grid Filters */}
              <div className="flex gap-1 mb-3.5 text-[9px] font-extrabold select-none">
                {[
                  { key: "all", label: "All" },
                  { key: "review", label: "Review" },
                  { key: "answered", label: "Answered" },
                  { key: "blank", label: "Blank" },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.key}
                    onClick={() => setOmrFilter(tab.key as any)}
                    className={`flex-1 py-1 rounded-md border text-center transition-all cursor-pointer ${
                      omrFilter === tab.key
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-2 pb-5 text-center">
                {test.questions
                  .filter((q) => {
                    const hasAns = answers[q.number] !== undefined;
                    const isFlg = flagged.includes(q.number);
                    const isBkm = bookmarked.includes(q.number);
                    if (omrFilter === "review") return isFlg || isBkm;
                    if (omrFilter === "answered") return hasAns;
                    if (omrFilter === "blank") return !hasAns;
                    return true;
                  })
                  .map((q) => {
                  const hasAns = answers[q.number] !== undefined;
                  const isCur = q.number === currentQuestion.number;
                  const isFlg = flagged.includes(q.number);
                  const isBkm = bookmarked.includes(q.number);

                  let numBoxClass =
                    "border-slate-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-300";

                  if (isCur) {
                    numBoxClass = "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold";
                  } else if (isFlg) {
                    numBoxClass = "border-amber-400 bg-amber-50/10 text-amber-500 font-bold";
                  } else if (isBkm) {
                    numBoxClass = "border-indigo-400 bg-indigo-50/10 text-indigo-600 font-bold";
                  } else if (hasAns) {
                    numBoxClass = "border-indigo-100 bg-indigo-600 text-white font-bold";
                  }

                  return (
                    <button
                      id={`omr-cell-${q.number}`}
                      key={q.number}
                      onClick={() => handleJumpToQuestion(q.number)}
                      className={`aspect-square rounded-xl border flex items-center justify-center text-xs transition-colors cursor-pointer ${numBoxClass}`}
                    >
                      {q.number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Sheet Trigger */}
            {!isCompleted && (
              <button
                id="submit-sheet-direct"
                onClick={handleSubmitTest}
                className="w-full mt-4 py-3.5 rounded-2xl text-center font-extrabold text-sm border-b-2 border-slate-950 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-300 cursor-pointer transition-colors"
              >
                Submit Answers Sheet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fixed bottom controls paginate tab bar */}
      {!isCompleted && resolvedMode && (
        <div id="quiz-paginate-footer" className="bg-white dark:bg-[#121214] p-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between transition-colors gap-3 select-none">
          <button
            id="quiz-prev-btn"
            disabled={activeIdx === 0}
            onClick={handlePrev}
            className={`px-4 py-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
              activeIdx === 0
                ? "border-slate-100 text-slate-300 dark:border-zinc-800 dark:text-zinc-700"
                : "border-slate-200 text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800"
            }`}
          >
            Prev
          </button>

          {activeIdx === test.questions.length - 1 ? (
            <button
              id="submit-sheet-last"
              onClick={handleSubmitTest}
              className="flex-1 py-3 bg-[#e11d48] hover:bg-rose-500 border-b-2 border-rose-700 text-white rounded-xl text-xs font-bold text-center transition-transform active:scale-95 cursor-pointer shadow-md"
            >
              Finish & Review
            </button>
          ) : (
            <button
              id="quiz-next-btn"
              onClick={handleNext}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 border-b-2 border-indigo-750 text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-zinc-100 w-full rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-md"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
}
