import { Audio, AVPlaybackSource } from 'expo-av';

export type SfxName =
  | 'uiClick'
  | 'tileSwipe'
  | 'trapWrong'
  | 'trapShatter'
  | 'mastered'
  | 'haunted'
  | 'pollyCall'
  | 'gateOpen'
  | 'pressHoldStart';

type SfxConfig = {
  source: AVPlaybackSource;
  volume: number;
  cooldownMs: number;
};

const SFX: Record<SfxName, SfxConfig> = {
  uiClick:        { source: require('../../assets/sfx/ui_click.mp3'),        volume: 0.25, cooldownMs: 80 },
  tileSwipe:      { source: require('../../assets/sfx/tile_swipe.mp3'),      volume: 0.25, cooldownMs: 80 },
  trapWrong:      { source: require('../../assets/sfx/trap_wrong.mp3'),      volume: 0.35, cooldownMs: 120 },
  trapShatter:    { source: require('../../assets/sfx/trap_shatter.mp3'),    volume: 0.40, cooldownMs: 140 },
  mastered:       { source: require('../../assets/sfx/mastered_chime.mp3'),  volume: 0.45, cooldownMs: 2200 },
  haunted:        { source: require('../../assets/sfx/haunted_moan.mp3'),    volume: 0.30, cooldownMs: 2600 },
  pollyCall:      { source: require('../../assets/sfx/polly_call.mp3'),      volume: 0.25, cooldownMs: 1500 },
  gateOpen:       { source: require('../../assets/sfx/gate_open.mp3'),       volume: 0.35, cooldownMs: 700 },
  pressHoldStart: { source: require('../../assets/sfx/press_hold_start.mp3'), volume: 0.40, cooldownMs: 300 },
};

const sounds: Partial<Record<SfxName, Audio.Sound>> = {};
const lastPlayedAt: Partial<Record<SfxName, number>> = {};

let preloadPromise: Promise<void> | null = null;

export function preloadSfx(): Promise<void> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      await Promise.all(
        (Object.entries(SFX) as [SfxName, SfxConfig][]).map(async ([name, config]) => {
          if (sounds[name]) return;
          try {
            const { sound } = await Audio.Sound.createAsync(config.source, {
              shouldPlay: false,
              volume: config.volume,
            });
            sounds[name] = sound;
          } catch {
            sounds[name] = undefined;
          }
        })
      );
    } catch {
      preloadPromise = null;
    }
  })();

  return preloadPromise;
}

export function playSfx(name: SfxName): void {
  const config = SFX[name];
  const now = Date.now();
  const lastPlayed = lastPlayedAt[name] ?? 0;
  if (now - lastPlayed < config.cooldownMs) return;

  const playLoaded = () => {
    const sound = sounds[name];
    if (!sound) return;
    lastPlayedAt[name] = Date.now();
    sound.setVolumeAsync(config.volume)
      .then(() => sound.replayAsync())
      .catch(() => {});
  };

  if (sounds[name]) {
    playLoaded();
    return;
  }

  preloadSfx()
    .then(playLoaded)
    .catch(() => {});
}

export async function unloadSfx(): Promise<void> {
  const loadedSounds = Object.values(sounds);
  await Promise.all(
    loadedSounds.map(sound => sound.unloadAsync().catch(() => {}))
  );

  (Object.keys(sounds) as SfxName[]).forEach(name => {
    delete sounds[name];
    delete lastPlayedAt[name];
  });
  preloadPromise = null;
}
