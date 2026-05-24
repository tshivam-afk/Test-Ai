import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ClipboardList,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export interface PlannerTask {
  id: string;
  text: string;
  subject: "Physics" | "Chemistry" | "Biology" | "General";
  createdAt: string;
  completed: boolean;
}

interface PlannerViewProps {
  tasks: PlannerTask[];
  onAddTask: (text: string, subject: PlannerTask["subject"]) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onClearCompletedTasks: () => void;
}

export default function PlannerView({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onClearCompletedTasks,
}: PlannerViewProps) {
  const [taskText, setTaskText] = useState("");
  const [taskSubject, setTaskSubject] = useState<PlannerTask["subject"]>("General");

  const completedCount = useMemo(() => {
    return tasks.filter((t) => t.completed).length;
  }, [tasks]);

  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = taskText.trim();
    if (!cleanText) return;
    onAddTask(cleanText, taskSubject);
    setTaskText("");
  };

  const subjectMeta = {
    Physics: { bg: "bg-rose-500/10", border: "border-red-200/40", text: "text-red-500" },
    Chemistry: { bg: "bg-amber-500/10", border: "border-amber-200/40", text: "text-amber-500" },
    Biology: { bg: "bg-emerald-500/10", border: "border-emerald-200/40", text: "text-emerald-550" },
    General: { bg: "bg-indigo-505/10", border: "border-indigo-200/40", text: "text-indigo-500" }
  };

  return (
    <div id="planner-board-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-4">
      {/* Header Info */}
      <header id="planner-header">
        <span className="text-[10px] font-extrabold tracking-widest text-[#6366f1] uppercase flex items-center gap-1">
          <ClipboardList className="w-3.5 h-3.5" /> Study Planner Desk
        </span>
        <h2 className="font-extrabold text-2xl text-slate-900 dark:text-zinc-100 tracking-tight">
          Daily NEET Prep Checklist
        </h2>
      </header>

      {/* Completion Dashboard Progress Meter */}
      <div className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 p-4 rounded-2xl space-y-3.5 shadow-xs select-none">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">
              Prep Accomplishments Today
            </span>
            <p className="text-[10px] text-slate-450 dark:text-zinc-550 mt-0.5">
              {completedCount} of {totalCount} tasks completed ({progressPercent}%)
            </p>
          </div>
          <span className="text-lg font-black text-indigo-505 dark:text-indigo-400">
            {progressPercent}%
          </span>
        </div>

        {/* Level indicator bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Micro-encouragement */}
        {totalCount > 0 && progressPercent === 100 && (
          <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-dashed border-emerald-500/25 text-center text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            🎉 Amazing! Daily NEET disciplines are complete. Keep striving for prime ranks!
          </div>
        )}
      </div>

      {/* Daily Task Insertion Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 p-4 rounded-2xl space-y-3.5 shadow-xs">
        <h4 className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          Draft Today's Task Target
        </h4>

        <div className="flex flex-col gap-2.5">
          <input
            id="planner-task-input"
            type="text"
            required
            maxLength={100}
            placeholder="e.g. Solve 30 Physics laws of motion questions..."
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 select-none">
              {(["Physics", "Chemistry", "Biology", "General"] as PlannerTask["subject"][]).map((subj) => {
                const isSelected = taskSubject === subj;
                const meta = subjectMeta[subj];
                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setTaskSubject(subj)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white dark:bg-indigo-600 border-indigo-600"
                        : `${meta.bg} ${meta.text} ${meta.border}`
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold leading-none cursor-pointer flex items-center gap-1 active:scale-95 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Task
            </button>
          </div>
        </div>
      </form>

      {/* Tasks checklist shelf */}
      <div className="flex-1 space-y-2.5">
        <div className="flex items-center justify-between select-none px-1">
          <h4 className="text-[10px] text-slate-450 dark:text-zinc-500 uppercase tracking-wider font-bold">
            Active Prep Agenda List ({totalCount})
          </h4>
          {completedCount > 0 && (
            <button
              onClick={onClearCompletedTasks}
              className="text-[10px] text-slate-400 hover:text-red-500 transition-all font-bold cursor-pointer hover:underline"
            >
              Clear Completed ({completedCount})
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-[#121214] border border-dashed border-slate-150 dark:border-zinc-850 rounded-3xl p-6 select-none">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-700 dark:text-zinc-300 font-extrabold">No Planner Targets Active</p>
            <p className="text-[10px] text-slate-450 mt-1 max-w-[200px] leading-normal mx-auto">
              Draft specific checklist steps above to structure your day.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const meta = subjectMeta[task.subject];
              return (
                <div
                  key={task.id}
                  className={`p-3 bg-white dark:bg-[#121214] border rounded-2xl flex items-center justify-between gap-3 group transition-colors shadow-xs ${
                    task.completed
                      ? "border-slate-100 dark:border-zinc-800 opacity-60"
                      : "border-slate-150 dark:border-zinc-850"
                  }`}
                >
                  <div
                    onClick={() => onToggleTask(task.id)}
                    className="flex-1 flex items-start gap-2.5 cursor-pointer select-none"
                  >
                    <div className="mt-0.5 shrink-0">
                      {task.completed ? (
                        <CheckCircle className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                      ) : (
                        <div className="w-4.5 h-4.5 rounded-md border-2 border-slate-300 dark:border-zinc-700 group-hover:border-indigo-400 transition-colors" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold font-sans ${task.completed ? "line-through text-slate-400" : "text-slate-800 dark:text-zinc-200"}`}>
                        {task.text}
                      </p>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block border scale-95 origin-left ${meta.bg} ${meta.text} ${meta.border}`}>
                        {task.subject}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-300 hover:text-red-500 dark:text-zinc-700 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded"
                    title="Remove task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
