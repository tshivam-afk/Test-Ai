import { useState, useEffect } from "react";
import { CheckCircle, Sparkles, BookOpen, Trash2, Copy, Plus, AlertCircle, RefreshCw } from "lucide-react";

interface MnemonicItem {
  id: string;
  subject: "Botany" | "Zoology" | "Physics" | "Chemistry" | "Custom";
  topicTitle: string;
  mnemonic: string;
  phrase: string;
  mapping: { key: string; standsFor: string }[];
  explanation: string;
  isCurated?: boolean;
}

const CURATED_MNEMONICS: MnemonicItem[] = [
  // Botany
  {
    id: "cur-b1",
    subject: "Botany",
    topicTitle: "NCERT Taxonomic Hierarchy Order",
    mnemonic: "K P C O F G S",
    phrase: "Keep Ponds Clean Or Frogs Get Sick",
    mapping: [
      { key: "Keep", standsFor: "Kingdom" },
      { key: "Ponds", standsFor: "Phylum (or Division)" },
      { key: "Clean", standsFor: "Class" },
      { key: "Or", standsFor: "Order" },
      { key: "Frogs", standsFor: "Family" },
      { key: "Get", standsFor: "Genus" },
      { key: "Sick", standsFor: "Species" }
    ],
    explanation: "Standard taxonomical classification levels of organisms, ordered from highest divergence to highest specificity.",
    isCurated: true
  },
  {
    id: "cur-b2",
    subject: "Botany",
    topicTitle: "Stages of Cell Division (Mitosis)",
    mnemonic: "I P M A T",
    phrase: "I Propose Men Are Tall",
    mapping: [
      { key: "I", standsFor: "Interphase (prep phase)" },
      { key: "Propose", standsFor: "Prophase (chromatin condenses)" },
      { key: "Men", standsFor: "Metaphase (alignment at plate)" },
      { key: "Are", standsFor: "Anaphase (chromatid separation)" },
      { key: "Tall", standsFor: "Telophase (nuclear re-formation)" }
    ],
    explanation: "The precise physiological chronological order of nuclear division phases in somatic plant and animal cell replication.",
    isCurated: true
  },
  {
    id: "cur-b3",
    subject: "Botany",
    topicTitle: "Major Plant Growth Regulators (Hormones)",
    mnemonic: "A G C E A",
    phrase: "All Giants Can Eat Apples",
    mapping: [
      { key: "All", standsFor: "Auxins (apical dominance & rooting)" },
      { key: "Giants", standsFor: "Gibberellins (stem elongation)" },
      { key: "Can", standsFor: "Cytokinins (cell division)" },
      { key: "Eat", standsFor: "Ethylene (fruit ripening gaseous)" },
      { key: "Apples", standsFor: "Abscisic Acid (stress hormone & dormacy)" }
    ],
    explanation: "Primary phytohormones responsible for coordinate signaling of cell division, elongation, and fruit ripening.",
    isCurated: true
  },
  // Zoology
  {
    id: "cur-z1",
    subject: "Zoology",
    topicTitle: "Ten Essential Amino Acids",
    mnemonic: "P V T   T I M   H A L L",
    phrase: "Private Tim Hall",
    mapping: [
      { key: "P", standsFor: "Phenylalanine" },
      { key: "V", standsFor: "Valine" },
      { key: "T", standsFor: "Threonine" },
      { key: "T", standsFor: "Tryptophan" },
      { key: "I", standsFor: "Isoleucine" },
      { key: "M", standsFor: "Methionine" },
      { key: "H", standsFor: "Histidine" },
      { key: "A", standsFor: "Arginine" },
      { key: "L", standsFor: "Leucine" },
      { key: "L", standsFor: "Lysine" }
    ],
    explanation: "Amino acids that cannot be synthesized endogenously by humans and must be supplied directly in dietary intake.",
    isCurated: true
  },
  {
    id: "cur-z2",
    subject: "Zoology",
    topicTitle: "Immunoglobulin (Antibody) Abundance",
    mnemonic: "M A D G E",
    phrase: "MADGE protects the fortress",
    mapping: [
      { key: "M", standsFor: "IgM (Pentameric, primary response)" },
      { key: "A", standsFor: "IgA (Dimeric, found in secretions & colostrum)" },
      { key: "D", standsFor: "IgD (B-cell receptor activation helper)" },
      { key: "G", standsFor: "IgG (Most abundant, crosses placenta barrier)" },
      { key: "E", standsFor: "IgE (Monomeric, triggers histamine in allergen response)" }
    ],
    explanation: "Order of classes of immunoglobulins secreted by mature plasma cells, involved in humoral defense.",
    isCurated: true
  },
  // Physics
  {
    id: "cur-p1",
    subject: "Physics",
    topicTitle: "Electromagnetic Spectrum (Decreasing wavelength)",
    mnemonic: "R M I V U X G",
    phrase: "Rich Men In Venus Use X-ray Goggles",
    mapping: [
      { key: "Rich", standsFor: "Radio waves (longest λ)" },
      { key: "Men", standsFor: "Microwaves" },
      { key: "In", standsFor: "Infrared radiation" },
      { key: "Venus", standsFor: "Visible spectrum (VIBGYOR)" },
      { key: "Use", standsFor: "Ultraviolet rays" },
      { key: "X-ray", standsFor: "X-radiation" },
      { key: "Goggles", standsFor: "Gamma rays (shortest λ & highest energy)" }
    ],
    explanation: "Standard sorting of electrical waves. Remember, high wavelength means low frequency. Wavelength scales inversely with energy.",
    isCurated: true
  },
  {
    id: "cur-p2",
    subject: "Physics",
    topicTitle: "Thermodynamic State Coordinates",
    mnemonic: "T V P S",
    phrase: "TV Programs Superb",
    mapping: [
      { key: "T", standsFor: "Temperature (Kelvins)" },
      { key: "V", standsFor: "Volume (cubic meters)" },
      { key: "P", standsFor: "Pressure (Pascals)" },
      { key: "S", standsFor: "Entropy (Joules per Kelvin)" }
    ],
    explanation: "Core physical variables required to express the thermostatic state or work of an ideal thermodynamic gas system.",
    isCurated: true
  },
  // Chemistry
  {
    id: "cur-c1",
    subject: "Chemistry",
    topicTitle: "Redox Electron Chemistry Transfers",
    mnemonic: "O I L   R I G",
    phrase: "Oxidation Is Loss, Reduction Is Gain",
    mapping: [
      { key: "Oxidation", standsFor: "Oxidation state increase" },
      { key: "Is", standsFor: "Constitutes" },
      { key: "Loss", standsFor: "Loss of electrons" },
      { key: "Reduction", standsFor: "Oxidation state decrease" },
      { key: "Is", standsFor: "Constitutes" },
      { key: "Gain", standsFor: "Gain of electrons" }
    ],
    explanation: "A simple classic acronym mapping electrochemical cell electron pathways during active electrolysis.",
    isCurated: true
  },
  {
    id: "cur-c2",
    subject: "Chemistry",
    topicTitle: "Diatomic Elements in Elemental State",
    mnemonic: "H N F O I Cl Br",
    phrase: "Have No Fear Of Ice Cold Beer",
    mapping: [
      { key: "Have", standsFor: "Hydrogen (H₂)" },
      { key: "No", standsFor: "Nitrogen (N₂)" },
      { key: "Fear", standsFor: "Fluorine (F₂)" },
      { key: "Of", standsFor: "Oxygen (O₂)" },
      { key: "Ice", standsFor: "Iodine (I₂)" },
      { key: "Cold", standsFor: "Chlorine (Cl₂)" },
      { key: "Beer", standsFor: "Bromine (Br₂)" }
    ],
    explanation: "Elements that exist naturally as covalent gas dimers rather than single atomic states under standard temperature and pressure.",
    isCurated: true
  }
];

