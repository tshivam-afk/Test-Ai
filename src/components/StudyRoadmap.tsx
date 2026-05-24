import { useMemo, useState } from "react";
import {
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Flame,
  ChevronRight,
  Info
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { Test, TestProgress } from "../types";

interface StudyRoadmapProps {
  tests: Test[];
  progress: Record<string, TestProgress>;
  onSelectTest: (testId: string) => void;
}

export default function StudyRoadmap({ tests, progress, onSelectTest }: StudyRoadmapProps) {
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // 1. Calculate and compile chart data for each test/workbook that has at least 1 attempt
  const chartData = useMemo(() => {
    const data: Array<{
      id: string;
      name: string;
      attempted: number;
      correct: number;
      accuracy: number;
      date: string;
    }> = [];

    tests.forEach((test) => {
      const prog = progress[test.id];
      if (!prog) return;

      const answeredKeys = Object.keys(prog.answers || {});
      if (answeredKeys.length === 0) return;

      let correctCount = 0;
      test.questions.forEach((q) => {
        const userAns = prog.answers[q.number];
        if (userAns !== undefined && userAns === q.correctOptionIndex) {
          correctCount++;
        }
      });

      const dateObj = new Date(prog.lastUpdatedAt || new Date());
      const formattedDate = dateObj.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      data.push({
        id: test.id,
        name: test.title.length > 18 ? test.title.substring(0, 16) + "..." : test.title,
        attempted: answeredKeys.length,
        correct: correctCount,
        accuracy: Math.round((correctCount / answeredKeys.length) * 100),
        date: formattedDate,
      });
    });

    // Sort by chronological order - most recently updated last for progression trend line
    return data;
  }, [tests, progress]);

  // 2. Compute dynamic accuracy by subject
  const subjectBreakdown = useMemo(() => {
    const subjects: Record<string, { attempted: number; correct: number }> = {};

    tests.forEach((test) => {
      const prog = progress[test.id];
      if (!prog) return;

      test.questions.forEach((q) => {
        const userAns = prog.answers[q.number];
        if (userAns !== undefined) {
          const sub = q.subject || "General";
          if (!subjects[sub]) {
            subjects[sub] = { attempted: 0, correct: 0 };
          }
          subjects[sub].attempted++;
          if (userAns === q.correctOptionIndex) {
            subjects[sub].correct++;
          }
        }
      });
    });

    return Object.entries(subjects).map(([subject, stats]) => ({
      name: subject,
      attempted: stats.attempted,
      correct: stats.correct,
      accuracy: stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0,
    }));
  }, [tests, progress]);

  // 3. Compute Metacognitive Calibration metric (Accuracy by Confidence choice)
  // Confidence keys: 'sure' (100% Sure), 'guess' (50/50 Guess), 'doubt' (Blind/Doubt)
  const confidenceStats = useMemo(() => {
    const stats: Record<string, { attempted: number; correct: number }> = {
      sure: { attempted: 0, correct: 0 },
      guess: { attempted: 0, correct: 0 },
      doubt: { attempted: 0, correct: 0 },
    };

    tests.forEach((test) => {
      const prog = progress[test.id];
      if (!prog || !prog.confidences) return;

      test.questions.forEach((q) => {
        const userAns = prog.answers[q.number];
        const conf = prog.confidences?.[q.number];
        if (userAns !== undefined && conf && stats[conf]) {
          stats[conf].attempted++;
          if (userAns === q.correctOptionIndex) {
            stats[conf].correct++;
          }
        }
      });
    });

    return stats;
  }, [tests, progress]);

  // Calculate aggregated stats
  const totalQuestionsSolved = useMemo(() => {
    return Object.values(progress).reduce(
      (sum, cur) => sum + Object.keys(cur.answers || {}).length,
      0
    );
  }, [progress]);

  const totalCorrectQuestions = useMemo(() => {
    let sum = 0;
    tests.forEach((test) => {
      const prog = progress[test.id];
      if (!prog) return;
      test.questions.forEach((q) => {
        const userAns = prog.answers[q.number];
        if (userAns !== undefined && userAns === q.correctOptionIndex) {
          sum++;
        }
      });
    });
    return sum;
  }, [tests, progress]);

  const overallAccuracy = totalQuestionsSolved > 0 
    ? Math.round((totalCorrectQuestions / totalQuestionsSolved) * 100) 
    : 0;

  // Unlocked milestones
  const milestone = useMemo(() => {
    if (totalQuestionsSolved >= 100) {
      return { title: "NEET Conqueror", color: "text-purple-600 dark:text-purple-400 bg-purple-500/10", min: 100 };
    } else if (totalQuestionsSolved >= 45) {
      return { title: "Calibration Master", color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10", min: 45 };
    } else if (totalQuestionsSolved >= 10) {
      return { title: "Steady Tracker", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10", min: 10 };
    } else {
      return { title: "Rookie Aspirant", color: "text-amber-600 dark:text-amber-400 bg-amber-500/10", min: 0 };
    }
  }, [totalQuestionsSolved]);

  return (
    <div id="roadmap-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* Title */}
      <div>
        <span className="text-[10px] font-extrabold tracking-widest text-indigo-400 uppercase">
          Analytical Dashboard
        </span>
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
          Study Roadmap
        </h2>
      </div>

      {/* Aggregate Score summary cards */}
      <div id="stats-summary-grid" className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-3 flex items-center space-x-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Overall Accuracy</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-slate-800 dark:text-zinc-50">{overallAccuracy}%</span>
              <span className="text-[9px] text-slate-400 font-medium">accuracy</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-800/80 rounded-2xl p-3 flex items-center space-x-3.5 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Aspirant Rank</span>
            <div className="flex flex-col">
              <span className={`text-xs font-black px-1.5 py-0.5 rounded-md leading-tight text-center ${milestone.color}`}>
                {milestone.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Roadmap Chart (Attempts vs Accuracy Trend) */}
      <div id="recharts-panel" className="bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/85 shadow-xs">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Session Attempt Progress</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-snug">
              Compare attempted problems (Bars) vs your correct accuracy rate (Line)
            </p>
          </div>
          <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
        </div>

        {chartData.length === 0 ? (
          <div id="chart-placeholder" className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-zinc-850 flex items-center justify-center text-slate-400 mb-2">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-extrabold text-slate-800 dark:text-zinc-300">No session data logged yet</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] mt-0.5 leading-normal">
              Answer questions in any workbook to generate your clinical accuracy roadmap.
            </p>
          </div>
        ) : (
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: -5, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:opacity-10" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 9 }} stroke="#818cf8" label={{ value: 'Qs', angle: -90, position: 'insideLeft', style: {fontSize: 9, fill: "#818cf8"} }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} stroke="#34d399" domain={[0, 100]} label={{ value: '%', angle: 90, position: 'insideRight', style: {fontSize: 9, fill: "#34d399"} }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "10px",
                  }}
                  itemStyle={{ margin: "2px 0" }}
                />
                <Bar yAxisId="left" dataKey="attempted" name="Solved Qs" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={16} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, strokeWidth: 1.5 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dynamic Subject Breakdown Panel */}
      <div id="subject-trends" className="bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/85">
        <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 mb-0.5">Subject Proficiency</h3>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 mb-3.5">
          Percent correct answers calculated by high-yield subject tags
        </p>

        {subjectBreakdown.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-4">No subject statistics generated yet.</p>
        ) : (
          <div className="space-y-3">
            {subjectBreakdown.map((sb) => {
              const accentColor =
                sb.accuracy >= 75
                  ? "bg-emerald-500"
                  : sb.accuracy >= 50
                  ? "bg-indigo-500"
                  : "bg-amber-500";

              return (
                <div
                  key={sb.name}
                  onMouseEnter={() => setHoveredSubject(sb.name)}
                  onMouseLeave={() => setHoveredSubject(null)}
                  className={`transition-all duration-150 p-2 rounded-xl border ${
                    hoveredSubject === sb.name
                      ? "border-indigo-400 bg-indigo-500/5"
                      : "border-transparent bg-slate-50/40 dark:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {sb.name}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      {sb.correct}/{sb.attempted} ({sb.accuracy}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${accentColor}`}
                      style={{ width: `${sb.accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Metacognitive surety Level analysis report */}
      <div id="calibration-audit" className="bg-white dark:bg-[#18181b] p-4 rounded-2xl border border-slate-150 dark:border-zinc-800/85">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">Metacognitive Calibration</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-snug">
              Auditing how accurate your answers are compared to your level of confidence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Sure Level analysis block */}
          <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex flex-col justify-between text-center">
            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold block">100% SURE</span>
            <div className="my-1">
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
                {confidenceStats.sure.attempted > 0 
                  ? Math.round((confidenceStats.sure.correct / confidenceStats.sure.attempted) * 100) 
                  : 0}%
              </span>
            </div>
            <span className="text-[8px] text-slate-400 leading-none">
              {confidenceStats.sure.correct}/{confidenceStats.sure.attempted} correct
            </span>
          </div>

          {/* Guess Level analysis block */}
          <div className="p-2.5 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col justify-between text-center">
            <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold block">50/50 GUESS</span>
            <div className="my-1">
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
                {confidenceStats.guess.attempted > 0 
                  ? Math.round((confidenceStats.guess.correct / confidenceStats.guess.attempted) * 100) 
                  : 0}%
              </span>
            </div>
            <span className="text-[8px] text-slate-400 leading-none">
              {confidenceStats.guess.correct}/{confidenceStats.guess.attempted} correct
            </span>
          </div>

          {/* Doubt Level analysis block */}
          <div className="p-2.5 bg-purple-500/5 border border-purple-500/10 rounded-xl flex flex-col justify-between text-center">
            <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold block">DOUBTING</span>
            <div className="my-1">
              <span className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
                {confidenceStats.doubt.attempted > 0 
                  ? Math.round((confidenceStats.doubt.correct / confidenceStats.doubt.attempted) * 100) 
                  : 0}%
              </span>
            </div>
            <span className="text-[8px] text-slate-400 leading-none">
              {confidenceStats.doubt.correct}/{confidenceStats.doubt.attempted} correct
            </span>
          </div>
        </div>

        {/* Insight suggestion dynamic banner */}
        <div className="mt-3 p-2.5 bg-indigo-500/5 rounded-xl border border-indigo-100/30 dark:border-indigo-950/30 text-[10px] text-indigo-600 dark:text-indigo-400 flex items-start gap-1.5 leading-normal">
          <HelpCircle className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
          <p>
            {confidenceStats.sure.attempted > 0 && Math.round((confidenceStats.sure.correct / confidenceStats.sure.attempted) * 100) < 80 ? (
              <span><strong>Caution:</strong> You have a high error rate on questions you feel 100% sure about. Review those solutions to clear up concept traps!</span>
            ) : totalQuestionsSolved > 0 ? (
              <span><strong>Tip:</strong> Flag questions you guess on to automatically save them in the <strong>Mistake Gym</strong> for active review later.</span>
            ) : (
              <span>Practice questions with metacognitive confidence tags in workbooks to activate diagnostics.</span>
            )}
          </p>
        </div>
      </div>

      {/* Suggested Quick Workbook Action */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-500 tracking-wider">RESUME DRILLS</h3>
          <div className="space-y-2">
            {tests.slice(0, 2).map((test) => {
              const prog = progress[test.id];
              const solved = prog ? Object.keys(prog.answers || {}).length : 0;
              const total = test.questions.length;
              if (solved === total) return null;

              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest(test.id)}
                  className="p-3 bg-white dark:bg-[#121214] border border-slate-100 dark:border-zinc-800/80 rounded-xl hover:border-slate-350 dark:hover:border-zinc-750 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">{test.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{solved}/{total} solved • {total - solved} left</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
