import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'trapWrong'
  | 'wrongLame'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'pollyCall'
  | 'gateOpen'
  | 'pressHoldStart';

type SfxConfig = {
  source: Parameters<typeof createAudioPlayer>[0];
  volume: number;
  cooldownMs: number;
};

const SFX: Record<SfxName, SfxConfig> = {
  uiClick:        { source: require('../../assets/sfx/ui_click.mp3'),         volume: 0.25, cooldownMs: 80   },
  tileSwipe:      { source: require('../../assets/sfx/tile_swipe.mp3'),       volume: 0.25, cooldownMs: 80   },
  trapWrong:      { source: require('../../assets/sfx/trap_wrong.mp3'),       volume: 0.35, cooldownMs: 120  },
  wrongLame:      { source: require('../../assets/sfx/wrong_lame_whistle.mp3'), volume: 0.42, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/sfx/trap_shatter.mp3'),     volume: 0.40, cooldownMs: 140  },
  mastered:       { source: require('../../assets/sfx/mastered_chime.mp3'),   volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/sfx/haunted_moan.mp3'),     volume: 0.30, cooldownMs: 2600 },
  pollyCall:      { source: require('../../assets/sfx/polly_call.mp3'),       volume: 0.25, cooldownMs: 1500 },
  gateOpen:       { source: require('../../assets/sfx/gate_open.mp3'),        volume: 0.35, cooldownMs: 700  },
  pressHoldStart: { source: require('../../assets/sfx/press_hold_start.mp3'), volume: 0.40, cooldownMs: 300  },
};

const players: Partial<Record<SfxName, AudioPlayer>> = {};
const lastPlayedAt: Partial<Record<SfxName, number>> = {};

let audioModeSet = false;

export function preloadSfx(): void {
  if (!audioModeSet) {
    audioModeSet = true;
    setAudioModeAsync({
      playsInSilentMode:    true,
      shouldPlayInBackground: false,
      interruptionMode:     'duckOthers',
    }).catch(() => {});
  }

  (Object.entries(SFX) as [SfxName, SfxConfig][]).forEach(([name, config]) => {
    if (players[name]) return;
    try {
      const player = createAudioPlayer(config.source);
      player.volume = config.volume;
      players[name] = player;
    } catch {
      // leave absent — playSfx will skip silently
    }
  });
}

export function playSfx(name: SfxName): void {
  const config = SFX[name];
  const now = Date.now();
  if ((now - (lastPlayedAt[name] ?? 0)) < config.cooldownMs) return;

  if (!players[name]) preloadSfx();

  const player = players[name];
  if (!player) return;

  try {
    lastPlayedAt[name] = Date.now();
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // silent failure
  }
}

export function unloadSfx(): void {
  (Object.keys(players) as SfxName[]).forEach(name => {
    try { players[name]?.remove(); } catch {}
    delete players[name];
    delete lastPlayedAt[name];
  });
  audioModeSet = false;
}
