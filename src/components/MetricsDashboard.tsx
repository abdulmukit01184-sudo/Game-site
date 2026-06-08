import React from "react";
import { Activity, Clock, Award, Hammer, Percent, RefreshCw } from "lucide-react";
import { AutomationMode } from "../types";

interface MetricsDashboardProps {
  score: number;
  highScore: number;
  activeMode: AutomationMode;
  fps: number;
  reactionMs: number;
  efficiency: number;
  totalRuns: number;
  autonomousMoves: number;
}

export default function MetricsDashboard({
  score,
  highScore,
  activeMode,
  fps,
  reactionMs,
  efficiency,
  totalRuns,
  autonomousMoves
}: MetricsDashboardProps) {

  // Simulate an oscillating virtual CPU heat rate based on AI activities
  const [cpuLoad, setCpuLoad] = React.useState(12);

  React.useEffect(() => {
    const int = setInterval(() => {
      let baseLoad = 5;
      if (activeMode === AutomationMode.DEEPSEEK_R1) baseLoad = 48;
      else if (activeMode === AutomationMode.CHATGPT_4O) baseLoad = 34;
      else if (activeMode === AutomationMode.GEMINI_FLASH) baseLoad = 22;
      else if (activeMode === AutomationMode.CUSTOM_SCRIPT) baseLoad = 11;
      
      setCpuLoad(Math.round(baseLoad + Math.sin(Date.now() / 300) * 4));
    }, 500);
    return () => clearInterval(int);
  }, [activeMode]);

  return (
    <div id="diagnostics-metrics-dashboard" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. SCORE COLUMN */}
      <div className="bg-[#0f121a]/80 border border-white/10 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-[100px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold block uppercase">
              Current Yield
            </span>
            <span className="text-2xl font-display font-bold text-white transition-all tracking-tight leading-none mt-1 inline-block">
              {score}
            </span>
          </div>
          <Award size={18} className="text-blue-400" />
        </div>
        <div className="text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5 flex justify-between">
          <span>HIGH CORE RECORD</span>
          <span className="text-blue-400 font-bold">{highScore}</span>
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/5 blur-xl rounded-full" />
      </div>

      {/* 2. LATENCY RESPONSE SPEED */}
      <div className="bg-[#0f121a]/80 border border-white/10 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-[100px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold block uppercase">
              Reaction Threshold
            </span>
            <span className="text-2xl font-display font-bold text-cyan-400 tracking-tight leading-none mt-1 inline-block">
              {activeMode === AutomationMode.MANUAL ? "N/A" : `${reactionMs} ms`}
            </span>
          </div>
          <Clock size={18} className="text-cyan-400" />
        </div>
        <div className="text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5 flex justify-between">
          <span>THROUGHPUT RATIO</span>
          <span className="text-cyan-400 font-bold">
            {activeMode === AutomationMode.MANUAL ? "1.0x (Human)" : "250.0 FLOPs"}
          </span>
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 bg-cyan-500/5 blur-xl rounded-full" />
      </div>

      {/* 3. SIMULATED ACTIVE CPU OVERLOAD */}
      <div className="bg-[#0f121a]/80 border border-white/10 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-[100px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold block uppercase">
              Automation Load
            </span>
            <span className="text-2xl font-display font-bold text-[#3b82f6] tracking-tight leading-none mt-1 inline-block">
              {cpuLoad}%
            </span>
          </div>
          <Activity size={18} className="text-[#3b82f6]" />
        </div>
        <div className="text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5 flex justify-between">
          <span>RENDER EMULATION</span>
          <span className="text-[#3b82f6] font-bold">{fps} FRAME/S</span>
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 bg-blue-500/5 blur-xl rounded-full" />
      </div>

      {/* 4. TOTAL EMULATED EFFICIENCY */}
      <div className="bg-[#0f121a]/80 border border-white/10 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between h-[100px]">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold block uppercase">
              Core Accuracy
            </span>
            <span className="text-2xl font-display font-bold text-emerald-400 tracking-tight leading-none mt-1 inline-block">
              {efficiency}%
            </span>
          </div>
          <Percent size={18} className="text-emerald-400" />
        </div>
        <div className="text-[9px] text-slate-500 font-mono border-t border-white/5 pt-1.5 flex justify-between">
          <span>AUTONOMOUS CYCLES</span>
          <span className="text-emerald-400 font-bold">{autonomousMoves}</span>
        </div>
        <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/5 blur-xl rounded-full" />
      </div>
    </div>
  );
}
