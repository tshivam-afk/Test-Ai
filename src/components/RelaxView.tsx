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
  Heart,
  Moon,
  Compass,
  Smile,
  Flame,
  CloudRain,
  Waves,
  Trash,
  Timer,
  Bell
} from "lucide-react";

interface MixerChannel {
  id: string;
  name: string;
  emoji: string;
  volume: number;
  playing: boolean;
  desc: string;
}

const ZenScribbleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const strokesRef = useRef<{ points: { x: number; y: number }[]; alpha: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle resize safely
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width = rect?.width || 320;
      canvas.height = 180;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background subtle texture
      ctx.fillStyle = "rgba(99, 102, 241, 0.02)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw helper zen grid lines
      ctx.strokeStyle = "rgba(99, 102, 241, 0.04)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(99, 102, 241, 0.65)";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw and decay strokes
      strokesRef.current.forEach((stroke) => {
        if (stroke.alpha <= 0) return;
        ctx.strokeStyle = `rgba(99, 102, 241, ${stroke.alpha * 0.75})`;
        ctx.lineWidth = 3.5 * stroke.alpha;
        
        ctx.beginPath();
        stroke.points.forEach((pt, pIdx) => {
          if (pIdx === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        });
        ctx.stroke();

        // Smooth decay fade speed
        stroke.alpha -= 0.007; // Fades out fully in ~2-3 seconds
      });

      // Filter out fully faded strokes
      strokesRef.current = strokesRef.current.filter((s) => s.alpha > 0);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    lastPos.current = pos;
    setIsDrawing(true);

    strokesRef.current.push({
      points: [pos],
      alpha: 1.0,
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    lastPos.current = pos;

    const currentStroke = strokesRef.current[strokesRef.current.length - 1];
    if (currentStroke) {
      currentStroke.points.push(pos);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  return (
    <div className="space-y-2 mt-4 select-none">
      <div className="flex items-center justify-between px-1 pointer-events-none">
        <span className="text-[10px] text-indigo-500 font-extrabold uppercase tracking-wide flex items-center gap-1">
          🌌 Zen Water Scribble Board
        </span>
        <span className="text-[9px] text-slate-400 font-medium">Strokes slowly dissolve into thin air</span>
      </div>
      <div className="relative border border-slate-150 dark:border-zinc-850 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-zinc-950/20 touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[180px] cursor-crosshair block"
        />
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-450 dark:text-zinc-500 pointer-events-none text-center font-bold bg-white/80 dark:bg-zinc-900/80 px-2.5 py-0.5 rounded-lg border border-slate-100 dark:border-zinc-850">
          Doodle or write anxious thoughts here to let them fade
        </div>
      </div>
    </div>
  );
};

export default function RelaxView() {
  // Active primary tab
  const [activeTab, setActiveTab] = useState<"soundscapes" | "mixer" | "breathing" | "poppers" | "vaporizer" | "timer">("soundscapes");

  // General audio states
  const [volume, setVolume] = useState(0.5);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);

  // Mixer channels state
  const [channels, setChannels] = useState<MixerChannel[]>([
    { id: "rain", name: "Focus Ambient Rain", emoji: "🌧️", volume: 0.5, playing: false, desc: "Synthesized rain noise with organic bandpass warmth" },
    { id: "fire", name: "Campfire Crackle", emoji: "🔥", volume: 0.5, playing: false, desc: "Deep dry logs wood-hiss with randomized clinical ember sparks" },
    { id: "ocean", name: "Ocean Tide Waves", emoji: "🌊", volume: 0.5, playing: false, desc: "Solfeggio-infused ocean swells modulated by slow lowpass LFOs" },
    { id: "bells", name: "Zen Wind Bells", emoji: "🎐", volume: 0.5, playing: false, desc: "Procedural pentatonic chimes looping soft note triggers" },
    { id: "forest", name: "Forest Birdsong", emoji: "🌳", volume: 0.5, playing: false, desc: "Gentle leaf whispers with organic procedural songbird chips" },
    { id: "binaural", name: "16Hz Beta Focus Beats", emoji: "🧠", volume: 0.5, playing: false, desc: "Binaural frequency to boost logic processing and exam speed focus" },
    { id: "solfeggio", name: "528Hz Solfeggio Repair", emoji: "✨", volume: 0.5, playing: false, desc: "The restorative frequency to lower physical stress and adrenaline" },
    { id: "wind", name: "Leaf Zephyr Wind", emoji: "🍃", volume: 0.5, playing: false, desc: "Organic mountain wind sweeping slowly through branch leaves" },
  ]);

  // Guided breathing loop state
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold Rest">("Inhale");
  const [breathCounter, setBreathCounter] = useState(4); // 4-second cycles

  // Fidget Sensory poppers grid state
  const [poppedBubbles, setPoppedBubbles] = useState<boolean[]>(Array(16).fill(false));
  const [totalPopsCount, setTotalPopsCount] = useState(0);

  // Stress Vaporizer vent box state
  const [stressText, setStressText] = useState("");
  const [vaporizing, setVaporizing] = useState(false);
  const [vaporizedSuccess, setVaporizedSuccess] = useState(false);
  const [supportiveAffirmation, setSupportiveAffirmation] = useState("");

  // Power Recovery Nap Timer states
  const [napMinutes, setNapMinutes] = useState(10);
  const [napRunning, setNapRunning] = useState(false);
  const [napSecondsLeft, setNapSecondsLeft] = useState(0);
  const [napDone, setNapDone] = useState(false);

  // Web Audio Context refs for direct offline synthesizer soundscapes
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Audio sources refs for standard presets
  const activeSourcesRef = useRef<any[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Mixer Specific Audio refs
  const channelGainsRef = useRef<Record<string, GainNode>>({});
  const channelSourcesRef = useRef<Record<string, any[]>>({});
  const channelTimersRef = useRef<Record<string, any>>({});

  // Guided breathing loops scheduler
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathing) {
      timer = setInterval(() => {
        setBreathCounter((prev) => {
          if (prev <= 1) {
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
            return 4;
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

  // Power Nap Timer Decrement loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (napRunning && napSecondsLeft > 0) {
      timer = setInterval(() => {
        setNapSecondsLeft((prev) => {
          if (prev <= 1) {
            setNapRunning(false);
            setNapDone(true);
            playCelestialAwakeningChime();
            // Automatically stop any drone sound
            stopAllSynthLogs();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [napRunning, napSecondsLeft]);

  // Initialize browser Web Audio Context
  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtxClass();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  // Stop clean any preset synths
  const stopAllSynthLogs = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch {}
    });
    activeSourcesRef.current = [];
    setPlayingTrack(null);
  };

  // Play binaural waves
  const playBinauralStudyBeats = (frequencyDiff: number, description: string) => {
    stopAllSynthLogs();
    // Also disconnect mixer channels to prevent overlay confusion
    channels.forEach(ch => {
      if (ch.playing) stopChannelAudio(ch.id);
    });
    setChannels(prev => prev.map(c => ({ ...c, playing: false })));

    initAudioContext();
    const ctx = audioCtxRef.current!;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.15, ctx.currentTime);
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    // Left oscillator (200Hz)
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

    // Right oscillator (200 + freqDiff)
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

    activeSourcesRef.current.push(oscL, oscR);
    if (pannerL) activeSourcesRef.current.push(pannerL);
    if (pannerR) activeSourcesRef.current.push(pannerR);
    setPlayingTrack(description);
  };

  // Play Brown noise preset
  const playBrownianStudyNoise = () => {
    stopAllSynthLogs();
    channels.forEach(ch => {
      if (ch.playing) stopChannelAudio(ch.id);
    });
    setChannels(prev => prev.map(c => ({ ...c, playing: false })));

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
      output[i] *= 3.5;
    }

    const brownNoiseNode = ctx.createBufferSource();
    brownNoiseNode.buffer = noiseBuffer;
    brownNoiseNode.loop = true;

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

  // Play delta space drone preset
  const playCosmicDronesCap = () => {
    stopAllSynthLogs();
    channels.forEach(ch => {
      if (ch.playing) stopChannelAudio(ch.id);
    });
    setChannels(prev => prev.map(c => ({ ...c, playing: false })));

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

  // Synchronous volume preset updates
  useEffect(() => {
    if (gainNodeRef.current) {
      const isNoise = playingTrack === "NCERT Brown Sleep Noise";
      gainNodeRef.current.gain.setValueAtTime(volume * (isNoise ? 0.28 : 0.15), audioCtxRef.current?.currentTime || 0);
    }
  }, [volume, playingTrack]);

  // -------------------------------------------------------------------------
  // MEDATIVE MIXER LOGIC
  // -------------------------------------------------------------------------
  const toggleChannel = (channelId: string) => {
    initAudioContext();
    const ctx = audioCtxRef.current!;
    
    // Deactivate standard presets to prevent sound stacking clicks
    if (playingTrack) {
      stopAllSynthLogs();
    }

    const chanIndex = channels.findIndex(c => c.id === channelId);
    if (chanIndex === -1) return;
    const channel = channels[chanIndex];
    const isNowPlaying = !channel.playing;

    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, playing: isNowPlaying } : c));

    if (!isNowPlaying) {
      stopChannelAudio(channelId);
      return;
    }

    // Set up Gain control channel
    const channelGain = ctx.createGain();
    channelGain.gain.setValueAtTime(channel.volume * 0.16, ctx.currentTime);
    channelGain.connect(ctx.destination);
    channelGainsRef.current[channelId] = channelGain;
    channelSourcesRef.current[channelId] = [];

    if (channelId === "rain") {
      // Pink/White noise rain filter
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 650;
      filter.Q.value = 1.2;

      source.connect(filter);
      filter.connect(channelGain);
      source.start();

      channelSourcesRef.current[channelId].push(source, filter);

    } else if (channelId === "ocean") {
      // Modulated brown noise
      const bufferSize = ctx.sampleRate * 2.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.025 * white)) / 1.025;
        lastOut = output[i];
        output[i] *= 3.8;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 280;

      source.connect(filter);
      filter.connect(channelGain);
      source.start();

      channelSourcesRef.current[channelId].push(source, filter);

      // Low frequency wave oscillator emulation
      let waveState = 0;
      const interval = setInterval(() => {
        try {
          if (filter && ctx.state !== "closed") {
            waveState += 0.05;
            const targetFreq = 220 + Math.sin(waveState) * 160; // swell between 60hz and 380hz
            filter.frequency.setValueAtTime(targetFreq, ctx.currentTime);
          }
        } catch {}
      }, 70);
      channelTimersRef.current[channelId] = interval;

    } else if (channelId === "fire") {
      // 1. Low combustion wood rumble (brown noise)
      const bufferSize = ctx.sampleRate * 2.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.015 * white)) / 1.015;
        lastOut = output[i];
        output[i] *= 1.4;
      }
      const sourceRumble = ctx.createBufferSource();
      sourceRumble.buffer = noiseBuffer;
      sourceRumble.loop = true;
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = "lowpass";
      lowFilter.frequency.value = 110;
      sourceRumble.connect(lowFilter);
      lowFilter.connect(channelGain);
      sourceRumble.start();
      channelSourcesRef.current[channelId].push(sourceRumble, lowFilter);

      // 2. Hot-gases sap hiss (bandpass white noise at 3.3kHz for continuous sizzling organic depth)
      const hissBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const hissData = hissBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        hissData[i] = (Math.random() * 2 - 1) * 0.035;
      }
      const sourceHiss = ctx.createBufferSource();
      sourceHiss.buffer = hissBuffer;
      sourceHiss.loop = true;
      const hissFilter = ctx.createBiquadFilter();
      hissFilter.type = "bandpass";
      hissFilter.frequency.value = 3300;
      hissFilter.Q.value = 1.3;
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.3, ctx.currentTime);
      sourceHiss.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(channelGain);
      sourceHiss.start();
      channelSourcesRef.current[channelId].push(sourceHiss, hissFilter, hissGain);

      // 3. Dry ember wood micro-crackles loop
      const interval = setInterval(() => {
        try {
          if (ctx.state === "closed") return;
          
          // Tiny frequent crackle pops
          if (Math.random() > 0.32) {
            const crackleOsc = ctx.createOscillator();
            const crackleGain = ctx.createGain();
            const crackleFilter = ctx.createBiquadFilter();
            
            crackleOsc.type = "triangle";
            crackleOsc.frequency.setValueAtTime(1800 + Math.random() * 5500, ctx.currentTime);
            
            crackleFilter.type = "highpass";
            crackleFilter.frequency.setValueAtTime(1500, ctx.currentTime);
            
            crackleGain.gain.setValueAtTime(0.15 + Math.random() * 0.45, ctx.currentTime);
            crackleGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.003 + Math.random() * 0.007);
            
            crackleOsc.connect(crackleFilter);
            crackleFilter.connect(crackleGain);
            crackleGain.connect(channelGain);
            
            crackleOsc.start();
            crackleOsc.stop(ctx.currentTime + 0.015);
          }

          // Louder exploding sap snaps (simulating dry timber splits)
          if (Math.random() > 0.88) {
            const snapBuffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.08), ctx.sampleRate);
            const snapData = snapBuffer.getChannelData(0);
            for (let i = 0; i < snapBuffer.length; i++) {
              snapData[i] = (Math.random() * 2 - 1) * Math.exp(-i / 140);
            }
            const snapSource = ctx.createBufferSource();
            snapSource.buffer = snapBuffer;
            const snapFilter = ctx.createBiquadFilter();
            snapFilter.type = "bandpass";
            snapFilter.frequency.value = 900 + Math.random() * 2300;
            const snapGain = ctx.createGain();
            snapGain.gain.setValueAtTime(0.65 + Math.random() * 0.8, ctx.currentTime);
            snapSource.connect(snapFilter);
            snapFilter.connect(snapGain);
            snapGain.connect(channelGain);
            snapSource.start();
          }
        } catch {}
      }, 100);
      channelTimersRef.current[channelId] = interval;

    } else if (channelId === "bells") {
      // Procedural Major Pentatonic Wind chimes schedule
      const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00]; // Key of C
      const interval = setInterval(() => {
        try {
          if (Math.random() > 0.35) {
            const freq = pentatonicNotes[Math.floor(Math.random() * pentatonicNotes.length)];
            const osc = ctx.createOscillator();
            const bellGain = ctx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            // Rich harmonic triangle note overlays
            const harmonic = ctx.createOscillator();
            harmonic.type = "triangle";
            harmonic.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);
            const harmonicGain = ctx.createGain();
            
            bellGain.gain.setValueAtTime(0, ctx.currentTime);
            bellGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.03);
            bellGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

            harmonicGain.gain.setValueAtTime(0, ctx.currentTime);
            harmonicGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.03);
            harmonicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
            
            const lowpass = ctx.createBiquadFilter();
            lowpass.type = "lowpass";
            lowpass.frequency.setValueAtTime(1400, ctx.currentTime);

            osc.connect(bellGain);
            harmonic.connect(harmonicGain);
            
            bellGain.connect(lowpass);
            harmonicGain.connect(lowpass);
            
            lowpass.connect(channelGain);
            
            osc.start();
            harmonic.start();
            
            osc.stop(ctx.currentTime + 3.0);
            harmonic.stop(ctx.currentTime + 3.0);
          }
        } catch {}
      }, 1800);
      channelTimersRef.current[channelId] = interval;

    } else if (channelId === "forest") {
      // Gentle leaf whispers (brown noise with a 600Hz center bandpass sweep)
      const bufferSize = ctx.sampleRate * 3.0;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.012 * white)) / 1.012;
        lastOut = output[i];
        output[i] *= 1.2;
      }
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 550;
      filter.Q.value = 0.5;
      source.connect(filter);
      filter.connect(channelGain);
      source.start();
      channelSourcesRef.current[channelId].push(source, filter);

      // Periodic birdsong songbird synthesis (sines sweeping from high to low)
      const interval = setInterval(() => {
        try {
          if (ctx.state === "closed" || Math.random() > 0.4) return;
          
          let now = ctx.currentTime;
          // Play a series of 2-3 brief melodious songbird chirps
          const notesCount = 2 + Math.floor(Math.random() * 2);
          for (let k = 0; k < notesCount; k++) {
            const delay = k * 0.18;
            const osc = ctx.createOscillator();
            const birdGain = ctx.createGain();
            
            osc.type = "sine";
            const startFreq = 2800 + Math.random() * 1200;
            osc.frequency.setValueAtTime(startFreq, now + delay);
            osc.frequency.exponentialRampToValueAtTime(startFreq - 800, now + delay + 0.08);

            birdGain.gain.setValueAtTime(0, now + delay);
            birdGain.gain.linearRampToValueAtTime(0.08, now + delay + 0.015);
            birdGain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.11);

            osc.connect(birdGain);
            birdGain.connect(channelGain);
            osc.start(now + delay);
            osc.stop(now + delay + 0.15);
          }
        } catch {}
      }, 4000);
      channelTimersRef.current[channelId] = interval;

    } else if (channelId === "binaural") {
      // 16Hz Beta waves focused logical beat: Left 150Hz, Right 166Hz
      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const bGainL = ctx.createGain();
      const bGainR = ctx.createGain();

      oscL.type = "sine";
      oscL.frequency.setValueAtTime(150, ctx.currentTime);
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(166, ctx.currentTime);

      bGainL.gain.setValueAtTime(0.5, ctx.currentTime);
      bGainR.gain.setValueAtTime(0.5, ctx.currentTime);

      if (ctx.createStereoPanner) {
        const panL = ctx.createStereoPanner();
        panL.pan.value = -1;
        const panR = ctx.createStereoPanner();
        panR.pan.value = 1;
        
        oscL.connect(panL);
        panL.connect(bGainL);
        oscR.connect(panR);
        panR.connect(bGainR);
      } else {
        oscL.connect(bGainL);
        oscR.connect(bGainR);
      }

      bGainL.connect(channelGain);
      bGainR.connect(channelGain);

      oscL.start();
      oscR.start();

      channelSourcesRef.current[channelId].push(oscL, oscR, bGainL, bGainR);

    } else if (channelId === "solfeggio") {
      // Transformational pure Solfeggio 528Hz crystal resonance
      const oscCore = ctx.createOscillator();
      const oscHarmonic = ctx.createOscillator();
      const sGainCore = ctx.createGain();
      const sGainHarm = ctx.createGain();

      oscCore.type = "sine";
      oscCore.frequency.value = 528; // Transmutational Core Frequency

      oscHarmonic.type = "sine";
      oscHarmonic.frequency.value = 528 * 1.5; // Natural Fifth (792Hz) for pristine acoustic aura

      sGainCore.gain.setValueAtTime(0.7, ctx.currentTime);
      sGainHarm.gain.setValueAtTime(0.18, ctx.currentTime);

      // Low frequency wave sweep LFO for breathing volume swell effect
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 0.08; // 12 seconds per cycle
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.35;

      lfo.connect(lfoGain);
      lfoGain.connect(sGainCore.gain); // Modulates volume organically

      oscCore.connect(sGainCore);
      oscHarmonic.connect(sGainHarm);
      sGainCore.connect(channelGain);
      sGainHarm.connect(channelGain);

      oscCore.start();
      oscHarmonic.start();
      lfo.start();

      channelSourcesRef.current[channelId].push(oscCore, oscHarmonic, sGainCore, sGainHarm, lfo, lfoGain);

    } else if (channelId === "wind") {
      // White noise swept through lowpass with varying center frequency (Leaf branches zephyr)
      const bufferSize = ctx.sampleRate * 2.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 450;
      filter.Q.value = 0.8;

      source.connect(filter);
      filter.connect(channelGain);
      source.start();
      channelSourcesRef.current[channelId].push(source, filter);

      // Organic wind sweeping intervals
      let windState = 0;
      const interval = setInterval(() => {
        try {
          if (filter && ctx.state !== "closed") {
            windState += 0.035;
            const targetFreq = 420 + Math.cos(windState) * 190 + Math.sin(windState * 0.4) * 80;
            filter.frequency.setValueAtTime(targetFreq, ctx.currentTime);
          }
        } catch {}
      }, 80);
      channelTimersRef.current[channelId] = interval;
    }
  };

  const stopChannelAudio = (channelId: string) => {
    if (channelTimersRef.current[channelId]) {
      clearInterval(channelTimersRef.current[channelId]);
      delete channelTimersRef.current[channelId];
    }
    if (channelSourcesRef.current[channelId]) {
      channelSourcesRef.current[channelId].forEach((src: any) => {
        try {
          src.stop();
        } catch {}
      });
      delete channelSourcesRef.current[channelId];
    }
    if (channelGainsRef.current[channelId]) {
      try {
        channelGainsRef.current[channelId].disconnect();
      } catch {}
      delete channelGainsRef.current[channelId];
    }
  };

  const handleChannelVolumeChange = (channelId: string, value: number) => {
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, volume: value } : c));
    if (channelGainsRef.current[channelId] && audioCtxRef.current) {
      try {
        channelGainsRef.current[channelId].gain.setValueAtTime(value * 0.16, audioCtxRef.current.currentTime);
      } catch {}
    }
  };

  // Turn off all playing channles
  const stopAllMixerChannels = () => {
    channels.forEach((ch) => {
      if (ch.playing) stopChannelAudio(ch.id);
    });
    setChannels(prev => prev.map(c => ({ ...c, playing: false })));
  };

  // Clean unmount audio lifecycle
  useEffect(() => {
    return () => {
      // Clean standard presets
      activeSourcesRef.current.forEach((src) => {
        try {
          src.stop();
        } catch {}
      });
      // Clean mixer channles
      ["rain", "fire", "ocean", "bells"].forEach((ch) => {
        if (channelTimersRef.current[ch]) clearInterval(channelTimersRef.current[ch]);
        if (channelSourcesRef.current[ch]) {
          channelSourcesRef.current[ch].forEach((src: any) => {
            try { src.stop(); } catch {}
          });
        }
      });
    };
  }, []);

  // -------------------------------------------------------------------------
  // COGNITIVE POPPERS FIDGET SOUND SYNTH
  // -------------------------------------------------------------------------
  const playPopSound = () => {
    initAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const peakGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.012);

    peakGain.gain.setValueAtTime(levelToScale(volume) * 0.14, ctx.currentTime);
    peakGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.016);

    osc.connect(peakGain);
    peakGain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  };

  const handlePopBubble = (index: number) => {
    if (poppedBubbles[index]) return; // already popped
    
    playPopSound();
    
    setPoppedBubbles(prev => {
      const copy = [...prev];
      copy[index] = true;
      return copy;
    });
    setTotalPopsCount(p => p + 1);
  };

  const handleResetPoppers = () => {
    setPoppedBubbles(Array(16).fill(false));
    // Soft celestial chime chord
    playTone(523.25, 0, 0.4);
    playTone(659.25, 0.08, 0.4);
    playTone(783.99, 0.16, 0.5);
  };

  const playTone = (freq: number, delay: number, dur: number) => {
    initAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + delay + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.1);
  };

  const levelToScale = (v: number) => Math.pow(v, 2);

  // -------------------------------------------------------------------------
  // STRESS VAPORIZER (VENT DESINTEGRATION)
  // -------------------------------------------------------------------------
  const handleVaporizeStressAndVent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stressText.trim() || vaporizing) return;

    setVaporizing(true);
    initAudioContext();
    const ctx = audioCtxRef.current;
    
    // Play gorgeous dissolving wind sweep
    if (ctx) {
      const osc = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 1.8);
      
      noiseGain.gain.setValueAtTime(0, ctx.currentTime);
      noiseGain.gain.linearRampToValueAtTime(volume * 0.14, ctx.currentTime + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
      
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = "lowpass";
      lowpassFilter.frequency.setValueAtTime(120, ctx.currentTime);
      lowpassFilter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 1.8);
      
      osc.connect(lowpassFilter);
      lowpassFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 2.1);
    }

    // Delayed complete fade out
    setTimeout(() => {
      setVaporizedSuccess(true);
      setVaporizing(false);
      setStressText("");
      
      // Select highly custom supportive affirmation for NEET exam aspirants
      const options = [
        "Your score card is a minor log, not your cognitive capacity. Inhale courage, exhale pressure. You got this!",
        "Every mistake encountered in the Mistake Gym is one less trap waiting on the actual NEET NEET paper. Absolute progress!",
        "Resting is part of studying. Your synapses require downtime to build long-term retention pathways.",
        "A single poor simulator mark is the clinical feedback you needed to stabilize biology NCERT details. Keep stepping!",
        "Your mental balance is your primary asset in the exam. Be kind to yourself today."
      ];
      setSupportiveAffirmation(options[Math.floor(Math.random() * options.length)]);
    }, 2000);
  };

  // -------------------------------------------------------------------------
  // POWER RECOVERY NAP TIMER
  // -------------------------------------------------------------------------
  const startNapTimer = (mins: number) => {
    setNapMinutes(mins);
    setNapSecondsLeft(mins * 60);
    setNapRunning(true);
    setNapDone(false);

    // Automatically trigger cosmic delta drone sound preset at low ambient volume to support sleeping
    playCosmicDronesCap();
  };

  const handleStopNapTimer = () => {
    setNapRunning(false);
    setNapSecondsLeft(0);
    stopAllSynthLogs();
  };

  const playCelestialAwakeningChime = () => {
    initAudioContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    // Play beautiful harmonizing ascending sound chime (C5 -> E5 -> G5 -> C6)
    playTone(523.25, 0.0, 1.8);
    playTone(659.25, 0.2, 1.8);
    playTone(783.99, 0.4, 1.8);
    playTone(1046.50, 0.6, 2.5);
    playTone(1318.51, 0.82, 3.2);
  };

  const formatTimerDuration = (secs: number) => {
    const mm = Math.floor(secs / 60);
    const ss = secs % 60;
    return `${mm}:${ss.toString().padStart(2, "0")}`;
  };

  // Preset medical tracks list
  const presetTracks = [
    {
      id: "alpha-focus",
      title: "10Hz Study Alpha wave",
      tag: "Deep MCQ Study Flow",
      icon: BrainCircuit,
      desc: "Stereo Alpha waves promote cognitive focus, memory retrieval, and NCERT text absorption.",
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
    <div id="relax-zone-root" className="flex-1 flex flex-col overflow-hidden relative font-sans">
      
      {/* Top Header tab bar */}
      <div className="bg-white dark:bg-[#121214] border-b border-slate-100 dark:border-zinc-850 px-4 pt-3 pb-2 flex flex-col gap-2.5 shrink-0">
        <div>
          <span className="text-[9px] font-extrabold tracking-widest text-emerald-500 uppercase flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 animate-pulse" /> Scientifically Proven Relax Zone
          </span>
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-zinc-100 tracking-tight leading-none mt-1">
            Mental Optimization Room
          </h2>
        </div>

        {/* Categories toggler */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: "soundscapes", label: "🎧 Tracks", icon: Headphones },
            { id: "mixer", label: "🎛️ Ambient Mixer", icon: Compass },
            { id: "breathing", label: "🌬️ Breathing", icon: Wind },
            { id: "poppers", label: "🫧 Fidget Pop", icon: Sparkles },
            { id: "vaporizer", label: "🧠 Stress Vent", icon: Smile },
            { id: "timer", label: "⏳ Power Nap", icon: Timer }
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setVaporizedSuccess(false);
                  setNapDone(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-wide shrink-0 transition-all flex items-center gap-1 cursor-pointer select-none border ${
                  isSelected
                    ? "bg-slate-950 text-white border-slate-950 dark:bg-zinc-805 dark:text-zinc-100 dark:border-zinc-700/80 shadow-xs"
                    : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
                }`}
              >
                <Icon className="w-3.2 h-3.2 text-indigo-500" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary content router workspace */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">

        {/* 1. PRIMARY PRESETS TRACKS TAB */}
        {activeTab === "soundscapes" && (
          <div className="space-y-4 animate-fade-in select-none">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-450 dark:text-zinc-500 uppercase font-black tracking-wider">
                Medical Binaural Presets (Offline Synthesis)
              </span>
              {playingTrack && (
                <button
                  onClick={stopAllSynthLogs}
                  className="text-[10px] text-[#ef4444] font-black hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <VolumeX className="w-3.2 h-3.2" /> Mute Synth
                </button>
              )}
            </div>

            {/* In-app Master Volume slider */}
            {playingTrack && (
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/40 dark:border-indigo-900/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-500 animate-bounce" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-400 block text-[9px] uppercase tracking-wider">Active Preset Synthesizer</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{playingTrack}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pr-1">
                  <Volume1 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-slate-200 dark:bg-zinc-800 appearance-none cursor-pointer rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presetTracks.map(track => {
                const isCurrent = playingTrack === track.title;
                const Icon = track.icon;
                return (
                  <div
                    key={track.id}
                    className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl transition-all flex flex-col justify-between gap-3.5 shadow-xs ${
                      isCurrent
                        ? "border-emerald-500 ring-2 ring-emerald-500/10 dark:border-emerald-600"
                        : "border-slate-150 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between leading-none">
                        <span className="text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-zinc-800 text-indigo-650 dark:text-indigo-400 font-extrabold font-mono border border-indigo-100 dark:border-zinc-750">
                          {track.tag}
                        </span>
                        <Icon className="w-4 h-4 text-indigo-400" />
                      </div>
                      <h4 className="font-black text-xs text-slate-800 dark:text-zinc-100">
                        {track.title}
                      </h4>
                      <p className="text-[10px] text-slate-450 dark:text-zinc-450 leading-relaxed font-medium">
                        {track.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={isCurrent ? stopAllSynthLogs : track.action}
                      className={`py-2 w-full rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-97 border ${
                        isCurrent
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/35"
                          : "bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-200 border-slate-100 dark:border-zinc-800"
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Pause className="w-3.5 h-3.5" /> Stop Preset Synth
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-indigo-500 animate-pulse" /> Listen Synth Loop
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. CUSTOM SOUND MIXER TAB */}
        {activeTab === "mixer" && (
          <div className="space-y-4 animate-fade-in select-none">
            <div className="bg-slate-50 dark:bg-[#121214]/60 p-4 rounded-2xl border border-slate-150 dark:border-zinc-850">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-450 dark:text-zinc-400 font-black uppercase tracking-wider block">
                  Custom Soundscape Mixer Desk
                </span>
                {channels.some(c => c.playing) && (
                  <button
                    onClick={stopAllMixerChannels}
                    className="text-[10px] text-[#ef4444] font-black hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    Clear Mixer
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-505 leading-normal">
                An absolute craft sound controller. Mix rainstorm rumblings, campfire sparks, ocean swells, and procedural bell notes simultaneously at chosen scales to create your cozy study shelter.
              </p>
            </div>

            <div className="space-y-3">
              {channels.map(channel => (
                <div
                  key={channel.id}
                  className={`p-4 bg-white dark:bg-[#121214] border rounded-2xl transition-all flex flex-col gap-3 ${
                    channel.playing
                      ? "border-indigo-400 dark:border-indigo-600"
                      : "border-slate-150 dark:border-zinc-850"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl leading-none">{channel.emoji}</span>
                      <div>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-zinc-200 block">
                          {channel.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {channel.desc}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleChannel(channel.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black leading-none cursor-pointer border transition-all ${
                        channel.playing
                          ? "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600"
                          : "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-900 dark:text-zinc-350 dark:border-zinc-800 hover:bg-slate-100"
                      }`}
                    >
                      {channel.playing ? "ON" : "OFF"}
                    </button>
                  </div>

                  {channel.playing && (
                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100/50 dark:border-zinc-805/50">
                      <Volume1 className="w-3.5 h-3.5 text-indigo-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={channel.volume}
                        onChange={(e) => handleChannelVolumeChange(channel.id, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-slate-200 dark:bg-zinc-805 appearance-none cursor-pointer rounded-lg accent-indigo-500"
                      />
                      <span className="text-[9px] font-bold font-mono text-indigo-500 w-6 text-right">
                        {Math.round(channel.volume * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. GUIDED BOX BREATHING TAB */}
        {activeTab === "breathing" && (
          <div className="bg-gradient-to-br from-indigo-950/95 to-slate-900 text-zinc-100 p-5 rounded-3xl border border-indigo-900/50 space-y-4 shadow-lg text-center relative overflow-hidden animate-fade-in select-none">
            
            <div className="absolute inset-0 pointer-events-none opacity-5 flex items-center justify-center">
              <Wind className={`w-36 h-36 ${isBreathing ? "animate-spin" : ""}`} style={{ animationDuration: "16s" }} />
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black tracking-widest uppercase text-indigo-400 font-mono">
                Clinical Breath Trainer
              </span>
              <h3 className="font-extrabold text-sm text-zinc-50">NCERT Stress Box Breathing (4s loops)</h3>
              <p className="text-[10px] text-zinc-450 max-w-[280px]">
                Inhale, hold, exhale, hold rest. Standard yoga technique to instantly stabilize neural tension and lower test adrenaline bursts.
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-4 relative">
              <div
                className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ${
                  breathingPhase === "Inhale"
                    ? "border-emerald-400 bg-emerald-550/15 scale-110"
                    : breathingPhase === "Hold"
                    ? "border-amber-400 bg-amber-500/15 scale-110 ring-4 ring-amber-400/20"
                    : breathingPhase === "Exhale"
                    ? "border-indigo-400 bg-indigo-500/10 scale-90"
                    : "border-slate-500 bg-slate-500/5 scale-90"
                }`}
              >
                <span className="text-[9px] font-extrabold text-[#818cf8] tracking-widest uppercase block mb-1">
                  {breathingPhase}
                </span>
                <span className="text-3xl font-black font-mono leading-none">
                  {breathCounter}s
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsBreathing(!isBreathing)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
                  isBreathing
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isBreathing ? <Pause className="w-3.8 h-3.8" /> : <Play className="w-3.8 h-3.8" />}
                {isBreathing ? "Pause Breathing" : "Begin Breathe Cycle"}
              </button>
            </div>
          </div>
        )}

        {/* 4. SENSORY BUBBLE POPPERS TAB */}
        {activeTab === "poppers" && (
          <div className="space-y-4 animate-fade-in select-none text-center">
            
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-slate-150 dark:border-zinc-850">
              <span className="text-[10px] text-slate-450 dark:text-zinc-500 font-black uppercase tracking-wider block">
                Fidget Bubble Popper Grid
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-505 leading-normal mt-0.5">
                Pop round bubbly sensory modules to relief hand muscle stiffness. Each bubble triggers unique clinical triangle sound waves in real-time.
              </p>
            </div>

            {/* Popper board container */}
            <div className="max-w-[280px] mx-auto bg-slate-100 dark:bg-[#121214] p-4 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
              <div className="grid grid-cols-4 gap-3">
                {poppedBubbles.map((popped, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePopBubble(idx)}
                    className={`w-full aspect-square rounded-full flex items-center justify-center transition-all cursor-pointer select-none active:scale-90 border-[3px] shadow-inner ${
                      popped
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/25 dark:border-zinc-900 scale-95 opacity-55 shadow-xs"
                        : "bg-gradient-to-tr from-indigo-500 to-indigo-400 hover:from-indigo-400 hover:to-indigo-350 active:to-indigo-550 border-indigo-600/10 dark:from-zinc-800 dark:to-zinc-700 dark:border-zinc-650"
                    }`}
                  >
                    {!popped && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white/20 ml-1 mb-1" />
                    )}
                  </button>
                ))}
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-205 dark:border-zinc-800 text-xs">
                <span className="font-bold text-slate-500 dark:text-zinc-400">
                  Total Pops: <span className="text-indigo-505 font-black font-mono">{totalPopsCount}</span>
                </span>
                <button
                  onClick={handleResetPoppers}
                  className="px-2.5 py-1 bg-slate-205 text-slate-700 font-extrabold rounded-lg hover:bg-slate-300 transition-all text-[10px]"
                >
                  Reset Board
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. STRESS VAPORIZER TAB */}
        {activeTab === "vaporizer" && (
          <div className="space-y-4 animate-fade-in select-none">
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-slate-150 dark:border-zinc-850">
              <span className="text-[10px] text-slate-450 dark:text-zinc-400 font-black uppercase tracking-wider block">
                Stress Disintegration Chamber
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-505 leading-normal mt-0.5">
                A cognitive therapy releases tool. Type paper stress, mock fears, or anxiety logs here, then watch them dissolve into particle void while playing tranquil wave sweeps.
              </p>
            </div>

            {!vaporizedSuccess ? (
              <form onSubmit={handleVaporizeStressAndVent} className="space-y-3">
                <textarea
                  value={stressText}
                  onChange={(e) => setStressText(e.target.value)}
                  placeholder="Type anything causing tension... e.g., 'Genetics molecular basis option questions feel extremely confusing...'"
                  disabled={vaporizing}
                  rows={4}
                  className="w-full bg-white dark:bg-[#121214] border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 text-xs text-slate-800 dark:text-zinc-150 placeholder-slate-400 outline-none focus:border-indigo-500 font-medium font-sans leading-relaxed shadow-xs min-h-[110px]"
                />
                
                <button
                  type="submit"
                  disabled={!stressText.trim() || vaporizing}
                  className={`w-full py-2.5 rounded-xl text-xs font-black tracking-wide border cursor-pointer select-none transition-all flex items-center justify-center gap-1.5 ${
                    vaporizing
                      ? "bg-slate-800 text-slate-500 border-zinc-800 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-550 border-indigo-700 text-white hover:shadow-md"
                  }`}
                >
                  {vaporizing ? (
                    <>
                      <Sparkles className="w-3.8 h-3.8 text-emerald-400 animate-spin" />
                      Vaporizing Anxiety into Void...
                    </>
                  ) : (
                    <>
                      <Trash className="w-3.8 h-3.8" />
                      Vaporize Stress Permanently
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="bg-emerald-500/5 dark:bg-emerald-950/10 p-5 rounded-3xl border border-emerald-500/10 text-center space-y-3 animate-slide-up">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
                  <Smile className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                    Anxiety Defeated & Released
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal mt-0.5">
                    Your written worries have been safely dissolved into offline noise channels.
                  </p>
                </div>
                <div className="bg-white dark:bg-zinc-950/40 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850/80 text-xs text-slate-700 dark:text-zinc-300 font-medium italic select-text leading-relaxed">
                  "{supportiveAffirmation}"
                </div>

                <button
                  onClick={() => setVaporizedSuccess(false)}
                  className="text-[10px] font-black tracking-wide text-indigo-505 hover:underline cursor-pointer uppercase block pt-1.5 mx-auto"
                >
                  Write Another Stress Log
                </button>
              </div>
            )}
            <ZenScribbleCanvas />
          </div>
        )}

        {/* 6. POWER RECOVERY NAP TIMER TAB */}
        {activeTab === "timer" && (
          <div className="space-y-4 animate-fade-in select-none text-center">
            
            <div className="bg-slate-50 dark:bg-zinc-900/40 p-3.5 rounded-2xl border border-slate-150 dark:border-zinc-850">
              <span className="text-[10px] text-slate-450 dark:text-zinc-400 font-black uppercase tracking-wider block">
                Power Nap Recovery Room
              </span>
              <p className="text-[10px] text-slate-400 dark:text-zinc-505 leading-normal mt-0.5">
                Rest helps brain dendrites consolidate new botanical definitions. Selecting a nap timer auto-synthesizes relaxing cosmic space drone sound loop, soft-chime waking you up.
              </p>
            </div>

            {!napRunning && !napDone ? (
              <div className="space-y-3.5 max-w-[320px] mx-auto">
                <span className="text-[11px] font-mono text-indigo-500 font-extrabold tracking-wider uppercase">
                  Select Recovery Interval
                </span>
                
                <div className="grid grid-cols-3 gap-2 py-1">
                  {[5, 10, 20].map(mins => (
                    <button
                      key={mins}
                      onClick={() => startNapTimer(mins)}
                      className="py-3 px-1 border border-slate-150 dark:border-zinc-800 hover:border-indigo-305 hover:bg-indigo-50/5 dark:hover:bg-indigo-950/10 rounded-2xl text-xs font-black cursor-pointer bg-white dark:bg-[#121214] flex flex-col items-center justify-center hover:shadow-xs"
                    >
                      <Moon className="w-4 h-4 text-indigo-500 mb-1" />
                      <span>{mins} Mins</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : napRunning ? (
              <div className="space-y-5 animate-pulse max-w-[280px] mx-auto py-3">
                <div className="w-32 h-32 rounded-full border-4 border-dashed border-indigo-500 ring-2 ring-indigo-500/10 flex flex-col items-center justify-center mx-auto relative bg-[#121214]/20 animate-spin" style={{ animationDuration: "35s" }}>
                  <div className="transform -rotate-12 animate-pulse flex flex-col items-center justify-center select-none" style={{ animationDirection: "reverse" }}>
                    <Moon className="w-7 h-7 text-indigo-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-3xl font-black font-mono text-indigo-650 dark:text-indigo-400">
                    {formatTimerDuration(napSecondsLeft)}
                  </span>
                  <span className="text-[10px] text-slate-450 block font-bold leading-normal">
                    Nap in progress. Cosmic Delta Drone active. Feel free to rest now.
                  </span>
                </div>

                <button
                  onClick={handleStopNapTimer}
                  className="px-5 py-2 bg-rose-500 text-white font-black text-xs rounded-xl cursor-pointer hover:bg-rose-600 shadow-sm"
                >
                  Cancel Nap & Wake Up
                </button>
              </div>
            ) : (
              <div className="bg-indigo-500/5 dark:bg-indigo-950/15 p-5 rounded-3xl border border-indigo-500/15 text-center space-y-3.5 max-w-[280px] mx-auto animate-slide-up">
                <div className="w-12 h-12 rounded-full bg-indigo-550/20 text-indigo-500 flex items-center justify-center mx-auto animate-bounce">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">
                    Awakening Harmony Complete
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 leading-normal mt-0.5">
                    Your neuro-synaptic resting completes. Welcome back, you are fully optimized!
                  </p>
                </div>
                <button
                  onClick={() => setNapDone(false)}
                  className="px-4 py-2 bg-indigo-505 dark:bg-zinc-800 hover:bg-indigo-550 text-white text-[10px] font-black rounded-lg cursor-pointer select-none uppercase"
                >
                  Back to Selection
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Scientific Insights bottom strip */}
      <footer className="p-3.5 bg-slate-50 border-t border-slate-100 dark:bg-zinc-900/50 dark:border-zinc-850 shrink-0 select-none">
        <div className="flex items-start gap-1.5 text-[10px] text-slate-400 dark:text-zinc-505 leading-relaxed font-semibold">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <span>
            Every relaxing track and interaction popping sensory module generates **pure, clinical synthetic sound waves offline** directly inside your secure browser core, ensuring lag-free operation.
          </span>
        </div>
      </footer>

    </div>
  );
}
