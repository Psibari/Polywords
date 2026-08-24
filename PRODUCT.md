# Product

<!-- impeccable:product-schema 1 -->

## Purpose and Audience

POLYWORDS is a broad-audience mobile recognition game, not a vocabulary lesson. Familiar
words hide several everyday meanings; the desired reaction is “Wait… Oh. Right.”

The app ships one visual language across iOS and Android while respecting native safe areas,
reduced motion, performance, and gesture behavior.

## Core Experience

- **Hunt:** UP claims a REAL; RIGHT rejects a trap. A run escalates toward Polly's Word and
  its hidden gauntlet. Failed boss words can return as Haunts.
- **Daily:** five UP-only connection puzzles, one attempt per date, with a Gold Feather for
  a win. Its 43-word locked source pool is approved.
- **Vault:** the player's reclaimed-word archive.
- **Home / Settings:** launch, identity, preferences, local reminders, and playtest tools.

Polly is an authored, smug trap-setter. She is an opponent, not a friendly mascot, content
generator, or owner of the words.

## Product Locks

1. Recognition over definition recall.
2. Polysemous words, fair REALS, and legally wrong traps.
3. Swiping is a meaningful physical action, not decorative navigation.
4. Ordinary choices remain neutral until commitment.
5. Haunted words return; mastery resolves unfinished business.
6. The Vault belongs to the player.
7. Gold is scarce; the nocturnal purple/near-black palette is unified across modes.

## Technical Shape

- Expo/React Native, strict TypeScript, Zustand + immer, AsyncStorage.
- React Native Animated plus isolated Reanimated gesture surfaces.
- Authored local content and character copy; no generated dialogue at runtime.
- Local-only playtest telemetry; no analytics network pipeline currently exists.

## Release Gates

- Complete representative iOS and Android device journeys.
- Validate accessibility, interruption/resume, persistence, and lower-end performance.
- Do not claim store presence, testimonials, market results, or compliance evidence that does
  not exist.
