// Web Audio Synthesizer for retro games
// Safe lazy initialization to prevent browser security autoplay warnings and context errors in iframes

let audioCtx: AudioContext | null = null;
let isAudioMuted = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (isAudioMuted) return null;
  
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  // Resume context if suspended (common browser security constraint)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  
  return audioCtx;
}

export function setMuted(muted: boolean) {
  isAudioMuted = muted;
  if (muted && audioCtx) {
    audioCtx.close().then(() => {
      audioCtx = null;
    }).catch(() => {});
  } else if (!muted) {
    getAudioContext();
  }
}

export function getMuted(): boolean {
  return isAudioMuted;
}

function playTone(freq: number, type: OscillatorType, duration: number, gainStartValue: number = 0.1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Linear ramp out to sound elegant and prevent clipping pops
    gainNode.gain.setValueAtTime(gainStartValue, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Fail silently without blocking game thread
    console.warn("Audio play exception:", e);
  }
}

export function playJumpSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.15);
  } catch (e) {}
}

export function playLaserSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.12);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.15);
  } catch (e) {}
}

export function playExplosionSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.35);
    
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.4);
  } catch (e) {}
}

export function playPointSound() {
  playTone(880, "sine", 0.08, 0.15);
  setTimeout(() => {
    playTone(1320, "sine", 0.15, 0.15);
  }, 80);
}

export function playFailSound() {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(now + 0.3);
  } catch (e) {}
}
