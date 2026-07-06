import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// ── Types & constants ─────────────────────────────────────────

export type MusicState = 'off' | 'neutral' | 'rhythm' | 'onARun' | 'crisis' | 'boss';

type StemKey = 'base' | 'beat' | 'melody' | 'tension' | 'boss';

const STEM_KEYS: StemKey[] = ['base', 'beat', 'melody', 'tension', 'boss'];

const STEM_SOURCES: Record<StemKey, ReturnType<typeof require>> = {
  base:    require('../../assets/audio/music/stem-base.wav'),
  beat:    require('../../assets/audio/music/stem-beat.wav'),
  melody:  require('../../assets/audio/music/stem-melody.wav'),
  tension: require('../../assets/audio/music/stem-tension.wav'),
  boss:    require('../../assets/audio/music/stem-boss.wav'),
};

const VOLUME_TARGETS: Record<Exclude<MusicState, 'off'>, Record<StemKey, number>> = {
  neutral: { base: 0.40, beat: 0.00, melody: 0.00, tension: 0.00, boss: 0.00 },
  rhythm:  { base: 0.40, beat: 0.65, melody: 0.00, tension: 0.00, boss: 0.00 },
  onARun:  { base: 0.40, beat: 0.75, melody: 0.50, tension: 0.00, boss: 0.00 },
  crisis:  { base: 0.30, beat: 0.20, melody: 0.00, tension: 0.50, boss: 0.00 },
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

const LOOP_SECONDS = 814154 / 44100; // 18.4615...

let driftWatchId: ReturnType<typeof setInterval> | null = null;

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

    for (const key of STEM_KEYS) {
      try {
        const player  = createAudioPlayer(STEM_SOURCES[key]);
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
  const keys = STEM_KEYS;
  const ps = keys.map(k => players[k]);
  for (let i = 0; i < ps.length; i++) {
    if (ps[i]) ps[i]!.play();
  }
  if (__DEV__) {
    startDriftWatch();
  }
}

// DEV-ONLY drift diagnostic — safe to delete once phase-lock is confirmed stable on device.
function startDriftWatch(): void {
  if (driftWatchId !== null) return;
  driftWatchId = setInterval(() => {
    const times: Partial<Record<StemKey, number>> = {};
    for (const key of STEM_KEYS) {
      const p = players[key];
      if (p) times[key] = p.currentTime % LOOP_SECONDS;
    }
    const vals = Object.values(times).filter((v): v is number => v != null);
    if (vals.length < 2) return;
    const spread = Math.max(...vals) - Math.min(...vals);
    if (spread > 0.02) {
      console.log('[MusicEngine] stem drift (s):', times, 'spread:', spread.toFixed(4));
    }
  }, 5000);
}

function stopDriftWatch(): void {
  if (driftWatchId !== null) {
    clearInterval(driftWatchId);
    driftWatchId = null;
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
  if (__DEV__) {
    stopDriftWatch();
  }
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
