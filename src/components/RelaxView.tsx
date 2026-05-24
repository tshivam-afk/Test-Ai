import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Play,
  Pause,
  Activity,
  Headphones,
  Music,
  Wind,
  Info,
  Clock,
  Volume2,
  VolumeX,
  Volume1,
  BookOpen,
  BrainCircuit,
  Heart
} from "lucide-react";

export default function RelaxView() {
  // Sound player state
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);

  // Guided breathing loop state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold Rest">("Inhale");
  const [breathCounter, setBreathCounter] = useState(4); // 4-second cycles

  // Web Audio Context refs for direct offline synthesizer soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // 1. Box Breathing Loop Logic (4-4-4-4 method)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathCounter((prev) => {
          if (prev <= 1) {
            // Next cycle phase switcher
            setBreathingPhase((curr) => {
              switch (curr) {
                case "Inhale":
                  return "Hold";
                case "Hold":
                  return "Exhale";
                case "Exhale":
                  return "Hold Rest";
                case "Hold Rest":
                default:
                  return "Inhale";
              }
            });
            return 4; // Reset to 4-second box cycles
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathingPhase("Inhale");
      setBreathCounter(4);
    }

    return () => clearInterval(timer);
  }, [isBreathing]);

  // Handle direct Web Audio Synthesis of scientific focus beats
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const stopAllSynthLogs = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    setPlayingTrack(null);
  };

  const playBinauralStudyBeats = (frequencyDiff: number, description: string) => {
    stopAllSynthLogs();
    initAudioContext();
    const ctx = audioCtxRef.current!;

    // Create main master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Left channel oscillator (200Hz)
    const oscL = ctx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.value = 200;

    const pannerL = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pannerL) {
      pannerL.pan.value = -1;
      oscL.connect(pannerL);
      pannerL.connect(masterGain);
    } else {
      oscL.connect(masterGain);
    }

    // Right channel oscillator (200 + frequencyDiff)
    const oscR = ctx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.value = 200 + frequencyDiff;

    const pannerR = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (pannerR) {
      pannerR.pan.value = 1;
      oscR.connect(pannerR);
      pannerR.connect(masterGain);
    } else {
      oscR.connect(masterGain);
    }

    oscL.start();
    oscR.start();

    // Store references
    activeSourcesRef.current.push(oscL, oscR);
    if (pannerL) activeSourcesRef.current.push(pannerL);
    if (pannerR) activeSourcesRef.current.push(pannerR);
    setPlayingTrack(description);
  };

  const playBrownianStudyNoise = () => {
    stopAllSynthLogs();
    initAudioContext();
    const ctx = audioCtxRef.current!;

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain booster
    }

    const brownNoiseNode = ctx.createBufferSource();
    brownNoiseNode.buffer = noiseBuffer;
    brownNoiseNode.loop = true;

    // Modulating peaceful filter sweep
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 450;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.28, ctx.currentTime);

    brownNoiseNode.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    brownNoiseNode.start();

    activeSourcesRef.current.push(brownNoiseNode, filter);
    gainNodeRef.current = masterGain;
    setPlayingTrack("NCERT Brown Sleep Noise");
  };

  const playCosmicDronesCap = () => {
    stopAllSynthLogs();
    initAudioContext();
    const ctx = audioCtxRef.current!;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const freqs = [110, 165, 220, 330];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;

      // Filter sweeps to emulate space cosmic drone
      const bpf = ctx.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.Q.value = 1.2;
      bpf.frequency.value = 280;

      osc.connect(bpf);
      bpf.connect(masterGain);
      osc.start();

      activeSourcesRef.current.push(osc, bpf);
    });

    setPlayingTrack("Cosmic Memory Consolidation Drone");
  };

  // Keep volume updated on ref changes
  useEffect(() => {
    if (gainNodeRef.current) {
      const isNoise = playingTrack === "NCERT Brown Sleep Noise";
      gainNodeRef.current.gain.setValueAtTime(volume * (isNoise ? 0.28 : 0.15), audioCtxRef.current?.currentTime || 0);
    }
  }, [volume, playingTrack]);

  // Stop sound if tab unmounts
  useEffect(() => {
    return () => {
      activeSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch {}
      });
    };
  }, []);

  const scientificTracks = [
    {
      id: "alpha-focus",
      title: "10Hz Study Alpha wave",
      tag: "Deep MCQ Study Flow",
      icon: BrainCircuit,
      desc: "Stereo Alpha binaural waves promote cognitive focus, memory retrieval, and NCERT text absorption.",
      action: () => playBinauralStudyBeats(10, "10Hz Study Alpha wave")
    },
    {
      id: "gamma-consolidation",
      title: "40Hz Gamma Integration",
      tag: "Mistake Consolidator",
      icon: Sparkles,
      desc: "Binaural Gamma waves stimulate brain plasticity, helping transfer newly corrected mistakes into long-term memory.",
      action: () => playBinauralStudyBeats(40, "40Hz Gamma Integration")
    },
    {
      id: "brown-noise",
      title: "Acoustic White/Brown Noise",
      tag: "Stress Relief Noise",
      icon: Headphones,
      desc: "Mathematical brownian noise mimics rushing waterfall lines, shutting off distracting noises and visual stress.",
      action: () => playBrownianStudyNoise()
    },
    {
      id: "cosmic-ambient",
      title: "Clinical Delta Space Drone",
      tag: "Stress Relief Sleep/Nap",
      icon: Heart,
      desc: "Ultra-low harmonic cosmic synth drone. Ideal to wind down after intensive 3-hour mock tests.",
      action: () => playCosmicDronesCap()
    }
  ];

  return (
    <div id="relax-zone-root" className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar space-y-5 select-none animate-fade-in">
      {/* Target Title Header */}
      <header id="relax-zone-header">
        <span className="text-[10px] font-extrabold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
          <Wind className="w-3.5 h-3.5 animate-pulse" /> Scientifically Proven Relax Zone
        </span>
        <h2 className="font-extrabold text-2xl text-slate-905 dark:text-zinc-100 tracking-tight">
          Mental Stabilization Room
        </h2>
      </header>

      {/* Box breathing exercise visualizer widget */}
      <div className="bg-gradient-to-br from-indigo-950/95 to-slate-900 text-zinc-100 p-5 rounded-2xl border border-indigo-900/50 space-y-4 shadow-lg text-center relative overflow-hidden">
        {/* Subtle background waves */}
        <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
          <Wind className={`w-36 h-36 ${isBreathing ? "animate-spin" : ""}`} style={{ animationDuration: "16s" }} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400 font-mono">
            Clinical Breath Trainer
          </span>
          <h3 className="font-black text-base text-zinc-50">NCERT stress Box Breathing (4s loops)</h3>
          <p className="text-[10px] text-zinc-400 max-w-[280px]">
            Inhale, hold, exhale, hold rest. Proven to immediately lower heart rate and reset adrenergic test panic.
          </p>
        </div>

        {/* Breathing ring visualizer */}
        <div className="flex flex-col items-center justify-center py-4 relative">
          <div
            className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 select-none ${
              breathingPhase === "Inhale"
                ? "border-emerald-400 bg-emerald-550/15 scale-110"
                : breathingPhase === "Hold"
                ? "border-amber-400 bg-amber-500/15 scale-110 ring-4 ring-amber-400/25"
                : breathingPhase === "Exhale"
                ? "border-indigo-400 bg-indigo-500/10 scale-90"
                : "border-slate-500 bg-slate-500/5 scale-90" // Hold Rest
            }`}
          >
            <span className="text-[10px] font-extrabold text-[#818cf8] tracking-widest uppercase block mb-1">
              {breathingPhase}
            </span>
            <span className="text-3xl font-black font-mono leading-none">
              {breathCounter}s
            </span>
          </div>
        </div>

        {/* Interactive action triggers */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsBreathing(!isBreathing)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
              isBreathing
                ? "bg-rose-500 text-white"
                : "bg-indigo-600 hover:bg-indigo-550 text-white"
            }`}
          >
            {isBreathing ? <Pause className="w-3.8 h-3.8" /> : <Play className="w-3.8 h-3.8" />}
            {isBreathing ? "Pause Breathing" : "Begin Breathe Cycle"}
          </button>
        </div>
      </div>

      {/* Live dynamic synthesis track cards list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 select-none">
          <h4 className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase tracking-wider font-extrabold">
            Medical Binaural Soundscapes (Offline Synth)
          </h4>
          {playingTrack && (
            <button
              onClick={stopAllSynthLogs}
              className="text-[10px] text-[#ef4444] font-black hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <VolumeX className="w-3.5 h-3.5" /> Stop Sound
            </button>
          )}
        </div>

        {/* Dynamic active status text indicator */}
        {playingTrack && (
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-505 animate-bounce" />
              <div className="text-xs">
                <span className="font-semibold text-slate-400 block text-[9px]">Currently Synthesizing</span>
                <span className="font-bold text-slate-800 dark:text-zinc-205">{playingTrack}</span>
              </div>
            </div>

            {/* In-app Volume slide control */}
            <div className="flex items-center gap-1.5 select-none shrink-0 pr-1">
              <Volume1 className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Tracks List Loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {scientificTracks.map((track) => {
            const isCurrent = playingTrack === track.title;
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl transition-all shadow-xs flex flex-col justify-between gap-3.5 ${
                  isCurrent
                    ? "border-emerald-450 ring-1 ring-emerald-500/10 dark:border-emerald-600"
                    : "border-slate-150 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-md"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between select-none leading-none">
                    <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-zinc-805 text-indigo-650 dark:text-indigo-400 font-extrabold font-mono border border-indigo-100 dark:border-zinc-800">
                      {track.tag}
                    </span>
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="font-black text-xs text-slate-800 dark:text-zinc-100">
                    {track.title}
                  </h4>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-505 leading-relaxed font-sans font-medium">
                    {track.desc}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={isCurrent ? stopAllSynthLogs : track.action}
                  className={`py-2 w-full rounded-xl text-xs font-bold leading-none cursor-pointer transition-all flex items-center justify-center gap-1 select-none active:scale-97 ${
                    isCurrent
                      ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-250 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-995/20"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-705 dark:text-zinc-200 border border-slate-200/50 dark:border-zinc-750"
                  }`}
                >
                  {isCurrent ? (
                    <>
                      <Pause className="w-3.5 h-3.5" /> Stop Track
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 text-indigo-500" /> Listen Synth Loop
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scientific Insights informational section */}
      <div className="bg-slate-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-slate-150 dark:border-zinc-850 space-y-3 shadow-xs">
        <h4 className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase tracking-widest font-black flex items-center gap-1 select-none font-mono">
          <Info className="w-3.5 h-3.5" /> High-Yield Cognition Rules
        </h4>

        <div className="text-[11px] text-slate-550 dark:text-zinc-400 space-y-3.5 font-medium leading-relaxed">
          <div className="p-2.5 bg-white dark:bg-zinc-950/50 rounded-xl border border-slate-100 dark:border-zinc-850">
            <h5 className="font-black text-slate-805 dark:text-zinc-200 text-xs mb-1">What are Binaural Beats?</h5>
            <p>
              When your ears hear two slightly different frequencies, your brain perceives a third "phantom frequency" representing the difference. Playing 200Hz and 210Hz waves targets a 10Hz frequency, perfectly matching <strong>Alpha brainwaves</strong> which reduces exam anxiety and increases memory attention span during MCQ sets.
            </p>
          </div>

          <div className="p-2.5 bg-white dark:bg-zinc-950/50 rounded-xl border border-slate-100 dark:border-zinc-850">
            <h5 className="font-black text-slate-805 dark:text-zinc-200 text-xs mb-1">How 40Hz helps memory consolidation?</h5>
            <p>
              40Hz (Gamma frequency oscillations) are neural waves heavily linked with sensory binding, logic correlation, and the creation of long-term memory traces. Listening to gamma oscillations during your <strong>Mistake Gym</strong> helps hardcode corrected solutions into long term memory, eliminating repeated MCQ trap-falling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
