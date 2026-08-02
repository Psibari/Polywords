import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import { ensureAudioSessionConfigured } from './audioSession';

export type MusicState =
  | 'off'
  | 'neutral'
  | 'rhythm'
  | 'onARun'
  | 'crisis'
  | 'boss'
  | 'daily'
  | 'static';

export type MusicOwner = 'hunt' | 'daily';

type TrackKey = 'hunt' | 'tension' | 'boss' | 'daily' | 'static';
type TrackSource = Parameters<AudioPlayer['replace']>[0];

// One source slot per authored loop. Replacing these files does not require
// another transport rewrite.
const TRACK_SOURCES: Record<TrackKey, TrackSource> = {
  hunt: require('../../assets/audio/bgm/hunt_suspense_loop.mp3'),
  tension: require('../../assets/audio/bgm/tension_quirky_background.mp3'),
  boss: require('../../assets/audio/bgm/boss_of_the_rats.mp3'),
  daily: require('../../assets/audio/bgm/daily_detective_clue_patrol.mp3'),
  static: require('../../assets/audio/bgm/static_idle_loop.mp3'),
};

const TRACK_PLAYBACK_RATES: Record<TrackKey, number> = {
  hunt: 0.85,
  tension: 1,
  boss: 1,
  daily: 1,
  static: 1,
};

const STATE_TO_TRACK: Record<Exclude<MusicState, 'off'>, TrackKey> = {
  neutral: 'hunt',
  rhythm: 'hunt',
  onARun: 'hunt',
  crisis: 'tension',
  boss: 'boss',
  daily: 'daily',
  static: 'static',
};

const STATE_VOLUMES: Record<Exclude<MusicState, 'off'>, number> = {
  neutral: 0.18,
  rhythm: 0.20,
  onARun: 0.22,
  crisis: 0.20,
  boss: 0.14,
  daily: 0.16,
  static: 0.18,
};

const FADE_IN_MS = 300;
const FADE_OUT_MS = 240;

let player: AudioPlayer | null = null;
let playerSubscription: { remove(): void } | null = null;
let initPromise: Promise<void> | null = null;
const desiredStates: Record<MusicOwner, Exclude<MusicState, 'off'>> = {
  hunt: 'neutral',
  daily: 'daily',
};
let activeOwner: MusicOwner | null = null;
let activeTrackKey: TrackKey | null = null;
let userMuted = false;
let transitionToken = 0;
let configuredTrackToken = -1;
let pendingSeek: { key: TrackKey; seconds: number; token: number } | null = null;
let fadeRafId: number | null = null;
let pauseTimerId: ReturnType<typeof setTimeout> | null = null;
const savedPositions: Partial<Record<TrackKey, number>> = {};

const LOAD_RETRY_MS = [60, 150, 300, 600, 1200];
let transportPaused = false;
let loadRetryId: ReturnType<typeof setTimeout> | null = null;
let loadRetryAttempt = 0;
let transitionRequestedAt = 0;
let tracedTransitionToken = -1;

function clearLoadRetry(): void {
  if (loadRetryId !== null) clearTimeout(loadRetryId);
  loadRetryId = null;
  loadRetryAttempt = 0;
}

function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (error === undefined) console.warn(`[MusicEngine] ${message}`);
  else console.warn(`[MusicEngine] ${message}`, error);
}

function traceDev(message: string): void {
  if (__DEV__) console.info(`[MusicEngine timing] ${message}`);
}

function clearPauseTimer(): void {
  if (pauseTimerId === null) return;
  clearTimeout(pauseTimerId);
  pauseTimerId = null;
}

function cancelFade(): void {
  if (fadeRafId === null) return;
  cancelAnimationFrame(fadeRafId);
  fadeRafId = null;
}

function targetVolume(): number {
  if (userMuted || !activeOwner || transportPaused) return 0;
  return STATE_VOLUMES[desiredStates[activeOwner]];
}

