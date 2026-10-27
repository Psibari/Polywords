import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const audioPlayerPath = 'node_modules/expo-audio/ios/AudioPlayer.swift';
const audioPlayer = readFileSync(audioPlayerPath, 'utf8');

assert.match(
  audioPlayer,
  /guard let item = ref\.currentItem, item\.status == \.readyToPlay, item\.duration\.isIndefinite,\s*let currentDate = item\.currentDate\(\)/,
  'expo-audio patch must call currentDate() only for a ready-to-play live item',
);
assert.match(
  audioPlayer,
  /func currentStatus\(knownCurrentTime: Double\? = nil\) -> \[String: Any\?\]/,
  'expo-audio patch must let currentStatus accept a known current time',
);
assert.match(
  audioPlayer,
  /"currentTime": knownCurrentTime \?\? currentTime/,
  'expo-audio patch must prefer the known current time',
);
assert.match(
  audioPlayer,
  /currentStatus\(knownCurrentTime: dict\["currentTime"\] as\? Double\)/,
  'expo-audio patch must forward the observer current time into currentStatus',
);

console.log('expo-audio 57.0.5 iOS watchdog patch guard passed');
