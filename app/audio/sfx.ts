import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { useGameStore } from '../store/useGameStore';
import { ensureAudioSessionConfigured } from './audioSession';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'correctClaim'
  | 'trapWrong'
  | 'wrongImpact'
  | 'streakBreakImpact'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'masteredTransform'
  | 'masteredBookSlam'
  | 'masteredResult'
  | 'hauntedTransformSlam'
  | 'hauntedResult'
  | 'pressHoldStart'
  | 'pollySqwawkShort'
  | 'pollySqwawkLaugh'
  | 'bookClose'
  | 'detectiveSting'
  | 'lockSpin1'
  | 'lockSpin2'
  | 'lockSpin3'
  | 'gauntletPick'
  // Boss gauntlet entrance — the wall trembles, each brick tears out, each
  // lands (BossGauntletSpines.tsx, wallShake.ts). One tear and one land cue
  // PER SLOT, chosen by slot index, never shuffled — see the registry note.
  | 'stoneRumble'
  | 'stoneTear1'
  | 'stoneTear2'
  | 'stoneTear3'
  | 'stoneLand1'
  | 'stoneLand2'
  | 'stoneLand3'
  // Daily scroll mechanism — BLOCKED on assets, see the SFX registration
  // below. Uncomment together with the matching entries in SFX and the
  // guarded call sites in DailyChallengeScreen.tsx once the files land.
  // | 'scrollPaperRoll'
  // | 'scrollRodKnock'
  // | 'inkStamp'
  ;

type SfxConfig = {
  source: Parameters<typeof createAudioPlayer>[0];
  volume: number;
  cooldownMs: number;
  fallbackReleaseMs?: number;
};

type PendingPlay = {
  rate: number;
  onFinish?: () => void;
};

type SfxPlayer = {
  player: AudioPlayer;
  ready: boolean;
  busy: boolean;
  started: boolean;
  onFinish: (() => void) | null;
  removeStatusListener: () => void;
  releaseTimer: ReturnType<typeof setTimeout> | null;
};

type SfxSlot = {
  players: SfxPlayer[];
  pending: PendingPlay[];
  creating: Promise<void> | null;
  loadAttempts: number;
};

// The landing sound's one and only config, shared by stoneLand1-3. There are
// three names only so each landing gets its own player (see the registry
// note); they must never become three different sounds. One OBJECT, not three
// copies, so a file swap or a volume change lands on every brick at once and
// the three cannot drift apart. Each name still gets its own player and its
// own cooldown — both of those are keyed by name, not by config.
const STONE_LAND_SFX: SfxConfig = {
  source: require('../../assets/audio/sfx/stone_land.mp3'),
  volume: 0.54,
  cooldownMs: 200,
};

