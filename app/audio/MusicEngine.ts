import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

const SAMPLE_RATE = 44100;

// ── WAV encoding helpers ──────────────────────────────────────

function writeStr(view: DataView, offset: number, s: string): void {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}

interface SegmentOpts {
  waveType: 'sine' | 'square';
  startFreq: number;
  endFreq?: number;
  durationMs: number;
  attackMs?: number;
  decayMs?: number;
  volume?: number;
}

function makeSegment(o: SegmentOpts): Float32Array {
  const { waveType, startFreq, durationMs, volume = 1 } = o;
  const endFreq    = o.endFreq  ?? startFreq;
  const attackMs   = o.attackMs ?? 5;
  const numSamples = Math.ceil(SAMPLE_RATE * durationMs / 1000);
  const attackN    = Math.floor(SAMPLE_RATE * attackMs / 1000);
  const decayN     = o.decayMs != null
    ? Math.floor(SAMPLE_RATE * o.decayMs / 1000)
    : numSamples - attackN;

  const out = new Float32Array(numSamples);
  let phase = 0;

  for (let i = 0; i < numSamples; i++) {
    const progress = numSamples > 1 ? i / (numSamples - 1) : 0;
    const freq     = startFreq + (endFreq - startFreq) * progress;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    let env: number;
    if (i < attackN) {
      env = attackN > 0 ? i / attackN : 1;
    } else {
      const d = i - attackN;
      env = decayN > 0 ? Math.max(0, 1 - d / decayN) : 1;
    }

    const wave = waveType === 'sine'
      ? Math.sin(phase)
      : (Math.sign(Math.sin(phase)) || 1);

    out[i] = wave * env * volume;
  }

  return out;
}

function silence(ms: number): Float32Array {
  return new Float32Array(Math.ceil(SAMPLE_RATE * ms / 1000));
}

