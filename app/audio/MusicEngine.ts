import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export type MusicState = 'off' | 'neutral' | 'rhythm' | 'onARun' | 'crisis' | 'boss';

type TrackKey = 'hunt' | 'tension' | 'boss';

const TRACK_KEYS: TrackKey[] = ['hunt', 'tension', 'boss'];

const TRACK_SOURCES: Record<TrackKey, ReturnType<typeof require>> = {
  hunt: require('../../assets/audio/bgm/hunt_suspense_loop.mp3'),
  tension: require('../../assets/audio/bgm/tension_running_out.mp3'),
  boss: require('../../assets/audio/bgm/boss_too_hot_to_sleep.mp3'),
};

const TRACK_VOLUMES: Record<TrackKey, number> = {
  hunt: 0.22,
  tension: 0.20,
  boss: 0.14,
};

const STATE_TO_TRACK: Record<Exclude<MusicState, 'off'>, TrackKey> = {
  neutral: 'hunt',
  rhythm: 'hunt',
  onARun: 'hunt',
  crisis: 'tension',
  boss: 'boss',
};

const players: Record<TrackKey, AudioPlayer | null> = {
  hunt: null,
  tension: null,
  boss: null,
};

const fadeRafIds: Record<TrackKey, number | null> = {
  hunt: null,
  tension: null,
  boss: null,
};

const startTokens: Record<TrackKey, number> = {
  hunt: 0,
  tension: 0,
  boss: 0,
};

let currentState: MusicState = 'off';
let engineReady = false;
let musicStarted = false;
let activeTrackKey: TrackKey | null = null;
let stopTimerId: ReturnType<typeof setTimeout> | null = null;
let userMuted = false;

function effectiveVolume(key: TrackKey): number {
  return userMuted ? 0 : TRACK_VOLUMES[key];
}

function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (error) {
    console.warn(`[MusicEngine] ${message}`, error);
  } else {
    console.warn(`[MusicEngine] ${message}`);
  }
}

function clearStopTimer(): void {
  if (stopTimerId === null) return;
  clearTimeout(stopTimerId);
  stopTimerId = null;
}

function cancelFade(key: TrackKey): void {
  if (fadeRafIds[key] === null) return;
  cancelAnimationFrame(fadeRafIds[key]!);
  fadeRafIds[key] = null;
}

function stopTrackNow(key: TrackKey, resetToStart = false): void {
  const player = players[key];
  startTokens[key] += 1;
  cancelFade(key);
  if (!player) return;

  try {
    player.volume = 0;
    player.pause();
    if (resetToStart) {
      void player.seekTo(0, 0, 0).catch(error => {
        warnDev(`failed to reset ${key} track`, error);
      });
    }
  } catch (error) {
    warnDev(`failed to stop ${key} track`, error);
  }
}

function fadeVolumeTo(key: TrackKey, targetVolume: number, durationMs: number): void {
  const player = players[key];
  if (!player) return;

  cancelFade(key);

  try {
    const startVolume = player.volume;
    const startTime = performance.now();

    function tick(): void {
      try {
        const livePlayer = players[key];
        if (!livePlayer) {
          fadeRafIds[key] = null;
          return;
        }

        const elapsed = performance.now() - startTime;
        const t = durationMs <= 0 ? 1 : Math.min(elapsed / durationMs, 1);
        livePlayer.volume = startVolume + (targetVolume - startVolume) * t;

        if (t < 1) {
          fadeRafIds[key] = requestAnimationFrame(tick);
        } else {
          fadeRafIds[key] = null;
        }
      } catch (error) {
        fadeRafIds[key] = null;
        warnDev(`failed while fading ${key} track`, error);
      }
    }

    fadeRafIds[key] = requestAnimationFrame(tick);
  } catch (error) {
    fadeRafIds[key] = null;
    warnDev(`failed to start ${key} fade`, error);
  }
}

