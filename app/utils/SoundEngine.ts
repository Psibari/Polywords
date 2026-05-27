import { Audio } from 'expo-av';

const SAMPLE_RATE = 44100;

// ── WAV encoding helpers ───────────────────────────────────────

function writeStr(view: DataView, offset: number, s: string): void {
  for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
}

// ── PCM segment generation ────────────────────────────────────

interface SegmentOpts {
  waveType: 'sine' | 'square' | 'noise';
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
    const freq = startFreq + (endFreq - startFreq) * progress;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    let env: number;
    if (i < attackN) {
      env = attackN > 0 ? i / attackN : 1;
    } else {
      const d = i - attackN;
      env = decayN > 0 ? Math.max(0, 1 - d / decayN) : 1;
    }

    let wave: number;
    if (waveType === 'sine')        wave = Math.sin(phase);
    else if (waveType === 'square') wave = Math.sign(Math.sin(phase)) || 1;
    else                            wave = Math.random() * 2 - 1;

    out[i] = wave * env * volume;
  }

  return out;
}

function silence(ms: number): Float32Array {
  return new Float32Array(Math.ceil(SAMPLE_RATE * ms / 1000));
}

// ── WAV container ─────────────────────────────────────────────

function toWAV(segments: Float32Array[]): string {
  const total     = segments.reduce((n, s) => n + s.length, 0);
  const dataBytes = total * 2;
  const buf       = new ArrayBuffer(44 + dataBytes);
  const view      = new DataView(buf);

  writeStr(view, 0,  'RIFF');
  view.setUint32(4,  36 + dataBytes, true);
  writeStr(view, 8,  'WAVE');
  writeStr(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1,  true); // PCM
  view.setUint16(22, 1,  true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2,  true);
  view.setUint16(34, 16, true);
  writeStr(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

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

// ── Sound builders ────────────────────────────────────────────

function buildCorrectTap(): string {
  return toWAV([
    makeSegment({ waveType: 'sine', startFreq: 880, endFreq: 1100, durationMs: 120, attackMs: 5, decayMs: 115, volume: 0.7 }),
  ]);
}

function buildWrongBuzz(): string {
  return toWAV([
    makeSegment({ waveType: 'square', startFreq: 120, durationMs: 180, attackMs: 0, decayMs: 180, volume: 0.6 }),
  ]);
}

function buildShatter(): string {
  const numSamples = Math.ceil(SAMPLE_RATE * 250 / 1000);
  const samples = new Float32Array(numSamples);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const progress = i / numSamples;
    const freq = 800 - 600 * progress;          // 800→200Hz pitch drop
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const noise = Math.random() * 2 - 1;
    const env   = Math.exp(-progress * 5) * 0.5; // exponential decay
    samples[i]  = (noise * 0.6 + Math.sin(phase) * 0.4) * env;
  }
  return toWAV([samples]);
}

function buildMeterTick(): string {
  return toWAV([
    makeSegment({ waveType: 'sine', startFreq: 660, durationMs: 60, attackMs: 2, decayMs: 58, volume: 0.4 }),
  ]);
}

function buildSplitReveal(): string {
  return toWAV([
    makeSegment({ waveType: 'sine', startFreq: 440, endFreq: 880,  durationMs: 200, attackMs: 10, volume: 0.65 }),
    makeSegment({ waveType: 'sine', startFreq: 880, endFreq: 1320, durationMs: 150, attackMs: 5, decayMs: 145, volume: 0.65 }),
  ]);
}

function buildRoundComplete(): string {
  const note = (freq: number, ms: number) =>
    makeSegment({ waveType: 'sine', startFreq: freq, durationMs: ms, attackMs: 5, decayMs: ms - 5, volume: 0.7 });
  return toWAV([
    note(523, 120), silence(40),
    note(659, 120), silence(40),
    note(784, 200),
  ]);
}

// ── Engine state ──────────────────────────────────────────────

type SoundKey = 'correctTap' | 'wrongBuzz' | 'shatter' | 'meterTick' | 'splitReveal' | 'roundComplete';

const sounds: Record<SoundKey, Audio.Sound | null> = {
  correctTap:    null,
  wrongBuzz:     null,
  shatter:       null,
  meterTick:     null,
  splitReveal:   null,
  roundComplete: null,
};

let ready = false;

// ── Public API ────────────────────────────────────────────────

export async function initSounds(): Promise<void> {
  if (ready) return;

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
  });

  const builders: [SoundKey, () => string][] = [
    ['correctTap',    buildCorrectTap],
    ['wrongBuzz',     buildWrongBuzz],
    ['shatter',       buildShatter],
    ['meterTick',     buildMeterTick],
    ['splitReveal',   buildSplitReveal],
    ['roundComplete', buildRoundComplete],
  ];

  await Promise.all(
    builders.map(async ([key, build]) => {
      const { sound } = await Audio.Sound.createAsync({ uri: build() });
      sounds[key] = sound;
    }),
  );

  ready = true;
}

function play(sound: Audio.Sound | null): void {
  if (!sound) return;
  sound.replayAsync().catch(() => {});
}

export function playCorrectTap():    void { play(sounds.correctTap); }
export function playWrongBuzz():     void { play(sounds.wrongBuzz); }
export function playShatter():       void { play(sounds.shatter); }
export function playMeterTick():     void { play(sounds.meterTick); }
export function playSplitReveal():   void { play(sounds.splitReveal); }
export function playRoundComplete(): void { play(sounds.roundComplete); }