const SFX: Record<SfxName, SfxConfig> = {
  uiClick:        { source: require('../../assets/audio/sfx/ui_click.mp3'),          volume: 0.25, cooldownMs: 80 },
  tileSwipe:      { source: require('../../assets/audio/sfx/tile_swipe.mp3'),        volume: 0.25, cooldownMs: 80 },
  correctClaim:   { source: require('../../assets/audio/sfx/mystical_chime.mp3'),     volume: 0.35, cooldownMs: 120 },
  trapWrong:      { source: require('../../assets/audio/sfx/trap_wrong.mp3'),        volume: 0.35, cooldownMs: 120 },
  wrongImpact:    { source: require('../../assets/audio/sfx/character_fall_impact.mp3'), volume: 0.48, cooldownMs: 120 },
  streakBreakImpact: { source: require('../../assets/audio/sfx/punch_impact_hit.mp3'), volume: 0.55, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/audio/sfx/broken_glass_impact.mp3'), volume: 0.55, cooldownMs: 140 },
  mastered:       { source: require('../../assets/audio/sfx/mastered_chime.mp3'),    volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/audio/sfx/haunted_moan.mp3'),      volume: 0.30, cooldownMs: 2600 },
  masteredTransform: { source: require('../../assets/audio/sfx/mastered_transform_v1.wav'), volume: 0.45, cooldownMs: 2200 },
  masteredBookSlam: { source: require('../../assets/audio/sfx/mastered_book_slam_v1.wav'), volume: 0.60, cooldownMs: 300 },
  masteredResult: { source: require('../../assets/audio/sfx/mastered_result_sting_v1.wav'), volume: 0.45, cooldownMs: 2200 },
  hauntedTransformSlam: { source: require('../../assets/audio/sfx/haunted_transform_slam_v1.wav'), volume: 0.60, cooldownMs: 2600 },
  hauntedResult:  { source: require('../../assets/audio/sfx/dark_magic_curse_impact.mp3'), volume: 0.55, cooldownMs: 2600 },
  pressHoldStart: { source: require('../../assets/audio/sfx/press_hold_start.mp3'),  volume: 0.40, cooldownMs: 300 },
  pollySqwawkShort: { source: require('../../assets/audio/sfx/pollySqwawkShort.wav'), volume: 0.42, cooldownMs: 120 },
  pollySqwawkLaugh: { source: require('../../assets/audio/sfx/pollySqwawkLaugh.wav'), volume: 0.42, cooldownMs: 600 },
  bookClose:      { source: require('../../assets/audio/sfx/book_close_v2.mp3'),      volume: 0.60, cooldownMs: 300 },
  detectiveSting: { source: require('../../assets/audio/sfx/detective_clue_sting.mp3'), volume: 0.30, cooldownMs: 1200, fallbackReleaseMs: 16000 },
  lockSpin1:      { source: require('../../assets/audio/sfx/lock_spin_1.mp3'),         volume: 0.40, cooldownMs: 150 },
  lockSpin2:      { source: require('../../assets/audio/sfx/lock_spin_2.mp3'),         volume: 0.40, cooldownMs: 150 },
  lockSpin3:      { source: require('../../assets/audio/sfx/lock_spin_3.mp3'),         volume: 0.40, cooldownMs: 150 },
  gauntletPick:   { source: require('../../assets/audio/sfx/gauntlet_pick_swoosh.mp3'), volume: 0.45, cooldownMs: 200 },

  // Boss gauntlet entrance. These volumes are FILE-RELATIVE: each is set from
  // that file's measured loudest 100ms (decoded with ffmpeg, sliding RMS) so
  // the layers sit where they were asked to — the rumble UNDER at about
  // -24 dBFS effective, the tears in the middle at about -19, the land ON TOP
  // at about -15. The land matches trapShatter and streakBreakImpact and sits
  // 3dB under masteredBookSlam (-12), so the round's MASTERED climax stays the
  // loudest thing in it.
  //
  // Raw loudest-100ms: rumble -16.3, tears -11.3 / -12.2 / -13.6, land -9.6.
  // That spread is why the three tear volumes differ: they are equalised to a
  // single level, so the bricks read as three different stones by their sound,
  // never by one of them simply being louder.
  //
  // One LAND cue per slot, all three on the same file, on purpose. The
  // landings fall 240ms apart and the file runs 627ms, so at the third landing
  // all three are sounding at once. A single shared cue caps at
  // MAX_PLAYERS_PER_SOUND (2) and only creates its second player once the
  // first is busy — so the second land would start a native load late, and
  // the third would queue until about 147ms after its own dust. Three names
  // give each landing its own pre-warmed player that starts on the dust frame.
  //
  // stoneRumble's cooldown is long because it fires exactly once per gauntlet;
  // it only exists to swallow a double-run of the effect that triggers it.
  stoneRumble: { source: require('../../assets/audio/sfx/stone_rumble.mp3'), volume: 0.41, cooldownMs: 600 },
  stoneTear1:  { source: require('../../assets/audio/sfx/stone_tear_1.mp3'), volume: 0.41, cooldownMs: 200 },
  stoneTear2:  { source: require('../../assets/audio/sfx/stone_tear_2.mp3'), volume: 0.46, cooldownMs: 200 },
  stoneTear3:  { source: require('../../assets/audio/sfx/stone_tear_3.mp3'), volume: 0.54, cooldownMs: 200 },
  stoneLand1:  STONE_LAND_SFX,
  stoneLand2:  STONE_LAND_SFX,
  stoneLand3:  STONE_LAND_SFX,

  // Daily scroll mechanism. The 2.24s correct-claim sequence shipped with one
  // sound (correctClaim) and no haptic after the swipe, so a physical
  // mechanism read as a picture sliding around.
  //
  // BLOCKED: these three assets do not exist yet. Nothing already on the shelf
  // is a substitute — gauntlet_pick_swoosh in particular is not paper. Keep
  // these commented out until Pete supplies the files; the call sites below
  // are already wired and will start sounding the moment they are registered.
  //
  // scrollPaperRoll fires at BOTH ends of the mechanism: the cover-down
  // (reward paper rolling down over the ink, 560ms) and the reveal-up
  // (rolling back up to the next clue, 420ms). The plan called this "one
  // asset, reversed for the up-roll" — expo-audio has no reverse playback
  // and this player registry has no notion of it, so that is NOT
  // implemented here. Open question for whoever authors the file (Pete's
  // call, not decided in code):
  //   (a) one file played forward at both ends — paper unrolling and
  //       re-rolling sound broadly alike, so this is likely close enough
  //       and is the cheaper option: zero extra wiring, both call sites
  //       already point at `scrollPaperRoll`.
  //   (b) a second file, e.g. `scroll_paper_unroll_v1.wav`, registered as
  //       its own cue for the reveal-up call site specifically.
  // The reveal-up call site is a one-line repoint either way.
  // scrollPaperRoll: { source: require('../../assets/audio/sfx/scroll_paper_roll_v1.wav'), volume: 0.40, cooldownMs: 120 },
  // scrollRodKnock:  { source: require('../../assets/audio/sfx/scroll_rod_knock_v1.wav'),  volume: 0.45, cooldownMs: 120 },
  // inkStamp:        { source: require('../../assets/audio/sfx/ink_stamp_v1.wav'),         volume: 0.42, cooldownMs: 200 },
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
  'hauntedResult',
];

// The gauntlet's per-slot cues, in slot order. Index 0 is always brick 1.
const GAUNTLET_TEAR_SFX = ['stoneTear1', 'stoneTear2', 'stoneTear3'] as const;
const GAUNTLET_LAND_SFX = ['stoneLand1', 'stoneLand2', 'stoneLand3'] as const;

/**
 * The tear cue for a gauntlet slot, strictly by index — brick 1 always tears
 * with stone_tear_1, and so on. Never shuffled: the variation is there so the
 * three read as three different stones, and a shuffle would turn that into
 * noise.
 */
export function gauntletTearSfx(slotIndex: number): SfxName {
  return GAUNTLET_TEAR_SFX[slotIndex % GAUNTLET_TEAR_SFX.length];
}

/** The land cue for a gauntlet slot — its own player, see the registry note. */
export function gauntletLandSfx(slotIndex: number): SfxName {
  return GAUNTLET_LAND_SFX[slotIndex % GAUNTLET_LAND_SFX.length];
}

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
  const onFinish = item.onFinish;
  item.onFinish = null;
  item.removeStatusListener();
  try {
    item.player.remove();
  } catch {}
  onFinish?.();
}

function finishPlayback(name: SfxName, item: SfxPlayer, generation: number): void {
  if (!item.busy && !item.started && item.onFinish === null) return;
  item.started = false;
  item.busy = false;
  if (item.releaseTimer !== null) {
    clearTimeout(item.releaseTimer);
    item.releaseTimer = null;
  }
  const onFinish = item.onFinish;
  item.onFinish = null;
  onFinish?.();
  drainSlot(name, generation);
}

function dropPending(slot: SfxSlot): void {
  const pending = slot.pending.splice(0);
  pending.forEach(request => request.onFinish?.());
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
        dropPending(slot);
      }
      return;
    }

    const request = slot.pending.shift();
    if (!request) return;
    item.busy = true;
    item.started = false;
    void playOnPlayer(name, item, request.rate, generation, request.onFinish);
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
        onFinish: null,
        removeStatusListener: () => {},
        releaseTimer: null,
      };
      item.removeStatusListener = player.addListener('playbackStatusUpdate', status => {
        if (status.isLoaded) settleReady();
        if (item.started && status.didJustFinish) {
          finishPlayback(name, item, generation);
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
            dropPending(slot);
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
  onFinish?: () => void,
): Promise<void> {
  item.onFinish = onFinish ?? null;
  try {
    item.player.pause();
    await item.player.seekTo(0, 0, 0);
    item.player.shouldCorrectPitch = rate === 1;
    item.player.setPlaybackRate(rate);
    item.started = true;
    item.releaseTimer = setTimeout(
      () => finishPlayback(name, item, generation),
      SFX[name].fallbackReleaseMs ?? PLAY_RELEASE_FALLBACK_MS,
    );
    item.player.play();
  } catch (error) {
    warnDev(`Failed to play "${name}".`, error);
    finishPlayback(name, item, generation);
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

// Pre-creates one ready player per named cue, ahead of a beat that has to
// start on time. Sounds otherwise load on demand, so a cue's FIRST play waits
// on a native load before it makes a sound.
function warmSfx(names: readonly SfxName[]): void {
  if (!useGameStore.getState().soundEnabled) return;
  const generation = lifecycleGeneration;
  names.forEach(name => {
    const slot = getOrCreateSlot(name);
    if (slot.players.length === 0 && !slot.creating && slot.loadAttempts < 2) {
      createPlayer(name, generation);
    }
  });
}

export function warmBossOutcomeSfx(): void {
  warmSfx(BOSS_OUTCOME_SFX);
}

/**
 * Warms the rumble plus the tear and land cue for each slot actually on
 * screen — one for a Returning Haunt, three for a boss.
 */
export function warmGauntletEntranceSfx(tileCount: number): void {
  const names: SfxName[] = ['stoneRumble'];
  const count = Math.min(Math.max(tileCount, 0), GAUNTLET_TEAR_SFX.length);
  for (let i = 0; i < count; i += 1) {
    names.push(GAUNTLET_TEAR_SFX[i], GAUNTLET_LAND_SFX[i]);
  }
  warmSfx(names);
}

export function sfxReady(): Promise<void> {
  return sessionWarmPromise ?? ensureAudioSessionConfigured();
}

export function playSfx(
  name: SfxName,
  options?: { rate?: number; bypassCooldown?: boolean; onFinish?: () => void },
): boolean {
  if (!useGameStore.getState().soundEnabled) return false;
  const config = SFX[name];
  const now = Date.now();
  if (!options?.bypassCooldown && now - (lastPlayedAt[name] ?? 0) < config.cooldownMs) return false;
  lastPlayedAt[name] = now;

  const slot = getOrCreateSlot(name);
  if (slot.pending.length >= MAX_PENDING_PLAYS) slot.pending.shift()?.onFinish?.();
  slot.pending.push({ rate: options?.rate ?? 1, onFinish: options?.onFinish });
  const generation = lifecycleGeneration;
  if (slot.players.length === 0 && !slot.creating) createPlayer(name, generation);
  drainSlot(name, generation);
  return true;
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