function startTrack(key: TrackKey, volume: number): void {
  const player = players[key];
  if (!player) {
    warnDev(`cannot start missing ${key} track`);
    return;
  }

  const startToken = startTokens[key] + 1;
  startTokens[key] = startToken;

  try {
    player.loop = true;
    player.volume = 0;
    void player.seekTo(0, 0, 0)
      .catch(error => {
        warnDev(`failed to reset ${key} track before play`, error);
      })
      .finally(() => {
        const livePlayer = players[key];
        if (
          !livePlayer ||
          startTokens[key] !== startToken ||
          activeTrackKey !== key ||
          !musicStarted
        ) {
          return;
        }

        try {
          livePlayer.loop = true;
          livePlayer.play();
          fadeVolumeTo(key, volume, 300);
        } catch (error) {
          warnDev(`failed to play ${key} track`, error);
        }
      });
  } catch (error) {
    warnDev(`failed to start ${key} track`, error);
  }
}

function ensureTrackVolume(key: TrackKey): void {
  const player = players[key];
  if (!player) {
    warnDev(`cannot adjust missing ${key} track`);
    return;
  }

  try {
    player.loop = true;
    fadeVolumeTo(key, effectiveVolume(key), 200);
  } catch (error) {
    warnDev(`failed to adjust ${key} track volume`, error);
  }
}

function applyCurrentState(): void {
  if (!engineReady || !musicStarted) return;

  clearStopTimer();

  if (currentState === 'off') {
    stopMusic();
    return;
  }

  const activeTrack = STATE_TO_TRACK[currentState];

  if (activeTrack === activeTrackKey) {
    ensureTrackVolume(activeTrack);
    return;
  }

  for (const key of TRACK_KEYS) {
    if (key !== activeTrack) {
      stopTrackNow(key, true);
    }
  }

  const activePlayer = players[activeTrack];
  if (!activePlayer) {
    warnDev(`requested ${activeTrack} track is unavailable`);
    return;
  }

  startTrack(activeTrack, effectiveVolume(activeTrack));
  activeTrackKey = activeTrack;
}

export async function initMusicEngine(): Promise<void> {
  if (engineReady) return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    });
  } catch (error) {
    warnDev('failed to configure audio mode', error);
  }

  for (const key of TRACK_KEYS) {
    if (players[key]) continue;

    try {
      const player = createAudioPlayer(TRACK_SOURCES[key], {
        downloadFirst: true,
        keepAudioSessionActive: true,
      });
      player.volume = 0;
      player.loop = true;
      players[key] = player;
    } catch (error) {
      players[key] = null;
      warnDev(`failed to load ${key} track`, error);
    }
  }

  engineReady = true;
  applyCurrentState();
}

export function startMusic(): void {
  musicStarted = true;
  applyCurrentState();
}

export function stopMusic(): void {
  musicStarted = false;
  clearStopTimer();

  for (const key of TRACK_KEYS) {
    startTokens[key] += 1;
    fadeVolumeTo(key, 0, 450);
  }

  stopTimerId = setTimeout(() => {
    stopTimerId = null;
    for (const key of TRACK_KEYS) {
      stopTrackNow(key, false);
    }
    activeTrackKey = null;
  }, 500);
}

export function setMusicState(newState: MusicState): void {
  if (newState === currentState) return;

  const previousState = currentState;
  const previousTrack = previousState === 'off' ? null : STATE_TO_TRACK[previousState];
  const newTrack = newState === 'off' ? null : STATE_TO_TRACK[newState];

  currentState = newState;

  if (newState === 'off') {
    stopMusic();
    return;
  }

  if (previousTrack !== null && previousTrack === newTrack) {
    if (musicStarted && activeTrackKey === newTrack) {
      ensureTrackVolume(newTrack);
    }
    return;
  }

  applyCurrentState();
}

export function setMusicEnabled(enabled: boolean): void {
  if (userMuted === !enabled) return;
  userMuted = !enabled;
  if (!musicStarted || !activeTrackKey) return;
  fadeVolumeTo(activeTrackKey, effectiveVolume(activeTrackKey), 300);
}

export function triggerChainBreak(): void {
  // The track-based engine has no beat stem to duck.
}

export function disposeMusicEngine(): void {
  clearStopTimer();

  for (const key of TRACK_KEYS) {
    stopTrackNow(key, true);
    try {
      players[key]?.remove();
    } catch (error) {
      warnDev(`failed to remove ${key} track`, error);
    }
    players[key] = null;
  }

  currentState = 'off';
  engineReady = false;
  musicStarted = false;
  activeTrackKey = null;
}
