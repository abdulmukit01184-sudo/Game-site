import React, { useState } from "react";
import { AutomationRule, GameType } from "../types";
import { Plus, Trash, Check, Sliders, ShieldAlert, Cpu } from "lucide-react";

interface AutomationCreatorProps {
  gameType: GameType;
  rules: AutomationRule[];
  onRulesUpdate: (rules: AutomationRule[]) => void;
}

export default function AutomationCreator({ gameType, rules, onRulesUpdate }: AutomationCreatorProps) {
  const [metric, setMetric] = useState<string>(
    gameType === GameType.RUNNER ? "obstacleDistance" :
    gameType === GameType.FUSION ? "colorMatch" : "enemyAlignY"
  );
  const [operator, setOperator] = useState<"<" | ">" | "==">("<");
  const [value, setValue] = useState<number>(150);
  const [action, setAction] = useState<string>(
    gameType === GameType.RUNNER ? "JUMP" :
    gameType === GameType.FUSION ? "MATCH" : "FIRE"
  );

  // Auto align default inputs when game switches
  React.useEffect(() => {
    if (gameType === GameType.RUNNER) {
      setMetric("obstacleDistance");
      setAction("JUMP");
      setValue(155);
    } else if (gameType === GameType.FUSION) {
      setMetric("colorMatch");
      setAction("MATCH");
      setValue(100);
    } else {
      setMetric("enemyAlignY");
      setAction("FIRE");
      setValue(80);
    }
  }, [gameType]);

  const addRule = () => {
    const newRule: AutomationRule = {
      id: "rule_" + Date.now(),
      metric,
      operator,
      value: Number(value),
      action,
      isEnabled: true
    };
    onRulesUpdate([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    onRulesUpdate(rules.filter(rule => rule.id !== id));
  };

  const toggleRule = (id: string) => {
    onRulesUpdate(rules.map(rule => {
      if (rule.id === id) {
        return { ...rule, isEnabled: !rule.isEnabled };
      }
      return rule;
    }));
  };

  const getMetricLabel = (mVal: string) => {
    switch (mVal) {
      case "obstacleDistance": return "Horizontal separation distance (px)";
      case "colorMatch": return "Vertical descent trigger threshold (px)";
      case "enemyAlignY": return "Asteroid drop height coordinate (y)";
      default: return mVal;
    }
  };

  return (
    <div id="automation-macro-editor" className="p-4 bg-[#0f121a]/50 border border-white/10 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Sliders size={16} className="text-blue-400" />
        <h3 className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
          Agent Macro micro-script engine
        </h3>
      </div>
      
      <p className="text-[10.5px] text-slate-400 mb-4 leading-relaxed font-sans">
        Formulate automated conditional micro-scripts to trigger hardware actions inside the active simulator. Rules will execute on every frame trigger during script automation mode.
      </p>

      {/* Inputs builder block */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4 bg-black/20 p-3 rounded-xl border border-white/5">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-slate-500 uppercase font-mono font-bold">State Metric</label>
          <select
            id="rule-metric-select"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="bg-black/40 border border-white/10 text-[11px] text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {gameType === GameType.RUNNER && (
              <option value="obstacleDistance">Obstacle Distance</option>
            )}
            {gameType === GameType.FUSION && (
              <option value="colorMatch">Vertical Alignment Distance</option>
            )}
            {gameType === GameType.DEFENDER && (
              <option value="enemyAlignY">Hazard Altitude Level</option>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <label className="text-[9px] text-slate-500 uppercase font-mono font-bold">Operator</label>
          <select
            id="rule-operator-select"
            value={operator}
            onChange={(e) => setOperator(e.target.value as any)}
            className="bg-black/40 border border-white/10 text-[11px] text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="<">VAL &lt; THRESHOLD</option>
            <option value=">">VAL &gt; THRESHOLD</option>
            <option value="==">VAL == EXACTLY</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] text-slate-500 uppercase font-mono font-bold">Threshold limit</label>
          <input
            id="rule-threshold-input"
            type="number"
            min={10}
            max={350}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="bg-black/40 border border-white/10 text-[11px] text-slate-300 rounded-xl px-2 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex flex-col gap-1 justify-end">
          <button
            id="add-rule-btn"
            onClick={addRule}
            className="w-full flex items-center justify-center gap-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold font-display text-xs cursor-pointer transition uppercase"
          >
            <Plus size={14} /> Add micro-script
          </button>
        </div>
      </div>

      {/* Active Rules List */}
      <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 border border-dashed border-white/10 rounded-xl bg-black/10">
            <Cpu size={24} className="opacity-15 text-slate-500 mb-1" />
            <span className="text-[9.5px] text-slate-600 font-mono tracking-wider">No User Automation scripts customized</span>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-2.5 rounded-xl text-[10px] border transition-colors ${
                rule.isEnabled
                  ? "bg-[#0f121a]/80 border-white/10 text-slate-300"
                  : "bg-black/10 border-white/5 text-slate-500 line-through"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rule.isEnabled}
                  onChange={() => toggleRule(rule.id)}
                  className="rounded border-white/10 bg-black text-blue-500 focus:ring-blue-500/50 cursor-pointer w-3.5 h-3.5"
                />
                <span className="font-mono text-[9px] bg-black/40 border border-white/10 px-1.5 py-0.5 rounded text-blue-400">
                  {rule.metric} {rule.operator} {rule.value}
                </span>
                <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
                  &rarr; then trigger standard <strong className="text-white font-mono text-[9.5px]">{rule.action}</strong>
                </span>
              </div>

              <button
                onClick={() => removeRule(rule.id)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-white/5 transition"
                title="Remove specific macro core"
              >
                <Trash size={12} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