function toWAV(segments: Float32Array[]): string {
  const total     = segments.reduce((n, s) => n + s.length, 0);
  const dataBytes = total * 2;
  const buf       = new ArrayBuffer(44 + dataBytes);
  const view      = new DataView(buf);

  writeStr(view, 0,  'RIFF');
  view.setUint32(4,  36 + dataBytes, true);
  writeStr(view, 8,  'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16,          true);
  view.setUint16(20, 1,           true); // PCM
  view.setUint16(22, 1,           true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2,           true);
  view.setUint16(34, 16,          true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataBytes,   true);

  let offset = 44;
  for (const seg of segments) {
    for (let i = 0; i < seg.length; i++) {
      const s = Math.max(-1, Math.min(1, seg[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }
  }

  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

// ── Stem builders ─────────────────────────────────────────────

function buildBase(): string {
  // heartbeat pulse, 70 BPM — 4-beat loop ~3428ms
  const beatMs = (60 / 70) * 1000;
  const restMs = beatMs - 80;
  const hit    = makeSegment({ waveType: 'sine', startFreq: 55, durationMs: 80, attackMs: 5, decayMs: 75, volume: 0.8 });
  const rest   = silence(restMs);
  return toWAV([hit, rest, hit, rest, hit, rest, hit, rest]);
}

function buildBeat(): string {
  // rhythmic groove, 85 BPM — 4-beat loop ~2824ms
  const beatMs  = (60 / 85) * 1000;
  const hit1    = makeSegment({ waveType: 'square', startFreq: 110, durationMs: 60,  attackMs: 3, decayMs: 57, volume: 0.7 });
  const gap1    = silence(140); // reach the 200ms sub-hit mark
  const hit2    = makeSegment({ waveType: 'sine',   startFreq: 220, durationMs: 40,  attackMs: 5, decayMs: 35, volume: 0.5 });
  const restMs  = beatMs - 60 - 140 - 40;
  const rest    = silence(restMs);
  const oneBeat: Float32Array[] = [hit1, gap1, hit2, rest];
  return toWAV([...oneBeat, ...oneBeat, ...oneBeat, ...oneBeat]);
}

function buildMelody(): string {
  // ascending 4-note figure, looped twice — ~2760ms total
  const figure: Float32Array[] = [
    makeSegment({ waveType: 'sine', startFreq: 261, durationMs: 180, attackMs: 10, decayMs: 170, volume: 0.7 }),
    makeSegment({ waveType: 'sine', startFreq: 329, durationMs: 180, attackMs: 10, decayMs: 170, volume: 0.7 }),
    makeSegment({ waveType: 'sine', startFreq: 392, durationMs: 180, attackMs: 10, decayMs: 170, volume: 0.7 }),
    makeSegment({ waveType: 'sine', startFreq: 523, durationMs: 240, attackMs: 10, decayMs: 230, volume: 0.7 }),
    silence(600),
  ];
  return toWAV([...figure, ...figure]);
}

function buildTension(): string {
  // low drone 40Hz for 3200ms, with 80Hz square pulses layered at 800ms and 2100ms
  const totalSamples  = Math.ceil(SAMPLE_RATE * 3200 / 1000);
  const pulseSamples  = Math.ceil(SAMPLE_RATE * 120  / 1000);
  const pulse1Start   = Math.floor(SAMPLE_RATE * 800  / 1000);
  const pulse2Start   = Math.floor(SAMPLE_RATE * 2100 / 1000);
  const combined      = new Float32Array(totalSamples);

  let phase = 0;
  for (let i = 0; i < totalSamples; i++) {
    phase += (2 * Math.PI * 40) / SAMPLE_RATE;
    combined[i] = Math.sin(phase) * 0.6;
  }

  for (const startIdx of [pulse1Start, pulse2Start]) {
    let pulsePhase = 0;
    for (let i = 0; i < pulseSamples && (startIdx + i) < totalSamples; i++) {
      pulsePhase += (2 * Math.PI * 80) / SAMPLE_RATE;
      combined[startIdx + i] += (Math.sign(Math.sin(pulsePhase)) || 1) * 0.4;
    }
  }

  for (let i = 0; i < totalSamples; i++) {
    combined[i] = Math.max(-1, Math.min(1, combined[i]));
  }

  return toWAV([combined]);
}

function buildBoss(): string {
  // descending confrontation motif — ~2600ms
  return toWAV([
    makeSegment({ waveType: 'sine', startFreq: 196, durationMs: 300, attackMs: 20, decayMs: 280, volume: 0.8 }),
    silence(400),
    makeSegment({ waveType: 'sine', startFreq: 165, durationMs: 300, attackMs: 20, decayMs: 280, volume: 0.8 }),
    silence(400),
    makeSegment({ waveType: 'sine', startFreq: 130, durationMs: 400, attackMs: 20, decayMs: 380, volume: 0.8 }),
    silence(800),
  ]);
}

// ── Types & constants ─────────────────────────────────────────

export type MusicState = 'off' | 'neutral' | 'rhythm' | 'onARun' | 'crisis' | 'boss';

type StemKey = 'base' | 'beat' | 'melody' | 'tension' | 'boss';

const STEM_KEYS: StemKey[] = ['base', 'beat', 'melody', 'tension', 'boss'];

const VOLUME_TARGETS: Record<Exclude<MusicState, 'off'>, Record<StemKey, number>> = {
  neutral: { base: 0.40, beat: 0.00, melody: 0.00, tension: 0.00, boss: 0.00 },
  rhythm:  { base: 0.40, beat: 0.50, melody: 0.00, tension: 0.00, boss: 0.00 },
  onARun:  { base: 0.40, beat: 0.60, melody: 0.50, tension: 0.00, boss: 0.00 },
  crisis:  { base: 0.30, beat: 0.20, melody: 0.00, tension: 0.55, boss: 0.00 },
  boss:    { base: 0.00, beat: 0.00, melody: 0.00, tension: 0.00, boss: 0.70 },
};

// ── Engine state ──────────────────────────────────────────────

const players: Record<StemKey, AudioPlayer | null> = {
  base: null, beat: null, melody: null, tension: null, boss: null,
};

const fadeRafIds: Record<StemKey, number | null> = {
  base: null, beat: null, melody: null, tension: null, boss: null,
};

let currentState: MusicState = 'off';
let engineReady = false;

// ── Volume fading ─────────────────────────────────────────────

function fadeVolumeTo(key: StemKey, targetVolume: number, durationMs: number): void {
  const player = players[key];
  if (!player) return;

  if (fadeRafIds[key] !== null) {
    cancelAnimationFrame(fadeRafIds[key]!);
    fadeRafIds[key] = null;
  }

  const startVolume = player.volume;
  const startTime   = performance.now();

  function tick(): void {
    if (!player) { fadeRafIds[key] = null; return; }
    try {
      const elapsed = performance.now() - startTime;
      const t       = Math.min(elapsed / durationMs, 1);
      player.volume = startVolume + (targetVolume - startVolume) * t;
      if (t < 1) {
        fadeRafIds[key] = requestAnimationFrame(tick);
      } else {
        fadeRafIds[key] = null;
      }
    } catch {
      fadeRafIds[key] = null;
    }
  }

  fadeRafIds[key] = requestAnimationFrame(tick);
}

// ── Public API ────────────────────────────────────────────────

export async function initMusicEngine(): Promise<void> {
  if (engineReady) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode:      true,
      shouldPlayInBackground: false,
      interruptionMode:       'duckOthers',
    });

    const builders: [StemKey, () => string][] = [
      ['base',    buildBase],
      ['beat',    buildBeat],
      ['melody',  buildMelody],
      ['tension', buildTension],
      ['boss',    buildBoss],
    ];

    for (const [key, build] of builders) {
      try {
        const player  = createAudioPlayer({ uri: build() });
        player.volume = 0;
        player.loop   = true;
        players[key]  = player;
      } catch {}
    }

    engineReady = true;
  } catch {}
}

export function startMusic(): void {
  if (!engineReady) return;
  for (const key of STEM_KEYS) {
    try { players[key]?.play(); } catch {}
  }
}

export function stopMusic(): void {
  for (const key of STEM_KEYS) {
    fadeVolumeTo(key, 0, 1200);
  }
  setTimeout(() => {
    for (const key of STEM_KEYS) {
      try { players[key]?.pause(); } catch {}
    }
  }, 1200);
}

export function setMusicState(newState: MusicState): void {
  if (newState === currentState) return;
  currentState = newState;

  if (newState === 'off') {
    stopMusic();
    return;
  }

  if (newState === 'boss') {
    const nonBoss: StemKey[] = ['base', 'beat', 'melody', 'tension'];
    for (const key of nonBoss) fadeVolumeTo(key, 0, 400);
    setTimeout(() => fadeVolumeTo('boss', 0.70, 600), 600);
    return;
  }

  const targets = VOLUME_TARGETS[newState];
  for (const key of STEM_KEYS) fadeVolumeTo(key, targets[key], 800);
}

export function triggerChainBreak(): void {
  if (currentState !== 'onARun') return;
  try {
    const player = players.beat;
    if (player) player.volume = 0;
  } catch {}
  setTimeout(() => fadeVolumeTo('beat', VOLUME_TARGETS.onARun.beat, 600), 80);
}

export function disposeMusicEngine(): void {
  for (const key of STEM_KEYS) {
    if (fadeRafIds[key] !== null) {
      cancelAnimationFrame(fadeRafIds[key]!);
      fadeRafIds[key] = null;
    }
    try { players[key]?.remove(); } catch {}
    players[key] = null;
  }
  currentState = 'off';
  engineReady  = false;
}
