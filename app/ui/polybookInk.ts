// The Polybook's page ink — deliberately not a theme token. This is drawn-page
// color, not app chrome, so it lives here rather than in pwTheme.ts, shared
// only so LexiconPrototype.tsx and PolybookSpread.tsx cannot drift apart.
//
// INK is deep sepia-brown, never pure black — ink on cream paper. INK_MUTED
// stays lighter than INK on purpose: the contrast between her voice (INK) and
// everything that isn't her voice (INK_MUTED) is what makes the split
// typography read. Never bring them to the same value.
//
// Second device pass (2026-09): INK still read soft against the cream, so it
// stepped darker again, toward near-black-but-brown. INK_MUTED stepped down
// by the same delta on its base color, so the gap between the two — what
// actually makes the split typography legible — stays exactly what it was.
export const INK = "#1F180F";
export const INK_MUTED = "rgba(36,29,22,0.62)";
