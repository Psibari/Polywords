import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'correctClaim'
  | 'trapWrong'
  | 'wrongLame'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'pollyCall'
  | 'gateOpen'
  | 'pressHoldStart'
  | 'pollySqwawkShort'
  | 'pollySqwawkLaugh';

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
  uiClick:        { source: require('../../assets/sfx/ui_click.mp3'),         volume: 0.25, cooldownMs: 80   },
  tileSwipe:      { source: require('../../assets/sfx/tile_swipe.mp3'),       volume: 0.25, cooldownMs: 80   },
  correctClaim:   { source: require('../../assets/sfx/correct_claim.mp3'),    volume: 0.35, cooldownMs: 120  },
  trapWrong:      { source: require('../../assets/sfx/trap_wrong.mp3'),       volume: 0.35, cooldownMs: 120  },
  wrongLame:      { source: require('../../assets/sfx/wrong_lame_whistle.mp3'), volume: 0.42, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/sfx/trap_shatter.mp3'),     volume: 0.40, cooldownMs: 140  },
  mastered:       { source: require('../../assets/sfx/mastered_chime.mp3'),   volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/sfx/haunted_moan.mp3'),     volume: 0.30, cooldownMs: 2600 },
  pollyCall:      { source: require('../../assets/sfx/polly_call.mp3'),       volume: 0.25, cooldownMs: 1500 },
  gateOpen:       { source: require('../../assets/sfx/gate_open.mp3'),        volume: 0.35, cooldownMs: 700  },
  pressHoldStart: { source: require('../../assets/sfx/press_hold_start.mp3'), volume: 0.40, cooldownMs: 300  },
  pollySqwawkShort: { source: require('../../assets/audio/sfx/pollySqwawkShort.wav'), volume: 0.42, cooldownMs: 120  },
  pollySqwawkLaugh: { source: require('../../assets/audio/sfx/pollySqwawkLaugh.wav'), volume: 0.42, cooldownMs: 600  },
};

const PLAYER_POOL_SIZE = 2;
const MAX_ANTI_DOUBLE_FIRE_MS = 35;
const LOAD_RETRY_DELAY_MS = 50;
const LOAD_RETRY_ATTEMPTS = 4;

const playerPools: Partial<Record<SfxName, SfxPlayerPool>> = {};
const lastPlayedAt: Partial<Record<SfxName, number>> = {};
// Self-heal: pools whose players never reach isLoaded (wedged audio session
// after stacked dev reloads) are torn down and rebuilt, bounded per sound.
const poolRebuilds: Partial<Record<SfxName, number>> = {};
const MAX_POOL_REBUILDS = 2;
const reservedPlayers = new Set<AudioPlayer>();
const pendingLoadRetryTimers = new Set<ReturnType<typeof setTimeout>>();

let audioModeSet = false;

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

async function restartPlayer(name: SfxName, player: AudioPlayer): Promise<void> {
  try {
    player.pause();
    await player.seekTo(0, 0, 0);
    player.play();
  } catch (error) {
    warnDev(`Failed to play "${name}" from the beginning.`, error);
  } finally {
    reservedPlayers.delete(player);
  }
}

function playFromPool(name: SfxName, pool: SfxPlayerPool, loadAttempt = 0): void {
  const player = takePlayer(pool);
  if (player) {
    poolRebuilds[name] = 0;
    void restartPlayer(name, player);
    return;
  }

  if (loadAttempt === 0) {
    warnDev(`"${name}" was requested before any pooled player finished loading; retrying.`);
  }
  if (loadAttempt >= LOAD_RETRY_ATTEMPTS) {
    const rebuilds = poolRebuilds[name] ?? 0;
    if (rebuilds < MAX_POOL_REBUILDS) {
      poolRebuilds[name] = rebuilds + 1;
      warnDev(`"${name}" players never loaded; rebuilding pool (attempt ${rebuilds + 1}).`);
      pool.players.forEach(p => { try { p.remove(); } catch {} });
      delete playerPools[name];
      const fresh = createPlayerPool(name, SFX[name]);
      if (fresh) {
        playerPools[name] = fresh;
        playFromPool(name, fresh);
      }
      return;
    }
    warnDev(`"${name}" could not play because its pooled players did not load.`);
    return;
  }

  const timer = setTimeout(() => {
    pendingLoadRetryTimers.delete(timer);
    if (playerPools[name] === pool) {
      playFromPool(name, pool, loadAttempt + 1);
    }
  }, LOAD_RETRY_DELAY_MS);
  pendingLoadRetryTimers.add(timer);
}

export function preloadSfx(): void {
  if (!audioModeSet) {
    audioModeSet = true;
    setAudioModeAsync({
      playsInSilentMode:    true,
      shouldPlayInBackground: false,
      interruptionMode:     'duckOthers',
    }).catch(error => warnDev('Failed to configure audio mode.', error));
  }

  (Object.entries(SFX) as [SfxName, SfxConfig][]).forEach(([name, config]) => {
    if (playerPools[name]) return;
    const pool = createPlayerPool(name, config);
    if (pool) {
      playerPools[name] = pool;
    } else {
      warnDev(`No players loaded for "${name}".`);
    }
  });
}

export function playSfx(name: SfxName): void {
  const config = SFX[name];
  const now = Date.now();
  const antiDoubleFireMs = Math.min(config.cooldownMs, MAX_ANTI_DOUBLE_FIRE_MS);
  if ((now - (lastPlayedAt[name] ?? 0)) < antiDoubleFireMs) return;

  if (!playerPools[name]) preloadSfx();

  const pool = playerPools[name];
  if (!pool) {
    warnDev(`"${name}" was requested but its player pool is unavailable.`);
    return;
  }

  lastPlayedAt[name] = now;
  playFromPool(name, pool);
}

export function unloadSfx(): void {
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
  audioModeSet = false;
}
