import React, { useRef, useEffect, useState } from "react";
import { LogEntry, AutomationMode } from "../types";
import { Terminal, Shield, Play, ArrowDownRight, Eye, Trash2, Cpu } from "lucide-react";

interface AutomationConsoleProps {
  logs: LogEntry[];
  activeMode: AutomationMode;
  onClearLogs: () => void;
}

export default function AutomationConsole({ logs, activeMode, onClearLogs }: AutomationConsoleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Keep scrolled to bottom for new active logs
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filterType === "all") return true;
    if (filterType === "thinking") return log.type === "thinking";
    if (filterType === "action") return log.type === "action";
    if (filterType === "alerts") return log.type === "error" || log.type === "success";
    return true;
  });

  const getLogColors = (type: LogEntry["type"]) => {
    switch (type) {
      case "thinking": return "text-amber-400 bg-amber-500/5 border-amber-500/10";
      case "action": return "text-cyan-400 bg-cyan-500/5 border-cyan-500/10";
      case "success": return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
      case "error": return "text-rose-400 bg-rose-500/5 border-rose-500/10";
      default: return "text-slate-300 bg-slate-500/5 border-slate-500/10";
    }
  };

  const getModelLabel = (model: AutomationMode) => {
    switch (model) {
      case AutomationMode.DEEPSEEK_R1: return "DEEPSEEK-R1 (REASONING)";
      case AutomationMode.CHATGPT_4O: return "GPT-4o (STRATEGIC)";
      case AutomationMode.GEMINI_FLASH: return "GEMINI 2.5 FLASH";
      case AutomationMode.CUSTOM_SCRIPT: return "USER MICRO-SCRIPT";
      default: return "MANUAL CONTROLLER";
    }
  };

  return (
    <div id="automation-terminal-console" className="flex flex-col h-full bg-[#0f121a]/50 border border-white/10 rounded-xl overflow-hidden font-mono shadow-xl">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f121a] border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-blue-400 animate-pulse" />
          <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
            Automation Diagnostic Console
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">Broker:</span>
          <span className="text-[10px] bg-black/40 border border-white/10 px-2 py-0.5 rounded-lg text-blue-400 font-semibold uppercase">
            {activeMode}
          </span>
          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="flex items-center justify-center p-1.5 rounded-lg bg-black/20 hover:bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200 cursor-pointer transition"
            title="Clear Diagnostics Console"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Filters Selector */}
      <div className="flex gap-1.5 p-2 bg-[#0f121a]/30 border-b border-white/5 text-[10px]">
        <button
          onClick={() => setFilterType("all")}
          className={`px-2 py-1 rounded-lg transition border cursor-pointer ${
            filterType === "all"
              ? "bg-[#0f121a] border-white/10 text-white font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ALL LOGS
        </button>
        <button
          onClick={() => setFilterType("thinking")}
          className={`px-2 py-1 rounded-lg transition border cursor-pointer ${
            filterType === "thinking"
              ? "bg-amber-950/20 border-amber-500/20 text-amber-300 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          REASONING CHAIN
        </button>
        <button
          onClick={() => setFilterType("action")}
          className={`px-2 py-1 rounded-lg transition border cursor-pointer ${
            filterType === "action"
              ? "bg-blue-950/20 border-blue-500/20 text-blue-300 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ACTUATION METRICS
        </button>
        <button
          onClick={() => setFilterType("alerts")}
          className={`px-2 py-1 rounded-lg transition border cursor-pointer ${
            filterType === "alerts"
              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-300 font-bold"
              : "bg-transparent border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          ALERTS
        </button>
      </div>

      {/* Output Stream */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto max-h-[300px] min-h-[160px] bg-black/10 flex flex-col gap-1.5"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-600">
            <Cpu size={32} className="opacity-15 mb-2 text-white" />
            <span className="text-[10px]">NO DIAGNOSTIC LOGS STREAMING</span>
            <span className="text-[9px] opacity-60">Press 'Initialize Platform' to initiate telemetry feed</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className={`flex flex-col text-[10px] p-2 border rounded-xl leading-relaxed transition-all ${getLogColors(log.type)}`}
            >
              <div className="flex items-center justify-between mb-1 opacity-70 border-b border-white/5 pb-0.5">
                <span className="text-[8px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full inline-block" />
                  {log.time}
                </span>
                <span className="text-[8px] tracking-wider uppercase font-semibold">
                  {getModelLabel(log.model)}
                </span>
              </div>
              <div className="break-all whitespace-pre-wrap select-all font-mono">
                {log.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Terminal Footer */}
      <div className="px-3 py-1.5 bg-[#0f121a] border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
          Telemetry Feed Active
        </span>
        <span>Buffer count: {logs.length} feeds</span>
      </div>
    </div>
  );
}
