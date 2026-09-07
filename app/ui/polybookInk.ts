// The Polybook's page ink — deliberately not a theme token. This is drawn-page
// color, not app chrome, so it lives here rather than in pwTheme.ts, shared
// only so LexiconPrototype.tsx and PolybookSpread.tsx cannot drift apart.
//
// INK is deep sepia-brown, never pure black — ink on cream paper. INK_MUTED
// stays lighter than INK on purpose: the contrast between her voice (INK) and
// everything that isn't her voice (INK_MUTED) is what makes the split
// typography read. Never bring them to the same value.
export const INK = "#2E2418";
export const INK_MUTED = "rgba(51,41,31,0.62)";
