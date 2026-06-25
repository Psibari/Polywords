import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type MusicName =
  | 'gameplayBed'
  | 'flowDrums'
  | 'panicDrums'
  | 'dangerHeartbeat'
  | 'jungleAccent';

export type PlayMusicOptions = {
  loop?: boolean;
  restart?: boolean;
  volume?: number;
};

type MusicConfig = {
  source: Parameters<typeof createAudioPlayer>[0];
  volume: number;
  loop: boolean;
};

const MUSIC: Record<MusicName, MusicConfig> = {
  gameplayBed: {
    source: require('../../assets/audio/music/gameplay-bed-cinematic.wav'),
    volume: 0.22,
    loop: true,
  },
  flowDrums: {
    source: require('../../assets/audio/music/flow-tribe-drums.mp3'),
    volume: 0.10,
    loop: true,
  },
  panicDrums: {
    source: require('../../assets/audio/music/panic-atmospheric-drums.mp3'),
    volume: 0.12,
    loop: true,
  },
  dangerHeartbeat: {
    source: require('../../assets/audio/music/danger-heartbeat.wav'),
    volume: 0.06,
    loop: true,
  },
  jungleAccent: {
    source: require('../../assets/audio/music/jungle-accent.mp3'),
    volume: 0.12,
    loop: false,
  },
};

const players: Partial<Record<MusicName, AudioPlayer>> = {};
const volumes: Record<MusicName, number> = {
  gameplayBed: MUSIC.gameplayBed.volume,
  flowDrums: MUSIC.flowDrums.volume,
  panicDrums: MUSIC.panicDrums.volume,
  dangerHeartbeat: MUSIC.dangerHeartbeat.volume,
  jungleAccent: MUSIC.jungleAccent.volume,
};

let audioModeSet = false;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.min(1, Math.max(0, volume));
}

export function preloadMusic(): void {
  if (!audioModeSet) {
    audioModeSet = true;
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    }).catch(() => {});
  }

  (Object.entries(MUSIC) as [MusicName, MusicConfig][]).forEach(([name, config]) => {
    if (players[name]) return;

    try {
      const player = createAudioPlayer(config.source);
      player.volume = volumes[name];
      player.loop = config.loop;
      players[name] = player;
    } catch {
      // Leave the entry absent so future calls can retry without crashing.
    }
  });
}

export function playMusic(name: MusicName, options: PlayMusicOptions = {}): void {
  if (!players[name]) preloadMusic();

  const player = players[name];
  if (!player) return;

  try {
    player.loop = options.loop ?? MUSIC[name].loop;

    if (options.volume !== undefined) {
      const volume = clampVolume(options.volume);
      volumes[name] = volume;
      player.volume = volume;
    } else {
      player.volume = volumes[name];
    }

    if (options.restart) {
      player.seekTo(0).catch(() => {});
    }

    player.play();
  } catch {
    // Audio playback is non-critical and should fail silently.
  }
}

export function stopMusic(name?: MusicName): void {
  const names = name
    ? [name]
    : (Object.keys(players) as MusicName[]);

  names.forEach(musicName => {
    const player = players[musicName];
    if (!player) return;

    try {
      player.pause();
      player.seekTo(0).catch(() => {});
    } catch {
      // Audio playback is non-critical and should fail silently.
    }
  });
}

export function setMusicVolume(name: MusicName, volume: number): void {
  const nextVolume = clampVolume(volume);
  volumes[name] = nextVolume;

  const player = players[name];
  if (!player) return;

  try {
    player.volume = nextVolume;
  } catch {
    // Audio playback is non-critical and should fail silently.
  }
}

export function unloadMusic(): void {
  (Object.keys(players) as MusicName[]).forEach(name => {
    try {
      players[name]?.remove();
    } catch {
      // Keep unloading remaining players if one removal fails.
    }

    delete players[name];
  });

  audioModeSet = false;
}