function fadeVolumeTo(volume: number, durationMs: number): void {
  if (!player) return;
  cancelFade();

  const livePlayer = player;
  const startVolume = livePlayer.volume;
  const startTime = performance.now();

  function tick(): void {
    if (player !== livePlayer) {
      fadeRafId = null;
      return;
    }

    const elapsed = performance.now() - startTime;
    const progress = durationMs <= 0 ? 1 : Math.min(elapsed / durationMs, 1);
    livePlayer.volume = startVolume + (volume - startVolume) * progress;

    if (progress < 1) fadeRafId = requestAnimationFrame(tick);
    else fadeRafId = null;
  }

  fadeRafId = requestAnimationFrame(tick);
}

function playLoadedTrack(token: number): void {
  const livePlayer = player;
  if (!livePlayer || !activeOwner || token !== transitionToken) {
    clearLoadRetry();
    return;
  }

  const desiredTrack = STATE_TO_TRACK[desiredStates[activeOwner]];
  if (activeTrackKey !== desiredTrack) return;

  if (!livePlayer.isLoaded) {
    // playbackStatusUpdate is not a guaranteed wake-up for a paused player
    // whose source was just replaced. Bounded ladder so the engine can never
    // wedge in loaded-but-never-played.
    const delay = LOAD_RETRY_MS[loadRetryAttempt];
    if (delay === undefined) {
      warnDev(`gave up waiting for ${desiredTrack} to load`);
      return;
    }
    loadRetryAttempt += 1;
    if (loadRetryId !== null) clearTimeout(loadRetryId);
    loadRetryId = setTimeout(() => {
      loadRetryId = null;
      playLoadedTrack(token);
    }, delay);
    return;
  }

  clearLoadRetry();
  if (transportPaused) return;

  if (configuredTrackToken !== token) {
    try {
      livePlayer.setPlaybackRate(TRACK_PLAYBACK_RATES[desiredTrack], 'high');
    } catch (error) {
      warnDev(`failed to set ${desiredTrack} playback rate`, error);
    } finally {
      configuredTrackToken = token;
    }
  }

  const seek = pendingSeek;
  if (seek && seek.key === desiredTrack && seek.token === token) {
    pendingSeek = null;
    if (seek.seconds > 0.05) {
      void livePlayer.seekTo(seek.seconds, 0, 0)
        .catch(error => warnDev(`failed to resume ${desiredTrack} track`, error))
        .finally(() => playLoadedTrack(token));
      return;
    }
  }

  try {
    livePlayer.loop = true;
    if (!livePlayer.playing) {
      if (transitionRequestedAt > 0 && tracedTransitionToken !== token) {
        tracedTransitionToken = token;
        traceDev(
          `${desiredTrack} play requested ${Math.round(performance.now() - transitionRequestedAt)}ms after switch`,
        );
      }
      livePlayer.play();
      fadeVolumeTo(targetVolume(), FADE_IN_MS);
    } else if (
      fadeRafId === null &&
      Math.abs(livePlayer.volume - targetVolume()) > 0.005
    ) {
      fadeVolumeTo(targetVolume(), 200);
    }
  } catch (error) {
    warnDev(`failed to play ${desiredTrack} track`, error);
  }
}

function switchTrack(nextTrack: TrackKey): void {
  const livePlayer = player;
  if (!livePlayer) return;

  if (activeTrackKey) {
    savedPositions[activeTrackKey] = Math.max(0, livePlayer.currentTime || 0);
  }

  transitionToken += 1;
  const token = transitionToken;
  transitionRequestedAt = performance.now();
  configuredTrackToken = -1;
  cancelFade();
  clearPauseTimer();
  clearLoadRetry();

  try {
    livePlayer.volume = 0;
    livePlayer.pause();
    livePlayer.replace(TRACK_SOURCES[nextTrack]);
    livePlayer.loop = true;
    activeTrackKey = nextTrack;
    pendingSeek = {
      key: nextTrack,
      seconds: savedPositions[nextTrack] ?? 0,
      token,
    };
    playLoadedTrack(token);
  } catch (error) {
    warnDev(`failed to switch to ${nextTrack} track`, error);
  }
}

