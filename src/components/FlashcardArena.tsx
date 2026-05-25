import { useState, useEffect } from "react";
import { Zap, RotateCw, Check, AlertCircle, Sparkles, BookOpen, Volume2, VolumeX, ListFilter, RotateCcw } from "lucide-react";

interface Flashcard {
  id: string;
  subject: "Biology" | "Chemistry" | "Physics";
  topic: string;
  front: string;
  back: string;
  highYieldTag?: string;
}

const INITIAL_CARDS: Flashcard[] = [
  {
    id: "card-1",
    subject: "Biology",
    topic: "Photosynthesis (Botany)",
    front: "What is the primary acceptor of CO₂ in C₃ plants vs. C₄ plants?",
    back: "• C₃ Plants: **RuBP (Ribulose-1,5-bisphosphate)**, a 5-carbon compound. It is catalyzed by RuBisCO to form 3-PGA.\n• C₄ Plants: **PEP (Phosphoenolpyruvate)**, a 3-carbon compound. It is catalyzed by PEP carboxylase in mesophyll cells to form OAA.",
    highYieldTag: "NCERT Class 11"
  },
  {
    id: "card-2",
    subject: "Biology",
    topic: "Endocrine System (Zoology)",
    front: "Which cells in the pancreas secrete insulin, glucagon, and somatostatin respectively?",
    back: "From the **Islets of Langerhans**:\n• **Alpha (α) cells** secrete **Glucagon** (elevates glucose).\n• **Beta (β) cells** secrete **Insulin** (lowers glucose).\n• **Delta (δ) cells** secrete **Somatostatin** (inhibits both insulin and glucagon).",
    highYieldTag: "High-Yield NEET"
  },
  {
    id: "card-3",
    subject: "Chemistry",
    topic: "Organic (Amids & Amines)",
    front: "Describe the reactants, catalyst, and core product of the Sandmeyer Reaction.",
    back: "• Reactants: **Benzene diazonium chloride** (C₆H₅N₂⁺Cl⁻).\n• Catalyst: **Cuprous halide (Cu₂Cl₂ or Cu₂Br₂)** or cuprous cyanide (CuCN).\n• Product: **Chlorobenzene, Bromobenzene, or Benzonitrile** respectively.\n• Note: Nitrogen gas (N₂) is evolved as a byproduct.",
    highYieldTag: "Organic Name Reaction"
  },
  {
    id: "card-4",
    subject: "Physics",
    topic: "Modern Physics",
    front: "Write Einstein's Photoelectric Equation and explain the concept of 'Threshold Frequency' (ν₀).",
    back: "Equation: **K_max = hν - φ₀** (or **K_max = h(ν - ν₀)**)\n• **hν**: Incident photon energy.\n• **φ₀** (Work Function): The minimum threshold energy required to liberate an electron from the metal sheet.\n• **Threshold Frequency (ν₀)**: Below this specific frequency, no photoelectrons are emitted, regardless of the light's intensity.",
    highYieldTag: "Modern Physics Part 12"
  },
  {
    id: "card-5",
    subject: "Biology",
    topic: "Biotechnology",
    front: "Identify the critical restriction enzyme and DNA ligase roles in recombinant DNA technology.",
    back: "• **Restriction Endonucleases**: The 'molecular scissors' that cut DNA double-strands at specific palindromic sequences (e.g., EcoRI) creating sticky or blunt ends.\n• **DNA Ligase**: The 'molecular glue' that seals nicked sugar-phosphate backbones by catalyzing phosphodiester bond formation between matching ends.",
    highYieldTag: "NCERT Chapter 11"
  },
  {
    id: "card-6",
    subject: "Physics",
    topic: "Electrostatics",
    front: "Define Gauss's Law in electrostatics and state its exact mathematical formula.",
    back: "The net electric flux (Φ) through any closed surface is equal to the net charge (Q_enclosed) wrapped inside the surface divided by the permittivity of free space (ε₀).\nFormula:\n**∮ E · dA = Q_enclosed / ε₀**",
    highYieldTag: "Formula Sheet"
  },
  {
    id: "card-7",
    subject: "Chemistry",
    topic: "Coordination Compounds",
    front: "What is the formula representing 'Effective Atomic Number' (EAN) for transition metal complexes?",
    back: "**EAN = Z - ON + (2 × CN)**\n• **Z**: Atomic number of the central transition metal ion.\n• **ON**: Oxidation state of the central metal ion.\n• **CN**: Coordination number (number of coordinate bonds formed with ligands).",
    highYieldTag: "Inorganic Core"
  },
  {
    id: "card-8",
    subject: "Biology",
    topic: "Muscle Contraction",
    front: "During sarcomere muscle contraction, which band decreases in size and which band stays constant?",
    back: "Based on the **Sliding Filament Theory**:\n• **I-band** and **H-zone** narrow down and can disappear during maximal contraction as actin slides inward.\n• **A-band** (length of thick myosin filaments) **remains completely constant**.",
    highYieldTag: "NCERT Class 11"
  },
  {
    id: "card-9",
    subject: "Chemistry",
    topic: "Chemical Kinetics",
    front: "How does the rate constant (k) change with extreme temperature increase, according to the Arrhenius Equation?",
    back: "Arrhenius equation: **k = A · e^(-Ea / RT)**\n• As temperature (T) increases, the exponential term **e^(-Ea/RT)** becomes less negative (larger), so the rate constant **k increases exponentially**.\n• A common rule of thumb is that for every **10°C rise** in temperature, the rate constant approximately **doubles**.",
    highYieldTag: "Physical Chemistry"
  },
  {
    id: "card-10",
    subject: "Physics",
    topic: "Optics & Wave",
    front: "Define Brewster's Law for light polarization and state the relationship between polarizing angle (i_p) and refractive index (μ).",
    back: "Brewster's Law states that when unpolarized light is incident on a boundary at the polarizing angle (i_p), the reflected light is completely plane-polarized.\nFormula:\n**μ = tan(i_p)**\nAt this angle, reflected and refracted rays are exactly **90° perpendicular** to each other.",
    highYieldTag: "Wave Optics"
  }
];

