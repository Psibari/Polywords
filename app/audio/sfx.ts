import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useGameStore } from '../store/useGameStore';
import { ensureAudioSessionConfigured } from './audioSession';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'correctClaim'
  | 'trapWrong'
  | 'wrongLame'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'masteredTransform'
  | 'masteredBookSlam'
  | 'masteredResult'
  | 'hauntedTransformSlam'
  | 'pressHoldStart'
  | 'pollySqwawkShort'
  | 'pollySqwawkLaugh'
  | 'bookClose'
  | 'detectiveSting'
  | 'chainBreak'
  | 'lockSpin1'
  | 'lockSpin2'
  | 'lockSpin3'
  | 'gauntletPick';

type SfxConfig = {
  source: Parameters<typeof createAudioPlayer>[0];
  volume: number;
  cooldownMs: number;
};

type PendingPlay = {
  rate: number;
};

type SfxPlayer = {
  player: AudioPlayer;
  ready: boolean;
  busy: boolean;
  started: boolean;
  removeStatusListener: () => void;
  releaseTimer: ReturnType<typeof setTimeout> | null;
};

type SfxSlot = {
  players: SfxPlayer[];
  pending: PendingPlay[];
  creating: Promise<void> | null;
  loadAttempts: number;
};

const SFX: Record<SfxName, SfxConfig> = {
  uiClick:        { source: require('../../assets/audio/sfx/ui_click.mp3'),          volume: 0.25, cooldownMs: 80 },
  tileSwipe:      { source: require('../../assets/audio/sfx/tile_swipe.mp3'),        volume: 0.25, cooldownMs: 80 },
  correctClaim:   { source: require('../../assets/audio/sfx/correct_claim_v2.wav'),  volume: 0.35, cooldownMs: 120 },
  trapWrong:      { source: require('../../assets/audio/sfx/trap_wrong.mp3'),        volume: 0.35, cooldownMs: 120 },
  wrongLame:      { source: require('../../assets/audio/sfx/wrong_lame_whistle.mp3'), volume: 0.42, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/audio/sfx/trap_shatter.mp3'),      volume: 0.40, cooldownMs: 140 },
  mastered:       { source: require('../../assets/audio/sfx/mastered_chime.mp3'),    volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/audio/sfx/haunted_moan.mp3'),      volume: 0.30, cooldownMs: 2600 },
  masteredTransform: { source: require('../../assets/audio/sfx/mastered_transform_v1.wav'), volume: 0.45, cooldownMs: 2200 },
  masteredBookSlam: { source: require('../../assets/audio/sfx/mastered_book_slam_v1.wav'), volume: 0.60, cooldownMs: 300 },
  masteredResult: { source: require('../../assets/audio/sfx/mastered_result_sting_v1.wav'), volume: 0.45, cooldownMs: 2200 },
  hauntedTransformSlam: { source: require('../../assets/audio/sfx/haunted_transform_slam_v1.wav'), volume: 0.60, cooldownMs: 2600 },
  pressHoldStart: { source: require('../../assets/audio/sfx/press_hold_start.mp3'),  volume: 0.40, cooldownMs: 300 },
  pollySqwawkShort: { source: require('../../assets/audio/sfx/pollySqwawkShort.wav'), volume: 0.42, cooldownMs: 120 },
  pollySqwawkLaugh: { source: require('../../assets/audio/sfx/pollySqwawkLaugh.wav'), volume: 0.42, cooldownMs: 600 },
  bookClose:      { source: require('../../assets/audio/sfx/book_close_v2.mp3'),      volume: 0.60, cooldownMs: 300 },
  detectiveSting: { source: require('../../assets/audio/sfx/detective_clue_sting.mp3'), volume: 0.30, cooldownMs: 1200 },
  chainBreak:     { source: require('../../assets/audio/sfx/chain_break_stinger.mp3'), volume: 0.40, cooldownMs: 1800 },
  lockSpin1:      { source: require('../../assets/audio/sfx/lock_spin_1.mp3'),         volume: 0.40, cooldownMs: 150 },
  lockSpin2:      { source: require('../../assets/audio/sfx/lock_spin_2.mp3'),         volume: 0.40, cooldownMs: 150 },
  lockSpin3:      { source: require('../../assets/audio/sfx/lock_spin_3.mp3'),         volume: 0.40, cooldownMs: 150 },
  gauntletPick:   { source: require('../../assets/audio/sfx/gauntlet_pick_swoosh.mp3'), volume: 0.45, cooldownMs: 200 },
};

const MAX_PLAYERS_PER_SOUND = 2;
const MAX_PENDING_PLAYS = 2;
const LOAD_TIMEOUT_MS = 5000;
const PLAY_RELEASE_FALLBACK_MS = 5000;
const BOSS_OUTCOME_SFX: readonly SfxName[] = [
  'masteredTransform',
  'masteredBookSlam',
  'masteredResult',
  'hauntedTransformSlam',
];

const slots: Partial<Record<SfxName, SfxSlot>> = {};
const lastPlayedAt: Partial<Record<SfxName, number>> = {};
let lifecycleGeneration = 0;
let sessionWarmPromise: Promise<void> | null = null;

function warnDev(message: string, error?: unknown): void {
  if (!__DEV__) return;
  if (error === undefined) console.warn(`[SFX] ${message}`);
  else console.warn(`[SFX] ${message}`, error);
}

function removePlayer(item: SfxPlayer): void {
  if (item.releaseTimer !== null) clearTimeout(item.releaseTimer);
  item.removeStatusListener();
  try {
    item.player.remove();
  } catch {}
}

function drainSlot(name: SfxName, generation: number): void {
  if (generation !== lifecycleGeneration) return;
  const slot = slots[name];
  if (!slot) return;

  while (slot.pending.length > 0) {
    const item = slot.players.find(candidate =>
      candidate.ready && !candidate.busy && !candidate.player.playing,
    );
    if (!item) {
      if (slot.players.length < MAX_PLAYERS_PER_SOUND && !slot.creating && slot.loadAttempts < 2) {
        createPlayer(name, generation);
      } else if (slot.players.length === 0 && slot.loadAttempts >= 2) {
        warnDev(`"${name}" could not be loaded after two attempts; dropping pending playback.`);
        slot.pending.length = 0;
      }
      return;
    }

    const request = slot.pending.shift();
    if (!request) return;
    item.busy = true;
    item.started = false;
    void playOnPlayer(name, item, request.rate, generation);
  }
}

function createPlayer(name: SfxName, generation: number): void {
  const slot = slots[name];
  if (!slot || generation !== lifecycleGeneration || slot.creating) return;

  slot.creating = ensureAudioSessionConfigured()
    .then(() => {
      if (generation !== lifecycleGeneration || slots[name] !== slot) return;

      const config = SFX[name];
      let player: AudioPlayer;
      try {
        // Passing the real source to the constructor is important. The old
        // manager constructed null-source players, called replace(), then
        // polled isLoaded; on device those players stayed unloaded forever.
        // Use the configured source at construction time so native loading
        // begins immediately and emits a normal loaded status event.
        player = createAudioPlayer(config.source, { keepAudioSessionActive: true });
        player.volume = config.volume;
      } catch (error) {
        warnDev(`Failed to create "${name}" player.`, error);
        slot.loadAttempts += 1;
        return;
      }

      let settled = false;
      let item!: SfxPlayer;
      const settleReady = () => {
        if (settled) return;
        settled = true;
        item.ready = true;
        slot.loadAttempts = 0;
        drainSlot(name, generation);
      };

      item = {
        player,
        ready: player.isLoaded,
        busy: false,
        started: false,
        removeStatusListener: () => {},
        releaseTimer: null,
      };
      item.removeStatusListener = player.addListener('playbackStatusUpdate', status => {
        if (status.isLoaded) settleReady();
        if (item.started && status.didJustFinish) {
          item.started = false;
          item.busy = false;
          if (item.releaseTimer !== null) {
            clearTimeout(item.releaseTimer);
            item.releaseTimer = null;
          }
          drainSlot(name, generation);
        }
      }).remove;
      slot.players.push(item);

      if (item.ready) settleReady();

      if (!settled) {
        setTimeout(() => {
          if (settled || generation !== lifecycleGeneration || slots[name] !== slot) return;
          warnDev(`"${name}" did not finish loading within ${LOAD_TIMEOUT_MS}ms.`);
          removePlayer(item);
          const index = slot.players.indexOf(item);
          if (index >= 0) slot.players.splice(index, 1);
          slot.loadAttempts += 1;
          if (slot.pending.length > 0 && slot.loadAttempts < 2) {
            createPlayer(name, generation);
          } else {
            slot.pending.length = 0;
          }
        }, LOAD_TIMEOUT_MS);
      }
    })
    .catch(error => {
      slot.loadAttempts += 1;
      warnDev(`Failed to load "${name}".`, error);
    })
    .finally(() => {
      if (slots[name] === slot) slot.creating = null;
      if (generation === lifecycleGeneration) drainSlot(name, generation);
    });
}

async function playOnPlayer(
  name: SfxName,
  item: SfxPlayer,
  rate: number,
  generation: number,
): Promise<void> {
  try {
    item.player.pause();
    await item.player.seekTo(0, 0, 0);
    item.player.shouldCorrectPitch = rate === 1;
    item.player.setPlaybackRate(rate);
    item.started = true;
    item.releaseTimer = setTimeout(() => {
      item.releaseTimer = null;
      item.started = false;
      item.busy = false;
      drainSlot(name, generation);
    }, PLAY_RELEASE_FALLBACK_MS);
    item.player.play();
  } catch (error) {
    item.started = false;
    if (item.releaseTimer !== null) {
      clearTimeout(item.releaseTimer);
      item.releaseTimer = null;
    }
    item.busy = false;
    warnDev(`Failed to play "${name}".`, error);
    drainSlot(name, generation);
  }
}

function getOrCreateSlot(name: SfxName): SfxSlot {
  const existing = slots[name];
  if (existing) return existing;
  const slot: SfxSlot = {
    players: [],
    pending: [],
    creating: null,
    loadAttempts: 0,
  };
  slots[name] = slot;
  return slot;
}

export function preloadSfx(): void {
  // The app warms only the shared session. Sound files load on demand so
  // startup never creates dozens of native decoders at once.
  if (!sessionWarmPromise) {
    sessionWarmPromise = ensureAudioSessionConfigured().catch(error => {
      warnDev('Failed to warm audio session.', error);
    });
  }
}

export function warmBossOutcomeSfx(): void {
  if (!useGameStore.getState().soundEnabled) return;
  const generation = lifecycleGeneration;
  BOSS_OUTCOME_SFX.forEach(name => {
    const slot = getOrCreateSlot(name);
    if (slot.players.length === 0 && !slot.creating && slot.loadAttempts < 2) {
      createPlayer(name, generation);
    }
  });
}

export function sfxReady(): Promise<void> {
  return sessionWarmPromise ?? ensureAudioSessionConfigured();
}

export function playSfx(
  name: SfxName,
  options?: { rate?: number; bypassCooldown?: boolean },
): void {
  if (!useGameStore.getState().soundEnabled) return;
  const config = SFX[name];
  const now = Date.now();
  if (!options?.bypassCooldown && now - (lastPlayedAt[name] ?? 0) < config.cooldownMs) return;
  lastPlayedAt[name] = now;

  const slot = getOrCreateSlot(name);
  if (slot.pending.length >= MAX_PENDING_PLAYS) slot.pending.shift();
  slot.pending.push({ rate: options?.rate ?? 1 });
  const generation = lifecycleGeneration;
  if (slot.players.length === 0 && !slot.creating) createPlayer(name, generation);
  drainSlot(name, generation);
}

export function unloadSfx(): void {
  lifecycleGeneration += 1;
  (Object.keys(slots) as SfxName[]).forEach(name => {
    const slot = slots[name];
    slot?.players.forEach(removePlayer);
    delete slots[name];
    delete lastPlayedAt[name];
  });
  sessionWarmPromise = null;
}
