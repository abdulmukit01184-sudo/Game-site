import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  GameType,
  AutomationMode,
  LogEntry,
  AutomationRule,
} from "./types";
import { GameCanvas, GameCanvasHandle } from "./components/GameCanvas";
import AutomationConsole from "./components/AutomationConsole";
import MetricsDashboard from "./components/MetricsDashboard";
import AutomationCreator from "./components/AutomationCreator";
import AudioToggle from "./components/AudioToggle";
import {
  Cpu,
  BrainCircuit,
  Zap,
  CodeXml,
  Play,
  RotateCcw,
  Sparkles,
  Gamepad2,
  Terminal,
  Activity,
  User,
  Info
} from "lucide-react";

export default function App() {
  // Game Selector states
  const [activeGame, setActiveGame] = useState<GameType>(GameType.RUNNER);
  const [activeModel, setActiveModel] = useState<AutomationMode>(AutomationMode.MANUAL);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Stats / metrics
  const [score, setScore] = useState<number>(0);
  const [highScores, setHighScores] = useState<Record<GameType, number>>({
    [GameType.RUNNER]: 0,
    [GameType.FUSION]: 0,
    [GameType.DEFENDER]: 0,
  });

  // Diagnostics Metrics
  const [fps, setFps] = useState<number>(60);
  const [reactionMs, setReactionMs] = useState<number>(30);
  const [efficiency, setEfficiency] = useState<number>(85);
  const [totalRuns, setTotalRuns] = useState<number>(0);
  const [autonomousMoves, setAutonomousMoves] = useState<number>(0);

  // Custom macro configurations state
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: "rule_init_1",
      metric: "obstacleDistance",
      operator: "<",
      value: 160,
      action: "JUMP",
      isEnabled: true,
    }
  ]);

  // Terminal telemetry streaming logs state
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "log_init_0",
      time: new Date().toLocaleTimeString(),
      type: "info",
      message: "Console initialized. Welcome to the Neural Automation Deck.",
      model: AutomationMode.MANUAL
    }
  ]);

  const canvasRef = useRef<GameCanvasHandle | null>(null);

  // Add a log to feed
  const addLog = (type: LogEntry["type"], message: string) => {
    // Increment moves triggers counting for metrics
    if (type === "action") {
      setAutonomousMoves(prev => prev + 1);
    }

    const newLog: LogEntry = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      model: activeModel
    };
    // Boundary checks for log counts to keep browser snappy
    setLogs(prev => [...prev.slice(-30), newLog]);
  };

  // Launch platform loops
  const handleTogglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      setTotalRuns(p => p + 1);
      addLog("success", `Simulation online. Relaying controls to agent: [${activeModel}].`);
    } else {
      setIsPlaying(false);
      addLog("info", "Simulation paused by operator interface request.");
    }
  };

  const handleResetGame = () => {
    setIsPlaying(false);
    setScore(0);
    if (canvasRef.current) {
      canvasRef.current.resetGame();
    }
    setIsPlaying(true);
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScores[activeGame]) {
      setHighScores(prev => ({
        ...prev,
        [activeGame]: newScore
      }));
    }
  };

  const handleCrash = () => {
    setIsPlaying(false);
  };

  const handleGameSelect = (gType: GameType) => {
    setActiveGame(gType);
    setIsPlaying(false);
    setScore(0);

    // Swap custom script defaults
    if (gType === GameType.RUNNER) {
      setRules([
        {
          id: "rule_runner_def",
          metric: "obstacleDistance",
          operator: "<",
          value: 155,
          action: "JUMP",
          isEnabled: true,
        }
      ]);
    } else if (gType === GameType.FUSION) {
      setRules([
        {
          id: "rule_fusion_def",
          metric: "colorMatch",
          operator: "<",
          value: 110,
          action: "MATCH",
          isEnabled: true,
        }
      ]);
    } else {
      setRules([
        {
          id: "rule_def_def",
          metric: "enemyAlignY",
          operator: ">",
          value: 90,
          action: "FIRE",
          isEnabled: true,
        }
      ]);
    }

    addLog("info", `Target simulation switched key profile to: [${gType}].`);
    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.resetGame();
    }, 50);
  };

  const handleModelSelect = (mMode: AutomationMode) => {
    setActiveModel(mMode);
    addLog("info", `Switched controller broker interface to: [${mMode}].`);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white flex flex-col antialiased font-sans selection:bg-blue-500/30 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION DECK */}
      <header className="h-16 border-b border-white/10 bg-[#0f121a] flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
          
          {/* Main Title branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" style={{ fill: "none" }} />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="text-sm font-bold font-display uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  MATRIX AUTOMATOR
                </h1>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-450 uppercase tracking-widest font-black animate-pulse">
                  v2.5_R1
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                AXON G-AUTO SIMULATION & AI AGENT CONTROLLER
              </p>
            </div>
          </div>

          {/* Action widgets */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <AudioToggle />
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">System Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CORE CONTENT GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        
        {/* TELEMETRY GAUGES */}
        <MetricsDashboard
          score={score}
          highScore={highScores[activeGame]}
          activeMode={activeModel}
          fps={fps}
          reactionMs={reactionMs}
          efficiency={efficiency}
          totalRuns={totalRuns}
          autonomousMoves={autonomousMoves}
        />

        {/* BENTO ACTION GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* LEFT CONTAINER: GAMES CHANNELS & VIEWPORT (7/12 width) */}
          <section className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Simulation Selection Deck */}
            <div className="bg-[#0f121a]/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Gamepad2 size={16} className="text-blue-400" />
                <h2 className="text-xs font-bold font-display text-slate-200 uppercase tracking-wider">
                  Select Game Environment
                </h2>
              </div>

              {/* Selector Cards */}
              <div className="grid grid-cols-3 gap-2">
                
                {/* RUNNER SELECTOR CARD */}
                <button
                  id="game-runner-select"
                  onClick={() => handleGameSelect(GameType.RUNNER)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    activeGame === GameType.RUNNER
                      ? "bg-[#0284c7]/10 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase mb-1">
                    RUNNER
                  </span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">
                    Cyber Dash Obstacles
                  </span>
                </button>

                {/* FUSION SORT SELECTOR CARD */}
                <button
                  id="game-fusion-select"
                  onClick={() => handleGameSelect(GameType.FUSION)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    activeGame === GameType.FUSION
                      ? "bg-yellow-500/10 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase mb-1">
                    FUSION
                  </span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">
                    Quantum Color Sort
                  </span>
                </button>

                {/* DEFENDER SPACE ATTACK CARD */}
                <button
                  id="game-defender-select"
                  onClick={() => handleGameSelect(GameType.DEFENDER)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    activeGame === GameType.DEFENDER
                      ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-mono tracking-widest font-bold uppercase mb-1">
                    AEGIS
                  </span>
                  <span className="text-[9px] text-slate-500 hidden sm:inline">
                    Galactic Laser Defense
                  </span>
                </button>

              </div>
            </div>

            {/* THE SIMULATION VIEWPORT PANEL */}
            <div className="bg-[#0f121a]/50 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
              
              {/* Controls bar */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
                  <span className="text-[10.5px] font-mono text-slate-400 tracking-wider">
                    SIMULATION VIEWPORT
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    id="sim-init-btn"
                    onClick={handleTogglePlay}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition font-display cursor-pointer uppercase tracking-wider ${
                      isPlaying
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse"
                        : "bg-gradient-to-r from-blue-600 to-cyan-400 text-white hover:from-blue-500 hover:to-cyan-300 shadow-lg shadow-blue-500/10"
                    }`}
                  >
                    <Play size={13} fill="currentColor" />
                    {isPlaying ? "HALT CONTROL" : "INITIALIZE PLATFORM"}
                  </button>

                  <button
                    id="sim-reset-btn"
                    onClick={handleResetGame}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-display bg-[#0f121a] hover:bg-white/5 text-slate-300 border border-white/10 cursor-pointer transition uppercase"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                </div>
              </div>

              {/* Render canvas component */}
              <GameCanvas
                ref={canvasRef}
                gameType={activeGame}
                mode={activeModel}
                rules={rules}
                isPlaying={isPlaying}
                onScoreUpdate={handleScoreUpdate}
                onCrash={handleCrash}
                onLog={addLog}
                onMetricsUpdate={(fpsVal, rMs, eff) => {
                  setFps(fpsVal);
                  setReactionMs(rMs);
                  setEfficiency(eff);
                }}
              />

              {/* Mode Info Notification */}
              {activeModel === AutomationMode.MANUAL && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-500/5 border border-white/5 text-xs text-blue-300">
                  <Info size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="leading-relaxed">
                    <strong>Manual Mode Engaged:</strong> Please use the key actions below the canvas layout to control your client entity manually, or switch to an automation model in the right panel to activate our automated agents.
                  </p>
                </div>
              )}
            </div>

          </section>

          {/* RIGHT CONTAINER: AI MODELS CORE SELECTOR & MACRO IDE (5/12 width) */}
          <section className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Automation controller interface deck */}
            <div className="bg-[#0f121a]/50 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-blue-400" />
                <h2 className="text-xs font-bold font-display text-slate-200 uppercase tracking-wider">
                  Select Automation Core
                </h2>
              </div>

              {/* Models grid */}
              <div className="flex flex-col gap-2">
                
                {/* MANUAL PILOT BUTTON */}
                <button
                  id="model-manual-btn"
                  onClick={() => handleModelSelect(AutomationMode.MANUAL)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeModel === AutomationMode.MANUAL
                      ? "bg-white/5 border-white/20 text-white"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <User size={15} className={activeModel === AutomationMode.MANUAL ? "text-slate-300" : "text-slate-500"} />
                    <div>
                      <span className="text-[10px] font-bold block">Operator Mode (Manual)</span>
                      <span className="text-[9px] text-slate-500">Take manual control of the controls</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-white/10 px-1.5 py-0.5 rounded text-slate-400">
                    MANUAL
                  </span>
                </button>

                {/* DEEPSEEK R1 BRAND MODEL */}
                <button
                  id="model-deepseek-btn"
                  onClick={() => handleModelSelect(AutomationMode.DEEPSEEK_R1)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeModel === AutomationMode.DEEPSEEK_R1
                      ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={15} className={activeModel === AutomationMode.DEEPSEEK_R1 ? "text-amber-400" : "text-slate-500"} />
                    <div>
                      <span className="text-[10.5px] font-bold block">DEEPSEEK R1 (Reasoning)</span>
                      <span className="text-[9px] text-slate-500">Self-reflexive planning loop (thought delay)</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-amber-900 px-1.5 py-0.5 rounded text-amber-400">
                    COT REASON
                  </span>
                </button>

                {/* CHATGPT-4O BOT */}
                <button
                  id="model-chatgpt-btn"
                  onClick={() => handleModelSelect(AutomationMode.CHATGPT_4O)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeModel === AutomationMode.CHATGPT_4O
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Zap size={15} className={activeModel === AutomationMode.CHATGPT_4O ? "text-emerald-400" : "text-slate-500"} />
                    <div>
                      <span className="text-[10.5px] font-bold block">GPT-4o (Strategic Planner)</span>
                      <span className="text-[9px] text-slate-500">Heuristic analytical vector mapping</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400">
                    HEURISTIC
                  </span>
                </button>

                {/* GEMINI FLASH */}
                <button
                  id="model-gemini-btn"
                  onClick={() => handleModelSelect(AutomationMode.GEMINI_FLASH)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeModel === AutomationMode.GEMINI_FLASH
                      ? "bg-[#0284c7]/10 border-blue-500 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BrainCircuit size={15} className={activeModel === AutomationMode.GEMINI_FLASH ? "text-cyan-400" : "text-slate-500"} />
                    <div>
                      <span className="text-[10.5px] font-bold block">GEMINI 2.5 FLASH (Ultra Reflex)</span>
                      <span className="text-[9px] text-slate-500">Immediate dodging with sub-ms reactions</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-blue-500/20 px-1.5 py-0.5 rounded text-cyan-400">
                    REFLEX
                  </span>
                </button>

                {/* USER CUSTOM MACROS */}
                <button
                  id="model-custom-btn"
                  onClick={() => handleModelSelect(AutomationMode.CUSTOM_SCRIPT)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    activeModel === AutomationMode.CUSTOM_SCRIPT
                      ? "bg-purple-500/10 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                      : "bg-black/20 border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CodeXml size={15} className={activeModel === AutomationMode.CUSTOM_SCRIPT ? "text-purple-400" : "text-slate-500"} />
                    <div>
                      <span className="text-[10.5px] font-bold block">User Conditional Micro-Script</span>
                      <span className="text-[9px] text-slate-500">Run user customized conditional macros below</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400">
                    SCRIPT_RUN
                  </span>
                </button>

              </div>
            </div>

            {/* REALTIME TRACING TELEMETRY LOOPS */}
            <AutomationConsole
              logs={logs}
              activeMode={activeModel}
              onClearLogs={() => setLogs([])}
            />

            {/* SCRIPT EDITOR BUILDER - ONLY APPLICABLE OR DISPLAYED IF MACRO IS ACTIVE OR TO HELP USER INTEGRATE */}
            <AutomationCreator
              gameType={activeGame}
              rules={rules}
              onRulesUpdate={(newRules) => {
                setRules(newRules);
                addLog("info", "User Micro-Scripts updated successfully.");
              }}
            />

          </section>

        </div>

        {/* 3. FOOTER DOCUMENT STATS */}
        <footer className="mt-8 border-t border-slate-900 pt-6 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-500 leading-relaxed font-mono">
            <div>
              <h3 className="font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Automation Framework Documentation
              </h3>
              <p className="mb-2">
                The **Matrix Automator** leverages a frame-interception event-loop. During gameplay, active models compile telemetry coordinates regarding threats, power-ups and incoming vectors.
              </p>
              <p>
                - **DeepSeek R1**: Exercises slow simulation loops mimicking the model's self-questioning logic chain before selecting action commands.
                - **ChatGPT-4o**: Focuses heavily on tactical spatial awareness, mapping bounding rectangles directly on threats.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Controller Matrix Trigger Maps
              </h3>
              <p className="mb-2">
                - **Neo-Runner**: Threat distances under 150 pixels trigger high velocity jump sequences to clear low spiked traps or slide to traverse air beam drones.
                - **Aegis Space Defense**: Moves bottom railgun coordinates to align with heavy astros, shooting pulses continuously while target locks hold.
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-600 mt-4 border-t border-slate-900/40 pt-2">
                <span>LOCAL INSTANCE: OK</span>
                <span>COMPILE DATE: 2026-06</span>
              </div>
            </div>
          </div>
        </footer>

      </main>
    </div>
  );
}
