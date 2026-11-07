import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The Polybook opens as a transparent modal from Home. On the first open of an app launch its own
// SafeAreaView read zero insets, so the book came out tall and the title sat under the status bar
// (Pete's screenshots, 2026-11-07). The screen takes its insets from the app-wide provider instead.
const vault = readFileSync('app/screens/VaultScreen.tsx', 'utf8');

assert.match(vault, /useSafeAreaInsets\(\)/, 'VaultScreen must read insets with useSafeAreaInsets');
assert.doesNotMatch(vault, /<SafeAreaView/, 'VaultScreen must not use a SafeAreaView of its own');
assert.match(vault, /paddingTop: insets\.top/, 'the top inset must be applied');
assert.match(vault, /paddingBottom: insets\.bottom/, 'the bottom inset must be applied');

console.log('vault safe area static checks passed');
