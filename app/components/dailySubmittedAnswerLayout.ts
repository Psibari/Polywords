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
): DailySubmittedAnswerLayout {
  const frameWidth = clueFrame?.width ?? 360;
  const frameHeight = clueFrame?.height ?? 190;
  const width = origin?.width ?? Math.min(170, frameWidth * 0.47);
  const height = origin?.height ?? 64;

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