export default function MnemonicVault() {
  const [activeTab, setActiveTab] = useState<"All" | "Botany" | "Zoology" | "Physics" | "Chemistry" | "Custom">("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customList, setCustomList] = useState<MnemonicItem[]>([]);
  
  // AI Generator local inputs
  const [aiSubject, setAiSubject] = useState<"Botany" | "Zoology" | "Physics" | "Chemistry">("Botany");
  const [aiTopicInput, setAiTopicInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load and save custom mnemonics from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("practice_companion_custom_mnemonics_v1");
      if (stored) {
        setCustomList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed loading custom mnemonics", e);
    }
  }, []);

  const saveCustomList = (updated: MnemonicItem[]) => {
    setCustomList(updated);
    try {
      localStorage.setItem("practice_companion_custom_mnemonics_v1", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    
    // Play light check feedback sound
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  // call server-side Gemini API
  const handleGenerateMnemonic = async () => {
    if (!aiTopicInput.trim()) {
      setErrorMessage("Please describe what concept or sequence of terms you want to memorize.");
      return;
    }
    setErrorMessage(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-mnemonic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: aiSubject, topic: aiTopicInput })
      });

      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || "Failed to trigger Gemini Mnemonic builder.");
      }

      const generatedData = body.data;
      const newItem: MnemonicItem = {
        id: `custom-${Date.now()}`,
        subject: aiSubject,
        topicTitle: generatedData.topicTitle || aiTopicInput,
        mnemonic: generatedData.mnemonic || "(No raw letters)",
        phrase: generatedData.phrase || "(No mnemonic phrase)",
        mapping: generatedData.mapping || [],
        explanation: generatedData.explanation || "",
        isCurated: false
      };

      saveCustomList([newItem, ...customList]);
      setAiTopicInput("");
      
      // Toggle to standard view
      setActiveTab("Custom");
      
      // Play high pitch success beep
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      } catch {}

    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during API synthesis.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCustom = (id: string) => {
    const nextList = customList.filter(item => item.id !== id);
    saveCustomList(nextList);
  };

  const allMnemonics = [...CURATED_MNEMONICS, ...customList];

  const filteredMnemonics = allMnemonics.filter(item => {
    if (activeTab === "All") return true;
    if (activeTab === "Custom") return !item.isCurated;
    return item.subject === activeTab;
  });

  return (
    <div className="space-y-4 animate-scale-in">
      {/* Visual Header / AI generator box panel */}
      <div className="bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-850 p-3.5 rounded-2xl shadow-xs space-y-3.5">
        <div className="flex gap-2 items-center">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              Gemini AI Academic Mnemonic Coach
            </h3>
            <p className="text-[10.5px] text-slate-450 dark:text-zinc-400 mt-0.5">
              Transform tricky sequences or long terminology steps into simple sentences instantly.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          {/* Subject Switch */}
          <div className="col-span-1">
            <select
              value={aiSubject}
              onChange={(e) => setAiSubject(e.target.value as any)}
              className="w-full text-xs font-bold bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-2.5 py-2.5 text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-550"
            >
              <option value="Botany">🌱 Botany</option>
              <option value="Zoology">🐾 Zoology</option>
              <option value="Physics">⚡ Physics</option>
              <option value="Chemistry">🧪 Chemistry</option>
            </select>
          </div>

          {/* Topic input */}
          <div className="col-span-1 md:col-span-2">
            <input
              type="text"
              placeholder="e.g. Alkali elements: Li, Na, K, Rb, Cs, Fr"
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              className="w-full text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:border-indigo-550"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGenerateMnemonic();
              }}
            />
          </div>

          <div className="col-span-1">
            <button
              onClick={handleGenerateMnemonic}
              disabled={isGenerating}
              className="w-full cursor-pointer bg-indigo-600 hover:bg-indigo-650 disabled:bg-slate-300 dark:disabled:bg-zinc-800 py-2.5 rounded-xl text-xs font-black text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Forge Mnemonic</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 bg-rose-500/10 border border-rose-500/15 rounded-xl text-rose-600 dark:text-rose-455 text-[10.5px] font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Tabs list controls */}
      <div className="flex items-center flex-wrap gap-1.5 border-b border-dashed border-slate-200 dark:border-zinc-850 pb-3">
        {(["All", "Botany", "Zoology", "Physics", "Chemistry", "Custom"] as const).map((sub) => {
          const count = allMnemonics.filter(m => {
            if (sub === "All") return true;
            if (sub === "Custom") return !m.isCurated;
            return m.subject === sub;
          }).length;

          return (
            <button
              key={sub}
              onClick={() => setActiveTab(sub)}
              className={`px-3 py-1.2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === sub
                  ? "bg-indigo-650 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-850 text-slate-600 dark:text-zinc-350 hover:bg-slate-200/50 dark:hover:bg-zinc-850"
              }`}
            >
              {sub} ({count})
            </button>
          );
        })}
      </div>

      {/* List items dashboard */}
      <div className="grid grid-cols-1 gap-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
        {filteredMnemonics.length === 0 ? (
          <div className="text-center py-8 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150 dark:border-zinc-850 rounded-2xl">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-450 dark:text-zinc-500 mt-2">
              No mnemonics found for this category.
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Use the Gemini memory coach above to craft some!
            </p>
          </div>
        ) : (
          filteredMnemonics.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#121214] border border-slate-150 dark:border-zinc-850 p-3.5 rounded-2xl space-y-2.5 shadow-xs hover:border-slate-300 dark:hover:border-zinc-750 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap select-none">
                  <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-md ${
                    item.subject === "Botany"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-450"
                      : item.subject === "Zoology"
                      ? "bg-teal-500/10 text-teal-600 dark:text-teal-450"
                      : item.subject === "Physics"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-450"
                      : item.subject === "Chemistry"
                      ? "bg-indigo-500/10 text-indigo-650 dark:text-indigo-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-450"
                  }`}>
                    {item.subject.toUpperCase()}
                  </span>
                  {item.isCurated ? (
                    <span className="text-[8.5px] font-bold px-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-md">
                      Curated NEET Core
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-bold px-1.5 bg-indigo-500/10 text-indigo-500 rounded-md flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> Client AI Notebook
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(item.id, item.phrase)}
                    className="text-slate-405 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Copy phrase to clipboard"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {!item.isCurated && (
                    <button
                      onClick={() => handleDeleteCustom(item.id)}
                      className="text-slate-405 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Title & phrase */}
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-150">
                  {item.topicTitle}
                </h4>
                <div className="text-[10px] font-mono font-bold text-slate-450 dark:text-zinc-450 mt-0.5">
                  Index key to lock: <strong className="text-indigo-600 dark:text-indigo-400 select-all">{item.mnemonic}</strong>
                </div>
              </div>

              {/* Catchy Phrase sentence */}
              <div className="bg-slate-50 dark:bg-zinc-950/30 border border-slate-150/60 dark:border-zinc-850 p-2.5 rounded-xl">
                <span className="text-[8px] uppercase tracking-wider text-slate-400 font-extrabold block">Memory Anchor Sentence</span>
                <p className="text-[13px] font-black italic text-slate-850 dark:text-zinc-200 leading-normal mt-0.5">
                  "{item.phrase}"
                </p>
              </div>

              {/* Grid Mapping mapping list */}
              {item.mapping && item.mapping.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-extrabold block">Symbol Decode Blueprint</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {item.mapping.map((map, index) => (
                      <div
                        key={index}
                        className="p-1.5 bg-slate-50/50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-lg flex flex-col md:flex-row md:items-center gap-1 select-none"
                      >
                        <strong className="text-[11px] font-black text-indigo-605 dark:text-indigo-400 shrink-0 md:border-r md:border-slate-205 md:pr-1.5">
                          {map.key}
                        </strong>
                        <span className="text-[10px] text-slate-655 dark:text-zinc-350 font-semibold leading-tight truncate" title={map.standsFor}>
                          {map.standsFor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation field */}
              {item.explanation && (
                <div className="border-t border-dashed border-slate-150 dark:border-zinc-850 pt-2 text-[10px] text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {item.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
