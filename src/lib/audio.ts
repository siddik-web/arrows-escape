

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export const setSoundEnabled = (enabled: boolean) => {
  soundEnabled = enabled;
};

export const initAudio = () => {
  if (!soundEnabled) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
};

const playTone = (freq: number, type: OscillatorType, duration: number, vol = 0.1) => {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const SFX = {
  tapSuccess: (combo: number) => {
    const baseFreq = 600 + Math.min(combo, 10) * 50;
    playTone(baseFreq, "sine", 0.15, 0.1);
    setTimeout(() => playTone(baseFreq * 1.5, "sine", 0.2, 0.05), 50);
  },
  tapError: () => playTone(150, "sawtooth", 0.2, 0.05),
  bombExplosion: () => {
    playTone(100, "square", 0.3, 0.2);
    setTimeout(() => playTone(50, "sawtooth", 0.4, 0.3), 50);
  },
  winChord: () => {
    [440, 554.37, 659.25, 880].forEach((freq, i) =>
      setTimeout(() => playTone(freq, "triangle", 0.6, 0.1), i * 80)
    );
  },
  gameOver: () => {
    playTone(200, "sawtooth", 0.2, 0.2);
    setTimeout(() => playTone(150, "sawtooth", 0.3, 0.2), 200);
    setTimeout(() => playTone(100, "sawtooth", 0.5, 0.2), 500);
  },
  starPop: () => playTone(1200, "sine", 0.1, 0.1),
  countTick: () => playTone(1200, "triangle", 0.02, 0.01),
  purchase: () => {
    playTone(800, "sine", 0.1, 0.1);
    setTimeout(() => playTone(1200, "sine", 0.2, 0.1), 100);
  },
  deadlockAlarm: () => {
    playTone(300, "square", 0.2, 0.1);
    setTimeout(() => playTone(200, "square", 0.3, 0.1), 200);
    setTimeout(() => playTone(300, "square", 0.2, 0.1), 500);
  },
  deadlockResolve: () => {
    [300, 400, 500, 600, 800].forEach((freq, i) =>
      setTimeout(() => playTone(freq, "sine", 0.1, 0.1), i * 50)
    );
  },
  menuOpen: () => {
    playTone(400, "sine", 0.1, 0.05);
    setTimeout(() => playTone(600, "sine", 0.1, 0.05), 100);
  },
  menuClose: () => {
    playTone(600, "sine", 0.1, 0.05);
    setTimeout(() => playTone(400, "sine", 0.1, 0.05), 100);
  },
};
