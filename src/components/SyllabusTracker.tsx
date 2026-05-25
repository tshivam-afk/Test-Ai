import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Bookmark, Compass, RefreshCw, Star, BarChart, Percent, Award } from "lucide-react";

interface SyllabusChapter {
  id: string;
  subject: "Botany" | "Zoology" | "Physics" | "Chemistry";
  name: string;
  weightage: "High" | "Medium" | "Low";
  percentage: number; // approximate paper weightage
}

const SYLLABUS_CHANNELS: SyllabusChapter[] = [
  // Botany
  { id: "b1", subject: "Botany", name: "Genetics & Evolution (Principles of Inheritance)", weightage: "High", percentage: 12 },
  { id: "b2", subject: "Botany", name: "Sexual Reproduction in Flowering Plants", weightage: "High", percentage: 8 },
  { id: "b3", subject: "Botany", name: "Plant Kingdom", weightage: "Medium", percentage: 5 },
  { id: "b4", subject: "Botany", name: "Photosynthesis and Respiration in Plants", weightage: "Medium", percentage: 6 },
  { id: "b5", subject: "Botany", name: "Ecology & Environment", weightage: "High", percentage: 10 },
  // Zoology
  { id: "z1", subject: "Zoology", name: "Human Physiology (Digestive, Respiration, Bio fluids)", weightage: "High", percentage: 14 },
  { id: "z2", subject: "Zoology", name: "Human Reproduction & Reproductive Health", weightage: "High", percentage: 8 },
  { id: "z3", subject: "Zoology", name: "Animal Kingdom", weightage: "Medium", percentage: 5 },
  { id: "z4", subject: "Zoology", name: "Biomolecules", weightage: "Medium", percentage: 4 },
  { id: "z5", subject: "Zoology", name: "Evolution", weightage: "Medium", percentage: 4 },
  // Physics
  { id: "p1", subject: "Physics", name: "Modern Physics (Dual Nature, Atoms, Nuclei, Semiconductors)", weightage: "High", percentage: 12 },
  { id: "p2", subject: "Physics", name: "Electrostatics & Current Electricity", weightage: "High", percentage: 10 },
  { id: "p3", subject: "Physics", name: "Optics (Ray & Wave Optics)", weightage: "High", percentage: 9 },
  { id: "p4", subject: "Physics", name: "Mechanics (Laws of Motion, Work Energy, System of Particles)", weightage: "High", percentage: 11 },
  { id: "p5", subject: "Physics", name: "Thermodynamics & Kinetic Theory", weightage: "Medium", percentage: 5 },
  // Chemistry
  { id: "c1", subject: "Chemistry", name: "Organic Chemistry (Hydrocarbons, Halides, Oxygen & Nitrogen compounds)", weightage: "High", percentage: 15 },
  { id: "c2", subject: "Chemistry", name: "Equilibrium & Chemical Kinetics", weightage: "High", percentage: 9 },
  { id: "c3", subject: "Chemistry", name: "Inorganic Coordination Compounds & d-f Block Elements", weightage: "High", percentage: 9 },
  { id: "c4", subject: "Chemistry", name: "Structure of Atom & Chemical Bonding", weightage: "Medium", percentage: 7 },
  { id: "c5", subject: "Chemistry", name: "Thermodynamics & Electrochemistry", weightage: "High", percentage: 8 }
];

interface TopicState {
  theory: boolean;
  mcq: boolean;
  notes: boolean;
}

