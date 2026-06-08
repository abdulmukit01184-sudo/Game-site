import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { GameType, AutomationMode, AutomationRule } from "../types";
import {
  playJumpSound,
  playLaserSound,
  playExplosionSound,
  playPointSound,
  playFailSound
} from "../utils/audio";

interface GameCanvasProps {
  gameType: GameType;
  mode: AutomationMode;
  rules: AutomationRule[];
  isPlaying: boolean;
  onScoreUpdate: (score: number) => void;
  onCrash: () => void;
  onLog: (type: "info" | "thinking" | "action" | "success" | "error", message: string) => void;
  onMetricsUpdate: (fps: number, reactionMs: number, efficiency: number) => void;
}

export interface GameCanvasHandle {
  resetGame: () => void;
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(({
  gameType,
  mode,
  rules,
  isPlaying,
  onScoreUpdate,
  onCrash,
  onLog,
  onMetricsUpdate
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    score: 0,
    isPlaying: false,
    gameType,
    mode,
    rules,
    // Runner state
    runnerY: 0,
    runnerVelocityY: 0,
    runnerIsJumping: false,
    runnerIsSliding: false,
    runnerSlideTimer: 0,
    runnerObstacles: [] as Array<{ x: number; width: number; height: number; type: "low" | "high"; speed: number; scored: boolean }>,
    runnerDistanceToObstacle: 999,
    runnerNextObstacleType: "low" as "low" | "high",
    // Sort state
    sortCollectorX: 1, // 0: Left, 1: Middle, 2: Right
    sortSpheres: [] as Array<{ x: number; y: number; color: "cyan" | "yellow" | "red"; speed: number; scored: boolean }>,
    sortShieldHealth: 3, // out of 3 lives
    // Defender state
    defenderPlayerX: 200, // 0 to 400
    defenderBlasters: [] as Array<{ x: number; y: number; dmg: number }>,
    defenderAsteroids: [] as Array<{ x: number; y: number; size: number; speed: number; health: number; scored: boolean }>,
    defenderCoreShield: 100, // % shield
    // AI cooldowns & planning delay
    aiActionCooldown: 0,
    aiThinkingTimer: 0,
    aiThinkingTarget: null as any,
    lastAiLogs: [] as string[],
    frameCount: 0,
    lastFpsUpdateTime: 0,
    fps: 60,
    reactionMs: 40,
    efficiency: 85,
    lastTime: Date.now()
  });

  // Action helper inside game loop
  const executeRunnerJump = () => {
    if (!stateRef.current.runnerIsJumping && !stateRef.current.runnerIsSliding) {
      stateRef.current.runnerVelocityY = -12;
      stateRef.current.runnerIsJumping = true;
      playJumpSound();
      onLog("action", "[Bot Action] Jump triggered. Applied vertical momentum.");
    }
  };

  const executeRunnerSlide = () => {
    if (!stateRef.current.runnerIsJumping) {
      stateRef.current.runnerIsSliding = true;
      stateRef.current.runnerSlideTimer = 35; // Frames count
      onLog("action", "[Bot Action] Slide triggered. Reduced player vertical envelope.");
    }
  };

  const executeFusionSteer = (sector: number) => {
    if (stateRef.current.sortCollectorX !== sector) {
      stateRef.current.sortCollectorX = sector;
      playJumpSound(); // Steer sound
      const names = ["LEFT", "MIDDLE", "RIGHT"];
      onLog("action", `[Bot Action] Re-orienting magnetic collector to ${names[sector]} channel.`);
    }
  };

  const executeDefenderMove = (targetX: number) => {
    // Smoothed transition
    const diff = targetX - stateRef.current.defenderPlayerX;
    const maxSpeed = 10;
    if (Math.abs(diff) > 2) {
      stateRef.current.defenderPlayerX += Math.sign(diff) * Math.min(Math.abs(diff), maxSpeed);
    }
  };

  const executeDefenderShoot = () => {
    if (stateRef.current.aiActionCooldown <= 0) {
      stateRef.current.defenderBlasters.push({
        x: stateRef.current.defenderPlayerX + 15, // center of player (width 30)
        y: 260 // just above play-area (height is 300)
      });
      playLaserSound();
      stateRef.current.aiActionCooldown = 15; // cooldown between shots
    }
  };

  // Safe imperative reset handles
  const resetGame = () => {
    const cur = stateRef.current;
    cur.score = 0;
    cur.runnerY = 0;
    cur.runnerVelocityY = 0;
    cur.runnerIsJumping = false;
    cur.runnerIsSliding = false;
    cur.runnerSlideTimer = 0;
    cur.runnerObstacles = [];
    cur.sortCollectorX = 1;
    cur.sortSpheres = [];
    cur.sortShieldHealth = 3;
    cur.defenderPlayerX = 200;
    cur.defenderBlasters = [];
    cur.defenderAsteroids = [];
    cur.defenderCoreShield = 100;
    cur.aiActionCooldown = 0;
    cur.aiThinkingTimer = 0;
    cur.aiThinkingTarget = null;
    cur.frameCount = 0;
    cur.lastFpsUpdateTime = Date.now();
    cur.fps = 60;
    cur.reactionMs = 30;
    cur.efficiency = 90;
    
    // Initial Spawn objects
    spawnObstacle();
    spawnSphere();
    spawnAsteroid();

    onScoreUpdate(0);
    onLog("info", `Initializing game platform: [${gameType}] with automated broker [${mode}]`);
  };

  useImperativeHandle(ref, () => ({
    resetGame
  }));

  // Spawn generators
  const spawnObstacle = () => {
    const type = Math.random() > 0.4 ? "low" : "high";
    const speed = 4.5 + Math.random() * 2 + (stateRef.current.score * 0.15);
    stateRef.current.runnerObstacles.push({
      x: 420,
      width: type === "low" ? 18 : 22,
      height: type === "low" ? 22 : 18,
      type,
      speed,
      scored: false
    });
  };

  const spawnSphere = () => {
    const colors: Array<"cyan" | "yellow" | "red"> = ["cyan", "yellow", "red"];
    const randomColor = colors[Math.floor(Math.random() * 3)];
    const speed = 2.0 + Math.random() * 1.5 + (stateRef.current.score * 0.12);
    // Align horizontally strictly with the channel sectors
    const randomSector = Math.floor(Math.random() * 3);
    const sectorsX = [66, 200, 333];
    stateRef.current.sortSpheres.push({
      x: sectorsX[randomSector],
      y: -20,
      color: randomColor,
      speed,
      scored: false
    });
  };

  const spawnAsteroid = () => {
    const speed = 1.5 + Math.random() * 2 + (stateRef.current.score * 0.1);
    const size = 15 + Math.random() * 15;
    stateRef.current.defenderAsteroids.push({
      x: 30 + Math.random() * 340,
      y: -30,
      size,
      speed,
      health: Math.ceil(size / 10),
      scored: false
    });
  };

  // Bind properties to stateRef for accurate use in animation frame Loop
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.gameType = gameType;
    stateRef.current.mode = mode;
    stateRef.current.rules = rules;
  }, [isPlaying, gameType, mode, rules]);

  // Handle keys when in Manual Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const cur = stateRef.current;
      if (!cur.isPlaying || cur.mode !== AutomationMode.MANUAL) return;

      if (cur.gameType === GameType.RUNNER) {
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          executeRunnerJump();
        }
        if (e.code === "ArrowDown" || e.code === "KeyS") {
          e.preventDefault();
          executeRunnerSlide();
        }
      } else if (cur.gameType === GameType.FUSION) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          const target = Math.max(0, cur.sortCollectorX - 1);
          executeFusionSteer(target);
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          const target = Math.min(2, cur.sortCollectorX + 1);
          executeFusionSteer(target);
        }
        // Numeric direct selector keys
        if (e.code === "Digit1") executeFusionSteer(0);
        if (e.code === "Digit2") executeFusionSteer(1);
        if (e.code === "Digit3") executeFusionSteer(2);
      } else if (cur.gameType === GameType.DEFENDER) {
        if (e.code === "ArrowLeft" || e.code === "KeyA") {
          e.preventDefault();
          executeDefenderMove(Math.max(0, cur.defenderPlayerX - 25));
        }
        if (e.code === "ArrowRight" || e.code === "KeyD") {
          e.preventDefault();
          executeDefenderMove(Math.min(370, cur.defenderPlayerX + 25));
        }
        if (e.code === "Space" || e.code === "ArrowUp") {
          e.preventDefault();
          executeDefenderShoot();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Main Canvas game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      // 1. CLEAR & BACKGROUND RENDER
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 400, 300);

      // Render futuristic cyber grid lines
      ctx.strokeStyle = "rgba(100, 116, 139, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 400; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 300);
        ctx.stroke();
      }
      for (let y = 0; y < 300; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(400, y);
        ctx.stroke();
      }

      const cur = stateRef.current;
      const gameIsActive = cur.isPlaying;

      // Calculate performance metrics periodically
      cur.frameCount++;
      const now = Date.now();
      if (now - cur.lastFpsUpdateTime > 1000) {
        cur.fps = Math.round((cur.frameCount * 1000) / (now - cur.lastFpsUpdateTime));
        cur.frameCount = 0;
        cur.lastFpsUpdateTime = now;

        // Auto report metrics
        const baseReactionMs =
          cur.mode === AutomationMode.GEMINI_FLASH ? 12 :
          cur.mode === AutomationMode.CHATGPT_4O ? 28 :
          cur.mode === AutomationMode.DEEPSEEK_R1 ? 160 : 45; // custom simulation
        cur.reactionMs = Math.round(baseReactionMs + Math.random() * 5);
        cur.efficiency = 
          cur.mode === AutomationMode.MANUAL ? 70 :
          cur.mode === AutomationMode.DEEPSEEK_R1 ? 98 :
          cur.mode === AutomationMode.CHATGPT_4O ? 94 :
          cur.mode === AutomationMode.GEMINI_FLASH ? 92 : 80;

        onMetricsUpdate(cur.fps, cur.reactionMs, cur.efficiency);
      }

      // Reduce cooldowns
      if (cur.aiActionCooldown > 0) cur.aiActionCooldown--;

      // 2. RUN INDIVIDUAL GAMES
      if (cur.gameType === GameType.RUNNER) {
        // ================= RUNNER GAME ENGINE =================
        const groundY = 240;
        const playerX = 60;
        const playerSize = cur.runnerIsSliding ? 14 : 26;
        const playerY = groundY - playerSize - cur.runnerY;

        // Apply physics
        if (gameIsActive) {
          if (cur.runnerIsJumping) {
            cur.runnerY -= cur.runnerVelocityY;
            cur.runnerVelocityY += 0.55; // gravity
            if (cur.runnerY <= 0) {
              cur.runnerY = 0;
              cur.runnerVelocityY = 0;
              cur.runnerIsJumping = false;
            }
          }

          if (cur.runnerIsSliding) {
            cur.runnerSlideTimer--;
            if (cur.runnerSlideTimer <= 0) {
              cur.runnerIsSliding = false;
            }
          }

          // Move obstacles
          if (Math.random() < 0.015 && cur.runnerObstacles.length < 3) {
            // Check spacing of last spawned
            const lastObstacle = cur.runnerObstacles[cur.runnerObstacles.length - 1];
            if (!lastObstacle || lastObstacle.x < 240) {
              spawnObstacle();
            }
          }

          for (let i = cur.runnerObstacles.length - 1; i >= 0; i--) {
            const obs = cur.runnerObstacles[i];
            obs.x -= obs.speed;

            // Score point
            if (obs.x < playerX && !obs.scored) {
              obs.scored = true;
              cur.score++;
              onScoreUpdate(cur.score);
              playPointSound();
              onLog("success", `System Dodged Obstacle: Score Incremented to ${cur.score}`);
            }

            // Collision check
            const obsY = obs.type === "low" ? groundY - obs.height : groundY - obs.height - 35; // high obstacle
            const collisionX = (playerX < obs.x + obs.width) && (playerX + 26 > obs.x);
            const collisionY = (playerY < obsY + obs.height) && (playerY + playerSize > obsY);

            if (collisionX && collisionY) {
              // Crash!
              gameCrashDetected();
              break;
            }

            // Filter out-of-screen obstacles
            if (obs.x < -40) {
              cur.runnerObstacles.splice(i, 1);
            }
          }
        }

        // --- RUNNER DESIGN RENDERING ---
        // Render neon horizon floor
        const groundGrad = ctx.createLinearGradient(0, groundY, 400, groundY + 10);
        groundGrad.addColorStop(0, "rgba(59, 130, 246, 0.4)");
        groundGrad.addColorStop(1, "rgba(168, 85, 247, 0.4)");
        ctx.strokeStyle = groundGrad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(400, groundY);
        ctx.stroke();

        // Glow grid under floor
        ctx.strokeStyle = "rgba(124, 58, 237, 0.15)";
        ctx.lineWidth = 1;
        for (let ix = -cur.frameCount % 20; ix < 400; ix += 20) {
          ctx.beginPath();
          ctx.moveTo(ix, groundY);
          ctx.lineTo(ix - 30, 300);
          ctx.stroke();
        }

        // Draw Player (Glowing Cyan Cyber Box)
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#06b6d4";
        ctx.fillStyle = "#06b6d4";
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(playerX, playerY, 26, playerSize, 4);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset glow

        // Jet booster flames animation
        if (!cur.runnerIsSliding && gameIsActive) {
          ctx.beginPath();
          ctx.fillStyle = Math.random() > 0.5 ? "#f97316" : "#ef4444";
          ctx.moveTo(playerX - 2, playerY + 8);
          ctx.lineTo(playerX - 10 - Math.random() * 8, playerY + 13);
          ctx.lineTo(playerX - 2, playerY + 18);
          ctx.fill();
        }

        // Draw Obstacles (Beams & Drones)
        cur.runnerObstacles.forEach((obs) => {
          const obsY = obs.type === "low" ? groundY - obs.height : groundY - obs.height - 35;
          ctx.shadowBlur = 10;
          ctx.shadowColor = obs.type === "low" ? "#ef4444" : "#ec4899";
          ctx.fillStyle = obs.type === "low" ? "#ef4444" : "#ec4899";

          ctx.beginPath();
          if (obs.type === "low") {
            // Neon red hazard crystals
            ctx.moveTo(obs.x + obs.width / 2, obsY);
            ctx.lineTo(obs.x + obs.width, obsY + obs.height);
            ctx.lineTo(obs.x, obsY + obs.height);
            ctx.closePath();
            ctx.fill();
          } else {
            // High hovering pink tracking drone
            ctx.roundRect(obs.x, obsY, obs.width, obs.height, 4);
            ctx.fill();
            // Blinking scan scanner beam
            ctx.fillStyle = "rgba(236, 72, 153, 0.2)";
            ctx.fillRect(obs.x - 2, obsY + obs.height, obs.width + 4, 38);
          }
          ctx.shadowBlur = 0;
        });

        // AI DECISION / REFLEX BRAIN INTERFACE
        if (gameIsActive && cur.mode !== AutomationMode.MANUAL) {
          // Identify closest upcoming threat
          const threat = cur.runnerObstacles.find((o) => o.x > playerX + 10);
          if (threat) {
            const distance = threat.x - playerX;
            cur.runnerDistanceToObstacle = Math.round(distance);
            cur.runnerNextObstacleType = threat.type;

            // Draw vector scanning line
            ctx.strokeStyle = "rgba(34, 197, 94, 0.4)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(playerX + 26, playerY + playerSize / 2);
            ctx.lineTo(threat.x, groundY - threat.height / 2 - (threat.type === "high" ? 35 : 0));
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw Warning Box on top of Canvas
            ctx.fillStyle = "rgba(34, 197, 94, 0.1)";
            ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
            ctx.lineWidth = 1;
            ctx.fillRect(threat.x - 5, groundY - 80, threat.width + 10, 80);
            ctx.strokeRect(threat.x - 5, groundY - 80, threat.width + 10, 80);

            // Draw target point
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.arc(threat.x, groundY - (threat.type === "high" ? 44 : 10), 4, 0, Math.PI * 2);
            ctx.fill();

            // Run automated triggers
            runRunnerAutomation(threat, distance);
          } else {
            cur.runnerDistanceToObstacle = 999;
          }
        }

      } else if (cur.gameType === GameType.FUSION) {
        // ================= QUANTUM FUSION GAME ENGINE =================
        const collectorY = 250;
        const widthSector = 133;
        const selectorPositions = [0, 1, 2];

        // Move Spheres
        if (gameIsActive) {
          if (Math.random() < 0.015 && cur.sortSpheres.length < 4) {
            spawnSphere();
          }

          for (let i = cur.sortSpheres.length - 1; i >= 0; i--) {
            const sp = cur.sortSpheres[i];
            sp.y += sp.speed;

            // Check boundary landing
            if (sp.y >= collectorY - 14) {
              // Check landing sector match
              const sphereSector = Math.floor(sp.x / 133);
              const collides = (sphereSector === cur.sortCollectorX);

              if (collides) {
                // Check color match logic
                const collectorColor = cur.sortCollectorX === 0 ? "cyan" : cur.sortCollectorX === 1 ? "yellow" : "red";
                if (sp.color === collectorColor) {
                  // Perfect match!
                  cur.score++;
                  onScoreUpdate(cur.score);
                  playPointSound();
                  onLog("success", `Quantum Core Fusion: Matched [${sp.color.toUpperCase()}] Energy, Core Restruct Completed.`);
                } else {
                  // Mismatched sector color
                  cur.sortShieldHealth--;
                  playFailSound();
                  onLog("error", `Mismatched Singularity color [${sp.color.toUpperCase()}] landing in [${collectorColor.toUpperCase()}] chamber!`);
                  if (cur.sortShieldHealth <= 0) {
                    gameCrashDetected();
                  }
                }
              } else {
                // Missed collector core completely
                cur.sortShieldHealth--;
                playFailSound();
                onLog("error", `Quantum Core Missed [${sp.color.toUpperCase()}] particle drop!`);
                if (cur.sortShieldHealth <= 0) {
                  gameCrashDetected();
                }
              }

              // Remove sphere
              cur.sortSpheres.splice(i, 1);
              continue;
            }
          }
        }

        // --- RENDER FUSION LAYOUT ---
        // Draw Sector partitions
        ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(133, 0);
        ctx.lineTo(133, 300);
        ctx.moveTo(266, 0);
        ctx.lineTo(266, 300);
        ctx.stroke();

        // Draw Collector Core base
        const colX = cur.sortCollectorX * 133;
        const themeC = cur.sortCollectorX === 0 ? "#06b6d4" : cur.sortCollectorX === 1 ? "#eab308" : "#f43f5e";
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = themeC;
        ctx.fillStyle = themeC;
        ctx.beginPath();
        ctx.roundRect(colX + 16, collectorY, 100, 20, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Core Chamber grid connectors
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.strokeRect(colX + 22, collectorY + 4, 88, 12);

        // Render targets preview text on collector channels
        ctx.font = "10px var(--font-mono)";
        ctx.fillStyle = "rgba(6, 182, 212, 0.5)";
        ctx.fillText("CYAN FLOW", 36, 290);
        ctx.fillStyle = "rgba(234, 179, 8, 0.5)";
        ctx.fillText("YELLOW FLOW", 164, 290);
        ctx.fillStyle = "rgba(244, 63, 94, 0.5)";
        ctx.fillText("RED FLOW", 308, 290);

        // Draw actual spheres with cyber core style
        cur.sortSpheres.forEach((sp) => {
          ctx.shadowBlur = 8;
          ctx.shadowColor = sp.color === "cyan" ? "#06b6d4" : sp.color === "yellow" ? "#eab308" : "#f43f5e";
          ctx.fillStyle = sp.color === "cyan" ? "#06b6d4" : sp.color === "yellow" ? "#eab308" : "#f43f5e";

          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Core inner circle
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
        });

        // Lives Indicator (Quantum Batteries)
        ctx.font = "11px var(--font-display)";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("SHIELD CELLS:", 10, 20);
        for (let j = 0; j < 3; j++) {
          ctx.fillStyle = j < cur.sortShieldHealth ? "#22c55e" : "#475569";
          ctx.fillRect(100 + j * 16, 11, 10, 10);
        }

        // FUSION AUTOMATION PROCESSOR
        if (gameIsActive && cur.mode !== AutomationMode.MANUAL) {
          // Identify closest descending threat
          const sphere = cur.sortSpheres.find((s) => s.y < collectorY && s.y > -10);
          if (sphere) {
            const distY = collectorY - sphere.y;
            // Draw predictive analysis laser vector
            ctx.strokeStyle = "rgba(234, 179, 8, 0.35)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 5]);
            ctx.beginPath();
            ctx.moveTo(sphere.x, sphere.y);
            ctx.lineTo(sphere.x, collectorY);
            ctx.stroke();
            ctx.setLineDash([]);

            runFusionAutomation(sphere, distY);
          }
        }

      } else if (cur.gameType === GameType.DEFENDER) {
        // ================= AEGIS CYBER DEFENDER ENGINE =================
        const defenderY = 265;
        const shipWidth = 30;

        if (gameIsActive) {
          // Shift Asteroids down
          if (Math.random() < 0.02 && cur.defenderAsteroids.length < 5) {
            spawnAsteroid();
          }

          // Move Lasers / Blasters
          for (let l = cur.defenderBlasters.length - 1; l >= 0; l--) {
            const b = cur.defenderBlasters[l];
            b.y -= 7.5; // blaster speed

            // Collision with asteroids check
            let hit = false;
            for (let a = cur.defenderAsteroids.length - 1; a >= 0; a--) {
              const ast = cur.defenderAsteroids[a];
              const dist = Math.hypot(b.x - ast.x, b.y - ast.y);
              if (dist < ast.size / 2 + 5) {
                // Damage asteroid
                ast.health--;
                hit = true;
                if (ast.health <= 0) {
                  cur.score += Math.round(ast.size / 5);
                  onScoreUpdate(cur.score);
                  playExplosionSound();
                  onLog("success", `Asteroid node disintegrated! High Yield. Total score: ${cur.score}`);
                  cur.defenderAsteroids.splice(a, 1);
                } else {
                  playPointSound();
                }
                break;
              }
            }

            if (hit || b.y < -10) {
              cur.defenderBlasters.splice(l, 1);
            }
          }

          // Moving asteroids
          for (let a = cur.defenderAsteroids.length - 1; a >= 0; a--) {
            const ast = cur.defenderAsteroids[a];
            ast.y += ast.speed;

            // Core hits Aegis shield
            if (ast.y >= defenderY - 8) {
              cur.defenderCoreShield -= Math.round(ast.size / 2);
              playFailSound();
              onLog("error", `Aegis Shield impacted! Ground Defense Grid integrity reduced to ${cur.defenderCoreShield}%`);
              cur.defenderAsteroids.splice(a, 1);
              if (cur.defenderCoreShield <= 0) {
                cur.defenderCoreShield = 0;
                gameCrashDetected();
              }
              continue;
            }
          }
        }

        // --- RENDER DEFENDER ---
        // Render shield energy line
        ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, defenderY + 12);
        ctx.lineTo(400, defenderY + 12);
        ctx.stroke();

        // Draw Player Rocket Platform
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#a855f7";
        ctx.fillStyle = "#a855f7";
        ctx.beginPath();
        ctx.fillRect(cur.defenderPlayerX, defenderY, shipWidth, 12);
        // Laser battery tip
        ctx.fillRect(cur.defenderPlayerX + 11, defenderY - 6, 8, 8);
        ctx.shadowBlur = 0;

        // Draw laser tracers
        cur.defenderBlasters.forEach((b) => {
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x, b.y + 10);
          ctx.stroke();
        });

        // Draw Asteroids (Glow rock elements)
        cur.defenderAsteroids.forEach((ast) => {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#f97316";
          ctx.fillStyle = "#27272a";
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.arc(ast.x, ast.y, ast.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;

          // HP indicators
          ctx.font = "8px var(--font-mono)";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(ast.health.toString(), ast.x, ast.y + 3);
          ctx.textAlign = "start";
        });

        // HP Shield level bar on interface
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "11px var(--font-display)";
        ctx.fillText(`AEGIS SHIELD: ${Math.max(0, cur.defenderCoreShield)}%`, 10, 20);

        ctx.fillStyle = "rgba(51, 65, 85, 0.5)";
        ctx.fillRect(140, 10, 100, 10);
        const hpWidth = Math.max(0, Math.min(100, cur.defenderCoreShield));
        ctx.fillStyle = hpWidth > 40 ? "#22c55e" : hpWidth > 20 ? "#eab308" : "#ef4444";
        ctx.fillRect(140, 10, hpWidth, 10);

        // AEGIS AUTOMATION PROCESSOR
        if (gameIsActive && cur.mode !== AutomationMode.MANUAL) {
          // Identify closest upcoming asteroid/comet
          const activeAst = cur.defenderAsteroids.find((as) => as.y < defenderY && as.y > -20);
          if (activeAst) {
            ctx.strokeStyle = "rgba(168, 85, 247, 0.4)";
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cur.defenderPlayerX + 15, defenderY);
            ctx.lineTo(activeAst.x, activeAst.y);
            ctx.stroke();
            ctx.setLineDash([]);

            runDefenderAutomation(activeAst);
          }
        }
      }

      // Render overlay when elements are paused
      if (!gameIsActive) {
        ctx.fillStyle = "rgba(11, 15, 25, 0.72)";
        ctx.fillRect(0, 0, 400, 300);

        ctx.font = "16px var(--font-display)";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("PLATFORM ON STANDBY", 200, 130);

        ctx.font = "12px var(--font-mono)";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText("Select controller & press Initialize to play", 200, 160);
        ctx.textAlign = "start";
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // COLLISION CRASH SYSTEM
  const gameCrashDetected = () => {
    stateRef.current.isPlaying = false;
    playExplosionSound();
    onLog("error", "================ SYSTEM FAILURE DISCOVERED ================");
    onLog("error", `Core Simulation crashed. Final Score reached: ${stateRef.current.score}`);
    onCrash();
  };

  // AUTOMATION EXECUTION AGENTS
  // 1. RUNNER AUTOMATOR
  const runRunnerAutomation = (threat: any, distance: number) => {
    const cur = stateRef.current;
    
    // Custom automation rules script
    if (cur.mode === AutomationMode.CUSTOM_SCRIPT) {
      cur.rules.forEach((rule) => {
        if (!rule.isEnabled) return;
        let meetsCriteria = false;
        
        if (rule.metric === "obstacleDistance") {
          const checkVal = distance;
          if (rule.operator === "<" && checkVal < rule.value) meetsCriteria = true;
          if (rule.operator === ">" && checkVal > rule.value) meetsCriteria = true;
          if (rule.operator === "==" && Math.abs(checkVal - rule.value) < 5) meetsCriteria = true;
        }

        if (meetsCriteria) {
          if (rule.action === "JUMP" && threat.type === "low") {
            executeRunnerJump();
          } else if (rule.action === "SLIDE" && threat.type === "high") {
            executeRunnerSlide();
          }
        }
      });
      return;
    }

    // AI Simulated Agents
    const jumpTriggerDistance = 145;
    const slideTriggerDistance = 150;

    if (cur.mode === AutomationMode.GEMINI_FLASH) {
      // Blazing reflex - instantly do actions inside trigger scope
      if (threat.type === "low" && distance < jumpTriggerDistance) {
        executeRunnerJump();
      } else if (threat.type === "high" && distance < slideTriggerDistance) {
        executeRunnerSlide();
      }
    }

    else if (cur.mode === AutomationMode.CHATGPT_4O) {
      // Strategic planner
      if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== threat) {
        cur.aiThinkingTarget = threat;
        onLog("thinking", `[GPT-4o Matrix] Locked onto hazard cluster. Estimated threat index: 9.2. Executing precise arrival pathing.`);
      }

      if (threat.type === "low" && distance < jumpTriggerDistance) {
        executeRunnerJump();
      } else if (threat.type === "high" && distance < slideTriggerDistance) {
        executeRunnerSlide();
      }
    }

    else if (cur.mode === AutomationMode.DEEPSEEK_R1) {
      // Deep reasoning chain simulation
      if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== threat) {
        cur.aiThinkingTarget = threat;
        cur.aiThinkingTimer = 20; // 20 frames of deep logical trace

        const thoughtChains = [
          "<thinking> Scan: Speed = " + threat.speed.toFixed(1) + ", DeltaX = " + distance.toFixed(0) + ". Identified structural risk. Jump calculation necessary.",
          "<thinking> Verification: If we jump at d=" + distance.toFixed(0) + ", player will clear crystal boundary. Jump duration estimated at 24 frames. Executing optimal liftoff...",
          "<thinking> Reflex core evaluation: DeepSeek validation matrix confirms JUMP vector is safe. Preparing coil discharge."
        ];
        onLog("thinking", thoughtChains[0]);
        setTimeout(() => {
          if (cur.aiThinkingTarget === threat) onLog("thinking", thoughtChains[1]);
        }, 150);
        setTimeout(() => {
          if (cur.aiThinkingTarget === threat) onLog("thinking", thoughtChains[2]);
        }, 300);
      }

      if (cur.aiThinkingTimer > 0) {
        cur.aiThinkingTimer--;
      } else {
        if (threat.type === "low" && distance < jumpTriggerDistance) {
          executeRunnerJump();
        } else if (threat.type === "high" && distance < slideTriggerDistance) {
          executeRunnerSlide();
        }
      }
    }
  };

  // 2. FUSION AUTOMATOR
  const runFusionAutomation = (sphere: any, distY: number) => {
    const cur = stateRef.current;
    const targetSector = Math.floor(sphere.x / 133);

    if (cur.mode === AutomationMode.CUSTOM_SCRIPT) {
      cur.rules.forEach((rule) => {
        if (!rule.isEnabled) return;
        let meetsCriteria = false;

        if (rule.metric === "colorMatch") {
          // Rule checks color condition (e.g. is sphere close to land)
          const checkVal = distY;
          if (rule.operator === "<" && checkVal < rule.value) meetsCriteria = true;
        }

        if (meetsCriteria) {
          executeFusionSteer(targetSector);
        }
      });
      return;
    }

    // AI models steer
    if (distY < 180) {
      if (cur.mode === AutomationMode.GEMINI_FLASH) {
        executeFusionSteer(targetSector);
      }
      
      else if (cur.mode === AutomationMode.CHATGPT_4O) {
        if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== sphere) {
          cur.aiThinkingTarget = sphere;
          onLog("thinking", `[GPT-4o Neural Map] Spherical entity detected in channel ${targetSector}. Aligning magnetic converter to matches.`);
        }
        executeFusionSteer(targetSector);
      }

      else if (cur.mode === AutomationMode.DEEPSEEK_R1) {
        if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== sphere) {
          cur.aiThinkingTarget = sphere;
          onLog("thinking", `<thinking> DeepSeek Core: Scanning color spectrum: [${sphere.color}]. Sector location: ${targetSector}. Target density is normal. Aligning magnet elements inside 12ms. </thinking>`);
        }
        executeFusionSteer(targetSector);
      }
    }
  };

  // 3. DEFENDER AUTOMATOR
  const runDefenderAutomation = (asteroid: any) => {
    const cur = stateRef.current;

    if (cur.mode === AutomationMode.CUSTOM_SCRIPT) {
      cur.rules.forEach((rule) => {
        if (!rule.isEnabled) return;
        if (rule.metric === "enemyAlignY" && asteroid.y > rule.value) {
          // Align and trigger weapon
          executeDefenderMove(Math.max(0, Math.min(370, asteroid.x - 15)));
          if (Math.abs(cur.defenderPlayerX - (asteroid.x - 15)) < 15) {
            executeDefenderShoot();
          }
        }
      });
      return;
    }

    // AI Models Autoplay
    // Track asteroid horizontally
    const targetShipX = Math.max(0, Math.min(370, asteroid.x - 15));
    executeDefenderMove(targetShipX);

    // If aligned within range, shoot!
    if (Math.abs(cur.defenderPlayerX - targetShipX) < 18) {
      if (cur.mode === AutomationMode.GEMINI_FLASH) {
        executeDefenderShoot();
      }

      else if (cur.mode === AutomationMode.CHATGPT_4O) {
        if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== asteroid) {
          cur.aiThinkingTarget = asteroid;
          onLog("thinking", `[GPT-4o Targeter] Lock acquired at x=${asteroid.x.toFixed(0)}, y=${asteroid.y.toFixed(0)}. Commencing laser assault.`);
        }
        executeDefenderShoot();
      }

      else if (cur.mode === AutomationMode.DEEPSEEK_R1) {
        if (!cur.aiThinkingTarget || cur.aiThinkingTarget !== asteroid) {
          cur.aiThinkingTarget = asteroid;
          onLog("thinking", `<thinking> Target locked: Comet x=${asteroid.x.toFixed(1)}. Calculating ballistic interception angle under continuous gravity simulation... Aligning heavy rail gun battery. </thinking>`);
        }
        executeDefenderShoot();
      }
    }
  };

  return (
    <div className="relative border border-white/10 rounded-xl overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.1)] bg-[#0f121a]">
      <canvas
        id="game-automator-canvas"
        ref={canvasRef}
        width={400}
        height={300}
        className="w-full flex block aspect-[4/3] bg-[#0f121a] object-contain selection:bg-transparent"
      />
      
      {/* Canvas Manual Controls Overlay for mobile or quick clicks */}
      {isPlaying && (
        <div className="absolute bottom-2 right-2 flex gap-2 pointer-events-auto">
          {gameType === GameType.RUNNER && (
            <>
              <button
                id="runner-jump-btn"
                onClick={executeRunnerJump}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold font-display cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase transition shadow-[0_0_10px_rgba(59,130,246,0.2)]"
              >
                Jump (↑)
              </button>
              <button
                id="runner-slide-btn"
                onClick={executeRunnerSlide}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold font-display cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed uppercase transition"
              >
                Slide (↓)
              </button>
            </>
          )}

          {gameType === GameType.FUSION && (
            <>
              <button
                id="fusion-left-btn"
                onClick={() => executeFusionSteer(0)}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold font-mono cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Cyan (1)
              </button>
              <button
                id="fusion-mid-btn"
                onClick={() => executeFusionSteer(1)}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-2.5 py-1.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-xs font-bold font-mono cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Yel (2)
              </button>
              <button
                id="fusion-right-btn"
                onClick={() => executeFusionSteer(2)}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold font-mono cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Red (3)
              </button>
            </>
          )}

          {gameType === GameType.DEFENDER && (
            <>
              <button
                id="defender-left-btn"
                onClick={() => executeDefenderMove(Math.max(0, stateRef.current.defenderPlayerX - 40))}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ◀ Left
              </button>
              <button
                id="defender-shoot-btn"
                onClick={executeDefenderShoot}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold font-display cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Fire (Space)
              </button>
              <button
                id="defender-right-btn"
                onClick={() => executeDefenderMove(Math.min(370, stateRef.current.defenderPlayerX + 40))}
                disabled={mode !== AutomationMode.MANUAL}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Right ▶
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

GameCanvas.displayName = "GameCanvas";
