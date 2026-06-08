export enum GameType {
  RUNNER = "RUNNER",
  FUSION = "FUSION",
  DEFENDER = "DEFENDER"
}

export enum AutomationMode {
  MANUAL = "MANUAL",
  DEEPSEEK_R1 = "DEEPSEEK_R1",
  CHATGPT_4O = "CHATGPT_4O",
  GEMINI_FLASH = "GEMINI_FLASH",
  CUSTOM_SCRIPT = "CUSTOM_SCRIPT"
}

export interface LogEntry {
  id: string;
  time: string;
  type: "info" | "thinking" | "action" | "success" | "error";
  message: string;
  model: AutomationMode;
}

export interface AutomationRule {
  id: string;
  metric: string;        // e.g., "obstacleDistance", "enemyAlignY", "colorMatch"
  operator: "<" | ">" | "==";
  value: number;
  action: string;        // e.g., "JUMP", "SLIDE", "MOVE_LEFT", "MOVE_RIGHT", "FIRE"
  isEnabled: boolean;
}

export interface MetricPoint {
  time: number;
  score: number;
  reactionTime: number;
  automationAccuracy: number;
  fps: number;
}

export interface GameMetrics {
  score: number;
  highScore: number;
  activeAutomationsCount: number;
  reactionTimeMs: number;
  autonomousMoves: number;
  totalRuns: number;
}
