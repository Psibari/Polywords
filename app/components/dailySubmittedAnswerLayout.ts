export type DailyWindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DailySubmittedAnswerLayout = {
  startX: number;
  startY: number;
  width: number;
  height: number;
};

export function createDailySubmittedAnswerLayout(
  origin: DailyWindowRect | null,
  clueFrame: DailyWindowRect | null,
  // Fallback height used when `origin` is null — a lost measurement race in
  // DailyAnswerCard's publishClaim (100ms) or the accessibility path with no
  // origin at all. Defaults to 64 so existing callers/tests are unchanged.
  // DailyChallengeScreen passes the live DEV-ONLY cardHeight tuning value
  // here so a lost race still flies a card sized like the grid instead of
  // silently reverting to the pre-tuning 64.
  fallbackHeight: number = 64,
): DailySubmittedAnswerLayout {
  const frameWidth = clueFrame?.width ?? 360;
  const frameHeight = clueFrame?.height ?? 190;
  const width = origin?.width ?? Math.min(170, frameWidth * 0.47);
  const height = origin?.height ?? fallbackHeight;

  return {
    startX: origin && clueFrame
      ? origin.x - clueFrame.x
      : (frameWidth - width) / 2,
    startY: origin && clueFrame
      ? origin.y - clueFrame.y
      : frameHeight + 90,
    width,
    height,
  };
}