type MasteryLevel = "unreviewed" | "again" | "good" | "easy";

export default function FlashcardArena() {
  const [cards, setCards] = useState<Flashcard[]>(INITIAL_CARDS);
  const [selectedSubject, setSelectedSubject] = useState<"All" | "Biology" | "Chemistry" | "Physics">("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, MasteryLevel>>({});
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  // Load progress matching local history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("practice_companion_flashcards_progress_v1");
      if (stored) {
        setProgressMap(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load flashcard progress:", e);
    }
  }, []);

  // Sync to local storage
  const updateProgress = (cardId: string, level: MasteryLevel) => {
    setProgressMap((prev) => {
      const next = { ...prev, [cardId]: level };
      try {
        localStorage.setItem("practice_companion_flashcards_progress_v1", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    playSynthSound(level === "easy" ? 640 : level === "good" ? 520 : 360);
  };

  const playSynthSound = (frequency: number) => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    playSynthSound(440);
  };

  // Filtered Cards
  const filteredCards = cards.filter(
    (c) => selectedSubject === "All" || c.subject === selectedSubject
  );

  // Safe Index Wrap
  const handleNext = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    playSynthSound(480);
  };

  const handlePrev = () => {
    if (filteredCards.length === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    playSynthSound(400);
  };

  const handleResetProgress = () => {
    if (confirm("Are you sure you want to reset all your learning memory ratings for these flashcards?")) {
      setProgressMap({});
      try {
        localStorage.removeItem("practice_companion_flashcards_progress_v1");
      } catch {}
      setCurrentIndex(0);
      setIsFlipped(false);
      playSynthSound(300);
    }
  };

  const activeCard = filteredCards[currentIndex];

  // Calculations for total progress chart
  const stats = {
    unreviewed: cards.filter((c) => !progressMap[c.id] || progressMap[c.id] === "unreviewed").length,
    again: cards.filter((c) => progressMap[c.id] === "again").length,
    good: cards.filter((c) => progressMap[c.id] === "good").length,
    easy: cards.filter((c) => progressMap[c.id] === "easy").length,
    masteredPercentage: Math.round(
      (cards.filter((c) => progressMap[c.id] === "easy").length / cards.length) * 100
    ),
  };

  return (
    <div className="space-y-4 animate-scale-in">
      {/* Aggregated Stats & Options Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Progress gauge card */}
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-between col-span-1 md:col-span-2 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Spaced Spurt Engine</span>
              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">
                {stats.easy} / {cards.length} Cards Mastered
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
                strokeDashoffset={2 * Math.PI * 18 * (1 - stats.masteredPercentage / 100)}
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-850 dark:text-zinc-200">
              {stats.masteredPercentage}%
            </span>
          </div>
        </div>

        {/* Micro level breakdown indicators */}
        <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 p-3 rounded-2xl flex items-center justify-around col-span-1 md:col-span-2 shadow-xs">
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-rose-550 block">{stats.again}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Hard</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-zinc-800" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-indigo-500 block">{stats.good}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Medium</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-zinc-800" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-emerald-520 block">{stats.easy}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Mastered</span>
          </div>
          <div className="h-6 w-[1.5px] bg-slate-200 dark:bg-zinc-800" />
          <div className="text-center">
            <span className="text-[10px] font-mono font-black text-slate-500 block">{stats.unreviewed}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Unvisited</span>
          </div>
        </div>
      </div>

      {/* Controller Controls: Subject Filters, Sound, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto select-none no-scrollbar">
          {(["All", "Biology", "Chemistry", "Physics"] as const).map((sub) => (
            <button
              id={`card-filter-tab-${sub}`}
              key={sub}
              onClick={() => {
                setSelectedSubject(sub);
                setCurrentIndex(0);
                setIsFlipped(false);
                playSynthSound(410);
              }}
              className={`px-3 py-1.2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedSubject === sub
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-350 hover:bg-slate-200/50 dark:hover:bg-zinc-850"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="p-1.8 bg-slate-100 dark:bg-zinc-900 rounded-xl hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-all text-slate-600 dark:text-zinc-300"
            title={isSoundEnabled ? "Mute interactive audio cues" : "Enable interactive audio cues"}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-indigo-505" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          
          <button
            onClick={handleResetProgress}
            className="p-1.8 bg-slate-100 dark:bg-zinc-900 rounded-xl hover:bg-rose-500/10 hover:text-rose-650 dark:hover:text-rose-400 transition-all text-slate-400"
            title="Reset active card memory ratings"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Flashcard View Arena */}
      {filteredCards.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 rounded-2xl">
          <p className="text-xs font-black text-slate-500 mt-2">Zero Flashcards found for {selectedSubject}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-450 dark:text-zinc-500 font-bold px-1 select-none">
            <span>
              CARD {currentIndex + 1} OF {filteredCards.length}
            </span>
            <span className={`text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
              activeCard.subject === "Biology"
                ? "bg-emerald-500/5 border-emerald-500/15 text-emerald-550"
                : activeCard.subject === "Chemistry"
                ? "bg-amber-500/5 border-amber-500/15 text-amber-550"
                : "bg-indigo-500/5 border-indigo-505/15 text-indigo-550"
            }`}>
              <span className="w-1.2 h-1.2 rounded-full bg-current" />
              {activeCard.subject}
            </span>
          </div>

          {/* Interactive flipping card box */}
          <div
            id="spaced-flip-canvas"
            onClick={handleFlip}
            className="w-full min-h-[220px] relative cursor-pointer select-none group focus:outline-none"
            style={{ perspective: "1200px" }}
          >
            <div
              className="w-full h-full min-h-[220px] transition-all duration-500 ease-in-out relative border rounded-2xl shadow-xs"
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                backgroundColor: "transparent",
                borderColor: "transparent"
              }}
            >
              {/* FRONT OF THE CARD */}
              <div
                className="absolute inset-0 w-full h-full p-6 pb-8 rounded-2xl bg-white dark:bg-[#151518] border border-slate-150 dark:border-zinc-850 flex flex-col justify-between"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-indigo-550 dark:text-indigo-400 font-black tracking-widest">
                    <span>{activeCard.topic}</span>
                    {activeCard.highYieldTag && (
                      <span className="bg-slate-100 dark:bg-zinc-800 px-1.8 py-0.5 rounded-md font-bold text-slate-400">
                        {activeCard.highYieldTag}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[14px] leading-relaxed font-black text-slate-800 dark:text-zinc-100 tracking-tight select-none">
                    {activeCard.front}
                  </h3>
                </div>
                <div className="text-center pt-4 border-t border-dashed border-slate-100/80 dark:border-zinc-800/80">
                  <span className="text-[10px] font-bold text-indigo-500 flex items-center justify-center gap-1 transition-all group-hover:scale-105">
                    <RotateCw className="w-3.5 h-3.5" /> tap to flip and read high-yield concept
                  </span>
                </div>
              </div>

              {/* BACK OF THE CARD */}
              <div
                className="absolute inset-0 w-full h-full p-6 pb-8 rounded-2xl bg-indigo-50/10 dark:bg-zinc-900 border-2 border-indigo-500/20 flex flex-col justify-between"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-emerald-550 font-black tracking-widest">
                    <span>CONCEPT EXPLANATION</span>
                    <span className="bg-emerald-500/10 text-emerald-550 px-1.8 py-0.5 rounded-md font-bold">
                      ACTIVE RECALL
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed font-bold text-slate-700 dark:text-zinc-200 whitespace-pre-line select-none">
                    {activeCard.back}
                  </p>
                </div>
                <div className="text-center pt-4 border-t border-dashed border-slate-150/40 dark:border-zinc-800/20">
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> read completely • evaluate below
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-180 dark:border-zinc-800 text-slate-600 dark:text-zinc-350 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 font-black text-xs transition-colors cursor-pointer flex-1"
            >
              ← Previous Card
            </button>
            <button
              onClick={handleFlip}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-400 rounded-xl hover:bg-indigo-100/40 dark:hover:bg-indigo-950/50 font-black text-xs transition-colors cursor-pointer flex-1 flex items-center justify-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" /> Flip
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-180 dark:border-zinc-800 text-slate-600 dark:text-zinc-350 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 font-black text-xs transition-colors cursor-pointer flex-1"
            >
              Next Card →
            </button>
          </div>

          {/* Spaced Evaluation Ratings */}
          <div className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-850 p-4 rounded-2xl space-y-2.5">
            <div className="text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pointer-events-none">
              How well did you recall this card's concept?
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateProgress(activeCard.id, "again");
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                  progressMap[activeCard.id] === "again"
                    ? "bg-rose-500/10 border-rose-500/45 text-rose-650 dark:text-rose-400"
                    : "bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-300 hover:bg-rose-500/5"
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Hard (Review)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateProgress(activeCard.id, "good");
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                  progressMap[activeCard.id] === "good"
                    ? "bg-indigo-500/10 border-indigo-500/45 text-indigo-650 dark:text-indigo-400"
                    : "bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-300 hover:bg-indigo-500/5"
                }`}
              >
                <Sparkles className="w-4 h-4 text-indigo-505" />
                <span>Good (Medium)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateProgress(activeCard.id, "easy");
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border flex flex-col items-center justify-center gap-0.5 ${
                  progressMap[activeCard.id] === "easy"
                    ? "bg-emerald-500/10 border-emerald-500/45 text-emerald-650 dark:text-emerald-400"
                    : "bg-white dark:bg-zinc-900 border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-300 hover:bg-emerald-500/5"
                }`}
              >
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Easy (Mastered)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
