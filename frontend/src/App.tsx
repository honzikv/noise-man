import { useState, useRef, useEffect } from "react";
import {
  Play,
  Square,
  Download,
  Waves,
  CloudRain,
  Coffee,
  Wind,
  Settings2,
  Moon,
  TreePine,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AudioEngine, type SoundType } from "./AudioEngine";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SOUNDS: {
  id: SoundType;
  icon: React.ElementType;
  label: string;
  color: string;
}[] = [
  {
    id: "white",
    icon: Wind,
    label: "Smooth White Noise",
    color: "from-gray-300 to-gray-500",
  },
  {
    id: "pink",
    icon: CloudRain,
    label: "Smooth Pink Noise",
    color: "from-pink-400 to-pink-600",
  },
  {
    id: "brown",
    icon: Coffee,
    label: "Deep Brown Noise",
    color: "from-amber-700 to-amber-900",
  },
  {
    id: "rain",
    icon: CloudRain,
    label: "Light Rain",
    color: "from-blue-400 to-blue-600",
  },
  {
    id: "ocean",
    icon: Waves,
    label: "Ocean Waves",
    color: "from-cyan-500 to-blue-700",
  },
  {
    id: "space",
    icon: Moon,
    label: "Deep Space",
    color: "from-indigo-600 to-purple-900",
  },
  {
    id: "forest",
    icon: TreePine,
    label: "Forest Wind",
    color: "from-emerald-500 to-green-800",
  },
  {
    id: "blue",
    icon: Wind,
    label: "Blue Noise",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "violet",
    icon: Wind,
    label: "Violet Noise",
    color: "from-purple-500 to-fuchsia-500",
  },
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumes, setVolumes] = useState<Record<SoundType, number>>({
    white: 0,
    pink: 50,
    brown: 0,
    rain: 0,
    ocean: 0,
    space: 0,
    forest: 0,
    blue: 0,
    violet: 0,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [intensity, setIntensity] = useState(0);

  const engineRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    engineRef.current = new AudioEngine();

    const updateIntensity = () => {
      if (engineRef.current) {
        setIntensity(engineRef.current.getIntensity());
      }
      rafRef.current = requestAnimationFrame(updateIntensity);
    };
    rafRef.current = requestAnimationFrame(updateIntensity);

    return () => {
      engineRef.current?.stopAll();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const togglePlayback = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.stopAll();
      setIsPlaying(false);
    } else {
      engineRef.current.playAll(volumes);
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (type: SoundType, vol: number) => {
    setVolumes((prev) => ({ ...prev, [type]: vol }));
    if (isPlaying && engineRef.current) {
      engineRef.current.setVolume(type, vol);
    }
  };

  const exportMix = async () => {
    setIsExporting(true);
    try {
      const tracks = Object.entries(volumes)
        .filter(([, vol]) => vol > 0)
        .map(([type, vol]) => ({
          type,
          volume: vol / 100,
        }));

      if (tracks.length === 0) {
        alert("Please turn up at least one sound before exporting.");
        return;
      }

      const res = await fetch(`http://localhost:8000/api/v1/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracks,
          duration_seconds: 600, // 10 minutes export for loopable youtube videos
        }),
      });

      if (!res.ok) throw new Error("Failed to export mix");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loopable-mix-10min.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error exporting mix");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#F8FAFC] flex flex-col items-center p-4 font-sans relative overflow-hidden transition-colors duration-200"
      style={{
        backgroundColor: `rgba(${15 + intensity * 20}, ${23 + intensity * 40}, ${42 + intensity * 60}, 1)`,
      }}
    >
      {/* Animated Gradient Background reacting to audio intensity */}
      <div
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-200"
        style={{ opacity: 0.2 + intensity * 0.5 }}
      >
        <div
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#10B981] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite] transition-all duration-75"
          style={{
            filter: `blur(${120 - intensity * 60}px)`,
            transform: `scale(${1 + intensity * 0.5})`,
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#8B5CF6] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse] transition-all duration-75"
          style={{
            filter: `blur(${150 - intensity * 80}px)`,
            transform: `scale(${1 + intensity * 0.6})`,
          }}
        />
      </div>

      <header className="relative z-10 mt-8 mb-12 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Focus
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#34d399]">
            Mixer
          </span>
        </h1>
        <p className="text-[#94A3B8] text-lg max-w-lg mx-auto font-medium">
          Layer ambient soundscapes to create your perfect deep work
          environment.
        </p>
      </header>

      <main className="w-full max-w-4xl relative z-10 flex flex-col gap-8 md:flex-row">
        {/* Mixer Board */}
        <div className="flex-1 bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2 mb-6 text-[#94A3B8]">
            <Settings2 size={20} />
            <h2 className="font-semibold uppercase tracking-widest text-sm">
              Channels
            </h2>
          </div>

          <div className="space-y-6">
            {SOUNDS.map(({ id, icon: Icon, label, color }) => (
              <div key={id} className="group flex items-center gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                    volumes[id] > 0
                      ? `bg-gradient-to-br ${color}`
                      : "bg-white/5 text-white/50 grayscale group-hover:bg-white/10",
                  )}
                >
                  <Icon
                    size={24}
                    className={volumes[id] > 0 ? "text-white" : ""}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-sm text-gray-200">
                      {label}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      {volumes[id]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volumes[id]}
                    onChange={(e) =>
                      handleVolumeChange(id, Number(e.target.value))
                    }
                    className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6] hover:accent-[#10B981] transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Controls */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col items-center justify-center">
            <button
              onClick={togglePlayback}
              aria-label={isPlaying ? "Stop Mix" : "Master Play"}
              className={cn(
                "relative flex items-center justify-center w-32 h-32 rounded-full transition-all duration-500",
                isPlaying
                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-2 border-red-500/50"
                  : "bg-gradient-to-br from-[#10B981] to-[#059669] text-white shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] hover:scale-105",
              )}
            >
              {isPlaying ? (
                <Square size={40} fill="currentColor" />
              ) : (
                <Play size={48} fill="currentColor" className="ml-2" />
              )}
            </button>
            <p className="mt-6 text-sm text-[#94A3B8] font-medium tracking-wider uppercase">
              {isPlaying ? "Playing Mix" : "Master Play"}
            </p>
          </div>

          <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
            <button
              onClick={exportMix}
              disabled={isExporting}
              className="w-full py-4 px-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center justify-center gap-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download
                  size={20}
                  className="group-hover:-translate-y-1 transition-transform"
                />
              )}
              {isExporting ? "Exporting Mix..." : "Export 10m Loop (WAV)"}
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">
              Generates a high-quality mix using the backend API.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
