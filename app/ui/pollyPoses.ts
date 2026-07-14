import { ImageSourcePropType } from 'react-native';

// Shared Polly pose art (clean transparent full-pose drawings).
// Both Daily and Hunt render these; expression lives in the art,
// life comes from whole-image motion.
export const POLLY_POSES = {
  idle: require('../../assets/images/polly/poses/sprite4.png'),     // smug perched, watchful
  smug: require('../../assets/images/polly/poses/sprite4.png'),     // right-facing smug perch
  laugh: require('../../assets/images/polly/poses/sprite5.png'),    // laughing wide
  point: require('../../assets/images/polly/poses/sprite7.png'),    // pointing taunt
  shocked: require('../../assets/images/polly/poses/sprite8.png'),  // shocked recoil
  sulk: require('../../assets/images/polly/poses/sprite9.png'),     // hunched angry glare
  fly: require('../../assets/images/polly/poses/sprite2.png'),      // neutral fly
  flyAngry: require('../../assets/images/polly/poses/sprite10.png'),// angry open-beak fly
  flyGrin: require('../../assets/images/polly/poses/sprite1.png'),  // confident grinning fly (reserve)
} as const;

export type PollyPoseName = keyof typeof POLLY_POSES;

// Type-check the values without widening the const map.
const _check: Record<PollyPoseName, ImageSourcePropType> = POLLY_POSES;
void _check;
