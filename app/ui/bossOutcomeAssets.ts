import type { ImageSourcePropType } from 'react-native';

// Static (non-animated) art for boss round outcomes. `null` means the asset
// doesn't exist yet — consumers must render nothing, not a placeholder shape.
// Populate by replacing `null` with a `require(...)` once Pete supplies the
// art; no other code changes needed at the call site.
export const bossOutcomeAssets: {
  masterSeal: ImageSourcePropType | null;
} = {
  masterSeal: null,
};