function pauseTransport(): void {
  transportPaused = true;
  clearPauseTimer();
  clearLoadRetry();
  fadeVolumeTo(0, FADE_OUT_MS);

  const livePlayer = player;
  pauseTimerId = setTimeout(() => {
    pauseTimerId = null;
    if (!transportPaused || player !== livePlayer) return;
    try {
      livePlayer?.pause();
    } catch (error) {
      warnDev('failed to pause music', error);
    }
  }, FADE_OUT_MS + 30);
}

function applyDesiredState(): void {
  if (!player || !activeOwner) return;

  transportPaused = false;
  clearPauseTimer();
  const desiredTrack = STATE_TO_TRACK[desiredStates[activeOwner]];
  if (activeTrackKey !== desiredTrack) {
    switchTrack(desiredTrack);
    return;
  }

  playLoadedTrack(transitionToken);
}

export function initMusicEngine(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = ensureAudioSessionConfigured()
    .catch(error => warnDev('failed to configure audio mode', error))
    .then(() => {
      if (player) return;

      const nextPlayer = createAudioPlayer(null, {
        keepAudioSessionActive: true,
        updateInterval: 250,
      });
      nextPlayer.volume = 0;
      nextPlayer.loop = true;
      player = nextPlayer;
      playerSubscription = nextPlayer.addListener('playbackStatusUpdate', status => {
        if (status.isLoaded) playLoadedTrack(transitionToken);
      });
      applyDesiredState();
    })
    .catch(error => {
      initPromise = null;
      warnDev('failed to initialize music player', error);
    });

  return initPromise;
}

export function startMusic(owner: MusicOwner): void {
  activeOwner = owner;
  transportPaused = false;
  clearPauseTimer();
  cancelFade();
  void initMusicEngine().then(applyDesiredState);
}

export function stopMusic(owner: MusicOwner): void {
  // Native-stack focus transitions may mount the incoming screen before the
  // outgoing cleanup fires. Only the current owner may stop the singleton.
  if (activeOwner !== owner) return;
  activeOwner = null;
  transitionToken += 1;
  pendingSeek = null;
  clearPauseTimer();
  fadeVolumeTo(0, FADE_OUT_MS);

  const livePlayer = player;
  pauseTimerId = setTimeout(() => {
    pauseTimerId = null;
    if (activeOwner || player !== livePlayer) return;
    try {
      livePlayer?.pause();
    } catch (error) {
      warnDev('failed to pause music', error);
    }
  }, FADE_OUT_MS + 30);
}

export function setMusicState(owner: MusicOwner, newState: MusicState): void {
  if (newState === 'off') {
    if (activeOwner !== owner || transportPaused) return;
    // A new run must start its loop from the top, not resume mid-loop from
    // wherever the previous run's last track switch left it.
    for (const key of Object.keys(savedPositions) as TrackKey[]) {
      delete savedPositions[key];
    }
    pauseTransport();
    return;
  }

  desiredStates[owner] = newState;
  if (activeOwner === owner) applyDesiredState();
}

export function setMusicEnabled(enabled: boolean): void {
  userMuted = !enabled;
  if (!player || !activeOwner) return;
  fadeVolumeTo(targetVolume(), 220);
}

// App-teardown escape hatch only. stopMusic() is for screen blur only, which
// keeps the singleton and desired state available for a clean focus return.
// setMusicState(owner, 'off') pauses the transport in place without
// releasing ownership, for a run ending while its screen stays focused.
export function haltMusicEngine(): void {
  activeOwner = null;
  activeTrackKey = null;
  configuredTrackToken = -1;
  pendingSeek = null;
  transitionToken += 1;
  transportPaused = false;
  clearPauseTimer();
  clearLoadRetry();
  cancelFade();
  playerSubscription?.remove();
  playerSubscription = null;

  try {
    player?.remove();
  } catch (error) {
    warnDev('failed to release music player', error);
  }

  player = null;
  initPromise = null;
  for (const key of Object.keys(savedPositions) as TrackKey[]) {
    delete savedPositions[key];
  }
}
