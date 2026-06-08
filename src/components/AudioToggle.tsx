import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setMuted, getMuted } from "../utils/audio";

export default function AudioToggle() {
  const [muted, setMutedState] = useState(getMuted());

  const handleToggle = () => {
    const newState = !muted;
    setMuted(newState);
    setMutedState(newState);
  };

  return (
    <button
      id="audio-synth-toggle"
      onClick={handleToggle}
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium font-display cursor-pointer transition-all duration-300 ${
        muted
          ? "bg-[#0f121a]/50 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
          : "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/15 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
      }`}
      title={muted ? "Unmute Retro Synth Audio" : "Mute Retro Synth Audio"}
    >
      {muted ? (
        <>
          <VolumeX size={14} className="text-slate-500 animate-pulse" />
          <span className="font-mono text-[10px]">SOUNDS: OFF</span>
        </>
      ) : (
        <>
          <Volume2 size={14} className="text-blue-400" />
          {/* Glowing mini animation bars */}
          <div className="flex gap-0.5 items-end h-2.5">
            <span className="w-0.5 h-1.5 bg-blue-400 rounded-full animate-[bounce_1.2s_infinite_ease-in-out_100ms]" />
            <span className="w-0.5 h-2.5 bg-blue-400 rounded-full animate-[bounce_1.2s_infinite_ease-in-out_300ms]" />
            <span className="w-0.5 h-1 bg-blue-400 rounded-full animate-[bounce_1.2s_infinite_ease-in-out_500ms]" />
          </div>
          <span className="font-mono text-[10px]">SOUNDS: ON</span>
        </>
      )}
    </button>
  );
}
