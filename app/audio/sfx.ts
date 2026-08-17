import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useGameStore } from '../store/useGameStore';
import { ensureAudioSessionConfigured } from './audioSession';
import { ROUND_COMPLETE_URI } from '../utils/soundSynthesis';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'correctClaim'
  | 'trapWrong'
  | 'wrongLame'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'pressHoldStart'
  | 'pollySqwawkShort'
  | 'pollySqwawkLaugh'
  | 'bookClose'
  | 'detectiveSting'
  | 'chainBreak'
  | 'lockSpin1'
  | 'lockSpin2'
  | 'lockSpin3'
  | 'roundComplete'
  | 'gauntletPick';

type SfxConfig = {
  source: Parameters<typeof createAudioPlayer>[0];
  volume: number;
  cooldownMs: number;
};

type SfxPlayerPool = {
  players: AudioPlayer[];
  nextIndex: number;
};

const SFX: Record<SfxName, SfxConfig> = {
  uiClick:        { source: require('../../assets/audio/sfx/ui_click.mp3'),         volume: 0.25, cooldownMs: 80   },
  tileSwipe:      { source: require('../../assets/audio/sfx/tile_swipe.mp3'),       volume: 0.25, cooldownMs: 80   },
  correctClaim:   { source: require('../../assets/audio/sfx/correct_claim_v2.wav'), volume: 0.35, cooldownMs: 120  },
  trapWrong:      { source: require('../../assets/audio/sfx/trap_wrong.mp3'),       volume: 0.35, cooldownMs: 120  },
  wrongLame:      { source: require('../../assets/audio/sfx/wrong_lame_whistle.mp3'), volume: 0.42, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/audio/sfx/trap_shatter.mp3'),     volume: 0.40, cooldownMs: 140  },
  mastered:       { source: require('../../assets/audio/sfx/mastered_chime.mp3'),   volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/audio/sfx/haunted_moan.mp3'),     volume: 0.30, cooldownMs: 2600 },
  pressHoldStart: { source: require('../../assets/audio/sfx/press_hold_start.mp3'), volume: 0.40, cooldownMs: 300  },
  pollySqwawkShort: { source: require('../../assets/audio/sfx/pollySqwawkShort.wav'), volume: 0.42, cooldownMs: 120  },
  pollySqwawkLaugh: { source: require('../../assets/audio/sfx/pollySqwawkLaugh.wav'), volume: 0.42, cooldownMs: 600  },
  bookClose:      { source: require('../../assets/audio/sfx/book_close_v2.mp3'),   volume: 0.60, cooldownMs: 300  },
  detectiveSting: { source: require('../../assets/audio/sfx/detective_clue_sting.mp3'), volume: 0.30, cooldownMs: 1200 },
  chainBreak:     { source: require('../../assets/audio/sfx/chain_break_stinger.mp3'), volume: 0.40, cooldownMs: 1800 },
  lockSpin1:      { source: require('../../assets/audio/sfx/lock_spin_1.mp3'),        volume: 0.40, cooldownMs: 150  },
  lockSpin2:      { source: require('../../assets/audio/sfx/lock_spin_2.mp3'),        volume: 0.40, cooldownMs: 150  },
  lockSpin3:      { source: require('../../assets/audio/sfx/lock_spin_3.mp3'),        volume: 0.40, cooldownMs: 150  },
  roundComplete:  { source: { uri: ROUND_COMPLETE_URI },                              volume: 0.50, cooldownMs: 400  },
  gauntletPick:   { source: require('../../assets/audio/sfx/gauntlet_pick_swoosh.mp3'), volume: 0.45, cooldownMs: 200  },
};

const PLAYER_POOL_SIZE = 2;
const MAX_ANTI_DOUBLE_FIRE_MS = 35;
// Same ladder as MusicEngine.ts's LOAD_RETRY_MS. The two engines share the
// same self-heal mechanism (bounded pool/player rebuild after a load never
// completes), so they need the same per-attempt patience — a sound that
// still hasn't loaded after the same slow-cold-launch conditions that
// justified this ladder for music is equally not "just a hair slow," it's
// the same failure. The previous 50ms x 4 (200ms) budget was sized only for
// the ordinary case (pool already preloaded), never revisited when the
// bounded rebuild was added for real load failures — so on a genuinely slow
// load it exhausted both rebuild attempts and went permanently silent for
// the rest of the session (reproduced on-device 2026-08-07).
const LOAD_RETRY_MS = [60, 150, 300, 600, 1200];

const playerPools: Partial<Record<SfxName, SfxPlayerPool>> = {};
const lastPlayedAt: Partial<Record<SfxName, number>> = {};
// Self-heal: pools whose players never reach isLoaded (wedged audio session
// after stacked dev reloads) are torn down and rebuilt, bounded per sound.
const poolRebuilds: Partial<Record<SfxName, number>> = {};
const MAX_POOL_REBUILDS = 2;
const reservedPlayers = new Set<AudioPlayer>();
const pendingLoadRetryTimers = new Set<ReturnType<typeof setTimeout>>();

function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (error === undefined) {
    console.warn(`[SFX] ${message}`);
  } else {
    console.warn(`[SFX] ${message}`, error);
  }
}

function createPlayerPool(name: SfxName, config: SfxConfig): SfxPlayerPool | null {
  const players: AudioPlayer[] = [];

  for (let i = 0; i < PLAYER_POOL_SIZE; i++) {
    try {
      const player = createAudioPlayer(config.source, { keepAudioSessionActive: true });
      player.volume = config.volume;
      players.push(player);
    } catch (error) {
      warnDev(`Failed to preload "${name}" player ${i + 1}.`, error);
    }
  }

  return players.length > 0 ? { players, nextIndex: 0 } : null;
}

function takePlayer(pool: SfxPlayerPool): AudioPlayer | null {
  const { players } = pool;

  for (let offset = 0; offset < players.length; offset++) {
    const index = (pool.nextIndex + offset) % players.length;
    const player = players[index];
    if (player.isLoaded && !player.playing && !reservedPlayers.has(player)) {
      pool.nextIndex = (index + 1) % players.length;
      reservedPlayers.add(player);
      return player;
    }
  }

  for (let offset = 0; offset < players.length; offset++) {
    const index = (pool.nextIndex + offset) % players.length;
    const player = players[index];
    if (player.isLoaded && !reservedPlayers.has(player)) {
      pool.nextIndex = (index + 1) % players.length;
      reservedPlayers.add(player);
      return player;
    }
  }

  return null;
}

async function restartPlayer(name: SfxName, player: AudioPlayer, rate: number): Promise<boolean> {
  try {
    player.pause();
    await player.seekTo(0, 0, 0);
    let rateApplied = true;
    try {
      // expo-audio defaults shouldCorrectPitch to true (built for slow-motion
      // video, where pitch should stay constant) — left alone, a non-default
      // rate changes duration but not pitch at all, so the 0.55 deflate cue
      // played back slower but at the same bright pitch, never actually
      // "deflated." Must be set before setPlaybackRate for it to take effect.
      player.shouldCorrectPitch = rate === 1.0;
      player.setPlaybackRate(rate);
    } catch (error) {
      rateApplied = false;
      warnDev(`Failed to set playback rate ${rate} for "${name}".`, error);
    }
    // A failed non-default rate means the sample would play at its bright,
    // unpitched default instead — e.g. the wrong-swipe deflate cue reusing
    // correctClaim at rate 0.55 would sound exactly like a correct-swipe
    // chime. Skip playing rather than let that happen silently. A failed
    // default-rate request has nothing to protect against, so it still plays.
    if (!rateApplied && rate !== 1.0) {
      return true;
    }
    player.play();
    return true;
  } catch (error) {
    warnDev(`Failed to play "${name}" from the beginning.`, error);
    return false;
  } finally {
    reservedPlayers.delete(player);
  }
}

// Shared by both failure modes: a pool whose players never reach isLoaded,
// and a pool whose players loaded but a native error on play() proves they're
// actually broken (e.g. iOS "Session lookup failed" after an audio-server
// hiccup). Bounded per sound so a persistently dead audio server can't spin.
function rebuildPoolIfNeeded(name: SfxName, pool: SfxPlayerPool, rate: number, reason: string): void {
  const rebuilds = poolRebuilds[name] ?? 0;
  if (rebuilds < MAX_POOL_REBUILDS) {
    poolRebuilds[name] = rebuilds + 1;
    warnDev(`"${name}" ${reason}; rebuilding pool (attempt ${rebuilds + 1}).`);
    pool.players.forEach(p => { try { p.remove(); } catch {} });
    delete playerPools[name];
    const fresh = createPlayerPool(name, SFX[name]);
    if (fresh) {
      playerPools[name] = fresh;
      playFromPool(name, fresh, rate);
    }
    return;
  }
  warnDev(`"${name}" could not play because its pooled players are broken.`);
}

function playFromPool(name: SfxName, pool: SfxPlayerPool, rate: number, loadAttempt = 0): void {
  const player = takePlayer(pool);
  if (player) {
    poolRebuilds[name] = 0;
    void restartPlayer(name, player, rate).then(ok => {
      if (!ok && playerPools[name] === pool) {
        rebuildPoolIfNeeded(name, pool, rate, 'player errored on play()');
      }
    });
    return;
  }

  if (loadAttempt === 0) {
    warnDev(`"${name}" was requested before any pooled player finished loading; retrying.`);
  }
  const delay = LOAD_RETRY_MS[loadAttempt];
  if (delay === undefined) {
    rebuildPoolIfNeeded(name, pool, rate, 'players never loaded');
    return;
  }

  const timer = setTimeout(() => {
    pendingLoadRetryTimers.delete(timer);
    if (playerPools[name] === pool) {
      playFromPool(name, pool, rate, loadAttempt + 1);
    }
  }, delay);
  pendingLoadRetryTimers.add(timer);
}

// Creating all 19 pools (38 AudioPlayer instances) in one synchronous pass
// was a startup stampede: every pool fired its native create/decode call in
// the same JS tick as MusicEngine's own preload player, all landing on the
// native audio thread at once. That's a plausible root cause for "loads
// late/inconsistently, some sounds never play" independent of (and prior
// to) the load-retry/rebuild self-heal above — this spreads pool creation
// across several ticks instead of one burst, so the native side is never
// asked to start 38+ things simultaneously.
const PRELOAD_BATCH_SIZE = 3;
const PRELOAD_BATCH_DELAY_MS = 32;
let pendingPreloadBatchTimer: ReturnType<typeof setTimeout> | null = null;

export function preloadSfx(): void {
  // Pool creation must not fire until the native session is actually
  // configured — creating AudioPlayer instances against an unconfigured
  // session was the asymmetry that made SFX loading lag behind
  // MusicEngine's preloadHuntTrack, which already waits correctly.
  ensureAudioSessionConfigured()
    .then(() => {
      const names = (Object.keys(SFX) as SfxName[]).filter(name => !playerPools[name]);
      let index = 0;

      function loadNextBatch(): void {
        pendingPreloadBatchTimer = null;
        const batch = names.slice(index, index + PRELOAD_BATCH_SIZE);
        index += PRELOAD_BATCH_SIZE;

        batch.forEach(name => {
          if (playerPools[name]) return; // a targeted playSfx() retry may have already created it
          const pool = createPlayerPool(name, SFX[name]);
          if (pool) {
            playerPools[name] = pool;
          } else {
            warnDev(`No players loaded for "${name}".`);
          }
        });

        if (index < names.length) {
          pendingPreloadBatchTimer = setTimeout(loadNextBatch, PRELOAD_BATCH_DELAY_MS);
        }
      }

      if (names.length > 0) loadNextBatch();
    })
    .catch(error => warnDev('Failed to configure audio mode.', error));
}

const READY_POLL_MS = 40;
// Real device loads were measured at 1-3s (CONTEXT.md); 1200ms meant
// "start anyway" was the typical outcome, not the rare edge case it was
// designed for. 2000ms still bounds worst-case wait, just closer to
// covering an ordinary load instead of losing the race by default.
const READY_TIMEOUT_MS = 2000;

function allSfxLoaded(): boolean {
  return (Object.keys(SFX) as SfxName[]).every(name => {
    const pool = playerPools[name];
    return pool !== undefined && pool.players.some(p => p.isLoaded);
  });
}

// Condition-based, not a fixed delay: resolves as soon as every sound has a
// pool with at least one loaded player, or after READY_TIMEOUT_MS — callers
// that gate on this must never be blocked indefinitely by a slow or broken
// audio server (the self-heal in playFromPool/rebuildPoolIfNeeded keeps
// working in the background either way, this just tells a caller when the
// *typical* case is already ready). Checks every SFX name explicitly rather
// than "whatever pools happen to exist right now" — preloadSfx() now creates
// pools in staggered batches, so early on most pools genuinely don't exist
// yet, and that must read as "not ready," not "nothing to wait for."
export function sfxReady(): Promise<void> {
  if (allSfxLoaded()) return Promise.resolve();

  return new Promise(resolve => {
    const startedAt = Date.now();
    const poll = () => {
      if (allSfxLoaded() || Date.now() - startedAt >= READY_TIMEOUT_MS) {
        resolve();
        return;
      }
      setTimeout(poll, READY_POLL_MS);
    };
    poll();
  });
}

export function playSfx(name: SfxName, options?: { rate?: number }): void {
  if (!useGameStore.getState().soundEnabled) return;
  const config = SFX[name];
  const now = Date.now();
  const antiDoubleFireMs = Math.min(config.cooldownMs, MAX_ANTI_DOUBLE_FIRE_MS);
  if ((now - (lastPlayedAt[name] ?? 0)) < antiDoubleFireMs) return;

  lastPlayedAt[name] = now;
  playWhenPoolReady(name, options?.rate ?? 1.0);
}

// A sound requested before its pool exists yet (e.g. the very first tap,
// landing while preloadSfx()'s staggered batches or the audio-session
// configure call are still in flight) used to be dropped outright — the old
// code called preloadSfx() and then immediately checked playerPools[name]
// in the same synchronous tick, before that async work could ever finish,
// so the request just silently vanished with a dev warning. That's a second,
// independent contributor to "some sounds don't play": not a load failure,
// just asking before the pool was born. Same bounded ladder as the rest of
// this file so it can never wait forever.
function playWhenPoolReady(name: SfxName, rate: number, attempt = 0): void {
  const pool = playerPools[name];
  if (pool) {
    playFromPool(name, pool, rate);
    return;
  }

  if (attempt === 0) preloadSfx();

  const delay = LOAD_RETRY_MS[attempt];
  if (delay === undefined) {
    warnDev(`"${name}" was requested but its player pool never became available.`);
    return;
  }
  setTimeout(() => playWhenPoolReady(name, rate, attempt + 1), delay);
}

export function unloadSfx(): void {
  if (pendingPreloadBatchTimer !== null) clearTimeout(pendingPreloadBatchTimer);
  pendingPreloadBatchTimer = null;
  pendingLoadRetryTimers.forEach(timer => clearTimeout(timer));
  pendingLoadRetryTimers.clear();
  reservedPlayers.clear();
  (Object.keys(playerPools) as SfxName[]).forEach(name => {
    playerPools[name]?.players.forEach(player => {
      try { player.remove(); } catch {}
    });
    delete playerPools[name];
    delete lastPlayedAt[name];
    delete poolRebuilds[name];
  });
}