export default function SyllabusTracker() {
  const [activeSubject, setActiveSubject] = useState<"All" | "Botany" | "Zoology" | "Physics" | "Chemistry">("All");
  const [prepProgress, setPrepProgress] = useState<Record<string, TopicState>>({});
  const [isCuesEnabled] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("practice_companion_syllabus_progress_v1");
      if (stored) {
        setPrepProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed loading syllabus logs:", e);
    }
  }, []);

  const triggerBeepSound = (isCheck: boolean) => {
    if (!isCuesEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(isCheck ? 580 : 390, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // Toggle single micro checkbox
  const handleToggle = (chapterId: string, aspect: keyof TopicState) => {
    setPrepProgress((prev) => {
      const current = prev[chapterId] || { theory: false, mcq: false, notes: false };
      const nextValue = !current[aspect];
      
      const next = {
        ...prev,
        [chapterId]: {
          ...current,
          [aspect]: nextValue
        }
      };
      
      try {
        localStorage.setItem("practice_companion_syllabus_progress_v1", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      
      triggerBeepSound(nextValue);
      return next;
    });
  };

  // Calculations for scores
  const getChapterCompletion = (id: string): number => {
    const s = prepProgress[id];
    if (!s) return 0;
    let score = 0;
    if (s.theory) score += 33.3;
    if (s.mcq) score += 33.3;
    if (s.notes) score += 33.4;
    return Math.round(score);
  };

  // Calculated aggregated progress
  const totals = SYLLABUS_CHANNELS.reduce((acc, chap) => {
    const percentFilled = getChapterCompletion(chap.id);
    acc.weightedMax += chap.percentage;
    acc.weightedFilled += chap.percentage * (percentFilled / 100);
    return acc;
  }, { weightedMax: 0, weightedFilled: 0 });

  const totalNEETMasteryIndex = totals.weightedMax > 0 
    ? Math.round((totals.weightedFilled / totals.weightedMax) * 100)
    : 0;

  // Filter lists
  const filteredChapters = SYLLABUS_CHANNELS.filter(
    (c) => activeSubject === "All" || c.subject === activeSubject
  );

  // Recommendations generator (find high weightage chapters completely unattempted)
  const recommendations = SYLLABUS_CHANNELS.filter((chap) => {
    const s = prepProgress[chap.id];
    const isDone = s && s.theory && s.mcq && s.notes;
    return chap.weightage === "High" && !isDone;
  }).slice(0, 2);

  const resetSyllabusProgress = () => {
    if (confirm("Are you sure you want to reset all checked chapters and start fresh?")) {
      setPrepProgress({});
      try {
        localStorage.removeItem("practice_companion_syllabus_progress_v1");
      } catch {}
      triggerBeepSound(false);
    }
  };

  return (
    <div className="space-y-4 animate-scale-in">
      {/* Dynamic Summary Cards with Dial */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Dynamic Mastery score gauge */}
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2 shadow-xs select-none">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Weighted Exam Readiness</span>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                {totalNEETMasteryIndex}% NCERT Syllabus Secure
              </span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <svg className="w-11 h-11 transform -rotate-90">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-slate-200 dark:stroke-zinc-800 fill-transparent"
                strokeWidth="4"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-indigo-550 fill-transparent transition-all duration-300"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 18}
                strokeDashoffset={2 * Math.PI * 18 * (1 - totalNEETMasteryIndex / 100)}
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-850 dark:text-zinc-200">
              {totalNEETMasteryIndex}%
            </span>
          </div>
        </div>

        {/* Dynamic Chapter checklists stats details */}
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-around col-span-1 md:col-span-2 shadow-xs select-none">
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-indigo-500 block">
              {SYLLABUS_CHANNELS.filter(c => getChapterCompletion(c.id) === 100).length}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Perfect</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-zinc-800" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-amber-500 block">
              {SYLLABUS_CHANNELS.filter(c => getChapterCompletion(c.id) > 0 && getChapterCompletion(c.id) < 100).length}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">In-Progress</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-zinc-800" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-slate-500 block">
              {SYLLABUS_CHANNELS.filter(c => getChapterCompletion(c.id) === 0).length}
            </span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Pending</span>
          </div>
        </div>
      </div>

      {/* Advisory recommendations box */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/5 to-indigo-505/5 p-3 rounded-2xl border border-amber-500/10 dark:border-zinc-800/80 flex gap-2.5 items-start select-none">
          <Compass className="w-5 h-5 text-amber-550 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-black tracking-widest text-amber-600 dark:text-amber-500 block uppercase">
              HIGH-YIELD CRITICAL RECOMMENDATIONS
            </span>
            <p className="text-[10.5px] text-slate-450 dark:text-zinc-400 leading-normal mt-0.5">
              These high-yield chapters are uncompleted. Scoring these can capture up to <strong>{recommendations.reduce((sum, c) => sum + c.percentage, 0)}%</strong> of national paper points:
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {recommendations.map((chap) => (
                <span
                  key={chap.id}
                  className="text-[9.5px] font-bold px-2 py-0.5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-lg text-indigo-600 dark:text-indigo-400"
                >
                  🎯 {chap.name} ({chap.percentage}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary subject filter bar & reset control */}
      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar">
          {(["All", "Botany", "Zoology", "Physics", "Chemistry"] as const).map((sub) => (
            <button
              id={`syllabus-subject-tab-${sub}`}
              key={sub}
              onClick={() => {
                setActiveSubject(sub);
                triggerBeepSound(true);
              }}
              className={`px-3 py-1.2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubject === sub
                  ? "bg-indigo-650 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-350 hover:bg-slate-200/50 dark:hover:bg-zinc-850"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <button
          onClick={resetSyllabusProgress}
          className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1.2 rounded-xl border border-transparent hover:border-rose-500/10 hover:bg-rose-500/5"
          title="Reset completely"
        >
          <RefreshCw className="w-3 h-3" /> <span className="hidden xs:inline">Reset Map</span>
        </button>
      </div>

      {/* Chapters Checklist Matrix */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
        {filteredChapters.map((chap) => {
          const s = prepProgress[chap.id] || { theory: false, mcq: false, notes: false };
          const completionRate = getChapterCompletion(chap.id);

          return (
            <div
              key={chap.id}
              className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 p-3 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-zinc-750 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 select-none flex-wrap">
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md ${
                    chap.weightage === "High"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-450"
                      : chap.weightage === "Medium"
                      ? "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400"
                      : "bg-slate-500/10 text-slate-650 dark:text-zinc-400"
                  }`}>
                    {chap.weightage} WEIGHT ({chap.percentage}%)
                  </span>
                  <span className="text-[9px] font-medium text-slate-400">Class 11/12</span>
                </div>
                <h4 className="text-[12.5px] font-bold text-slate-820 dark:text-zinc-150 mt-1 leading-snug">
                  {chap.name}
                </h4>
              </div>

              {/* Grid of Micro Controls */}
              <div className="flex flex-wrap items-center gap-1.5 select-none">
                {/* 1. Theory */}
                <button
                  id={`syllabus-opt-theory-${chap.id}`}
                  onClick={() => handleToggle(chap.id, "theory")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black border transition-all cursor-pointer ${
                    s.theory
                      ? "bg-emerald-500/10 border-emerald-550/30 text-emerald-650 dark:text-emerald-400"
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-205 dark:border-zinc-800 text-slate-500 hover:bg-slate-100/60"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${s.theory ? "text-emerald-500 fill-emerald-500/20" : ""}`} />
                  <span>NCERT Studied</span>
                </button>

                {/* 2. MCQ */}
                <button
                  id={`syllabus-opt-mcq-${chap.id}`}
                  onClick={() => handleToggle(chap.id, "mcq")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black border transition-all cursor-pointer ${
                    s.mcq
                      ? "bg-emerald-500/10 border-emerald-550/30 text-emerald-650 dark:text-emerald-400"
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-205 dark:border-zinc-800 text-slate-500 hover:bg-slate-100/60"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${s.mcq ? "text-emerald-500 fill-emerald-500/20" : ""}`} />
                  <span>MCQs Drilled</span>
                </button>

                {/* 3. Revision */}
                <button
                  id={`syllabus-opt-notes-${chap.id}`}
                  onClick={() => handleToggle(chap.id, "notes")}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black border transition-all cursor-pointer ${
                    s.notes
                      ? "bg-emerald-500/10 border-emerald-550/30 text-emerald-650 dark:text-emerald-400"
                      : "bg-slate-50 dark:bg-zinc-900 border-slate-205 dark:border-zinc-800 text-slate-500 hover:bg-slate-100/60"
                  }`}
                >
                  <CheckCircle className={`w-3.5 h-3.5 ${s.notes ? "text-emerald-500 fill-emerald-500/20" : ""}`} />
                  <span>Formula Card</span>
                </button>

                {/* Progress Mini Score */}
                <div className="w-10 text-center font-mono text-[10.5px] font-black text-slate-600 dark:text-zinc-330">
                  {completionRate}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
