// HUD lesson content and spotlight geometry. RN-free so it runs under node;
// HudLessonLayer renders it, firstRunOnboarding decides which lesson is due.
import type { HudLessonId } from './firstRunOnboarding';
import type { VisitSpec } from './pollyVisitPolicy';

export type HudLessonTarget = 'feathers' | 'streak' | 'rounds';

export type HudLessonContent = {
  target: HudLessonTarget;
  lines: readonly string[];
  continueLabel: string;
  pollyLine: string;
  pollyPose: VisitSpec['perchPose'];
  // How long the triggering event gets to land on screen before the lesson
  // appears: the wrong card's exit and the feather launch, the tier-up pop,
  // the FELL OFF drop, or the round chip's pop.
  settleMs: number;
};

export const HUD_LESSON_CONTENT: Record<HudLessonId, HudLessonContent> = {
  feather: {
    target: 'feathers',
    lines: [
      'THESE ARE YOUR FEATHERS.',
      'THEY’RE YOUR LIVES.',
      'WRONG CALLS COST ONE.',
      'LOSE THEM ALL, AND POLLY WINS THE HUNT.',
    ],
    continueLabel: 'CONTINUE',
    pollyLine: 'And you lost to a bird.',
    pollyPose: 'smug',
    settleMs: 950,
  },
  multiplier: {
    target: 'streak',
    lines: [
      'YOU’RE ON A RUN.',
      'CONSECUTIVE CORRECT CALLS BOOST YOUR SCORE.',
      'KEEP IT GOING TO REACH 3×.',
    ],
    continueLabel: 'CONTINUE',
    pollyLine: 'Try not to ruin it.',
    pollyPose: 'point',
    settleMs: 800,
  },
  streakBreak: {
    target: 'streak',
    lines: ['WRONG CALLS BREAK YOUR RUN.'],
    continueLabel: 'GOT IT',
    pollyLine: 'There it is.',
    pollyPose: 'laugh',
    settleMs: 950,
  },
  progress: {
    target: 'rounds',
    lines: [
      'ONE WORD DOWN.',
      'EACH MARKER IS ANOTHER WORD IN THE HUNT.',
      'REACH THE CROWN TO FACE POLLY’S WORD.',
    ],
    continueLabel: 'CONTINUE',
    pollyLine: 'Assuming you make it that far.',
    pollyPose: 'smug',
    settleMs: 650,
  },
};

// A tap still in flight from the swipe that triggered the lesson must not
// dismiss it, so the continue control arms a moment after the panel appears.
export const HUD_LESSON_CONTINUE_ARM_MS = 450;
const PANEL_FADE_MS = 180;

export type HudLessonPresentation = HudLessonContent & {
  panelFadeMs: number;
  requiresAcknowledgement: true;
  spokenCopy: string;
  spokenPolly: string;
};

// Reduce Motion drops only the fade. Every line, the acknowledgement and the
// settle pacing stay exactly the same.
export function resolveHudLessonPresentation(
  lesson: HudLessonId,
  reduceMotion: boolean,
): HudLessonPresentation {
  const content = HUD_LESSON_CONTENT[lesson];
  return {
    ...content,
    panelFadeMs: reduceMotion ? 0 : PANEL_FADE_MS,
    requiresAcknowledgement: true,
    spokenCopy: content.lines.map(line => sentenceCase(line)).join(' '),
    spokenPolly: `Polly says, ${content.pollyLine}`,
  };
}

function sentenceCase(line: string): string {
  const lower = line.toLowerCase().replace(/3×/g, '3 times');
  return lower
    .replace(/(^|[.!?]\s+)([a-z])/g, (_match, lead: string, letter: string) => lead + letter.toUpperCase())
    .replace(/\bpolly\b/g, 'Polly')
    .replace(/\bhunt\b/g, 'Hunt');
}

export function hudLessonPollyVisit(lesson: HudLessonId): VisitSpec {
  const content = HUD_LESSON_CONTENT[lesson];
  return {
    kind: 'guaranteed',
    flyPose: 'fly',
    perchPose: content.pollyPose,
    lineId: null,
    line: content.pollyLine,
    sfx: 'pollySqwawkShort',
    holdPerch: false,
    perchMs: 1600,
  };
}

// ─── Spotlight geometry ─────────────────────────────────────

export type Rect = { x: number; y: number; width: number; height: number };

export const SPOTLIGHT_PADDING = 6;
export const SPOTLIGHT_MARGIN = 16;
export const SPOTLIGHT_MAX_PANEL_WIDTH = 420;
export const SPOTLIGHT_ARROW_HALF_WIDTH = 11;
export const SPOTLIGHT_ARROW_HEAD = 13;
export const SPOTLIGHT_ARROW_STEM = 16;
const ARROW_GAP = 5;
// The arrow never sits over the panel's rounded corners.
const ARROW_CORNER_INSET = 26;

export type SpotlightGeometry = {
  hole: Rect;
  scrim: { top: Rect; bottom: Rect; left: Rect; right: Rect };
  placement: 'below' | 'above';
  arrow: {
    centerX: number;
    // y of the arrow's point, just off the highlight ring.
    tipY: number;
    // y where the stem meets the panel edge.
    baseY: number;
  };
  panel: { left: number; width: number; top: number | null; bottom: number | null };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// target and layer share the window's coordinate space (both measured with
// measureInWindow); the result is in the layer's own coordinates, so the safe
// area, the HUD's layout and any board shake all cancel out.
export function resolveHudSpotlightGeometry(
  targetInWindow: Rect,
  layerInWindow: Rect,
): SpotlightGeometry {
  const layerWidth = layerInWindow.width;
  const layerHeight = layerInWindow.height;
  const left = clamp(targetInWindow.x - layerInWindow.x - SPOTLIGHT_PADDING, 0, layerWidth);
  const top = clamp(targetInWindow.y - layerInWindow.y - SPOTLIGHT_PADDING, 0, layerHeight);
  const right = clamp(
    targetInWindow.x - layerInWindow.x + targetInWindow.width + SPOTLIGHT_PADDING,
    left,
    layerWidth,
  );
  const bottom = clamp(
    targetInWindow.y - layerInWindow.y + targetInWindow.height + SPOTLIGHT_PADDING,
    top,
    layerHeight,
  );
  const hole: Rect = { x: left, y: top, width: right - left, height: bottom - top };

  const scrim = {
    top: { x: 0, y: 0, width: layerWidth, height: top },
    bottom: { x: 0, y: bottom, width: layerWidth, height: layerHeight - bottom },
    left: { x: 0, y: top, width: left, height: hole.height },
    right: { x: right, y: top, width: layerWidth - right, height: hole.height },
  };

  const panelWidth = Math.min(layerWidth - SPOTLIGHT_MARGIN * 2, SPOTLIGHT_MAX_PANEL_WIDTH);
  const panelLeft = (layerWidth - panelWidth) / 2;
  const centerX = clamp(
    hole.x + hole.width / 2,
    panelLeft + ARROW_CORNER_INSET,
    panelLeft + panelWidth - ARROW_CORNER_INSET,
  );
  const arrowLength = SPOTLIGHT_ARROW_HEAD + SPOTLIGHT_ARROW_STEM;
  const placement = bottom + ARROW_GAP + arrowLength < layerHeight * 0.55 ? 'below' : 'above';

  if (placement === 'below') {
    const tipY = bottom + ARROW_GAP;
    const baseY = tipY + arrowLength;
    return {
      hole,
      scrim,
      placement,
      arrow: { centerX, tipY, baseY },
      panel: { left: panelLeft, width: panelWidth, top: baseY, bottom: null },
    };
  }
  const tipY = top - ARROW_GAP;
  const baseY = tipY - arrowLength;
  return {
    hole,
    scrim,
    placement,
    arrow: { centerX, tipY, baseY },
    panel: { left: panelLeft, width: panelWidth, top: null, bottom: layerHeight - baseY },
  };
}

// ─── Accessibility labels for the spotlighted HUD targets ───

export function hudTargetAccessibilityLabel(
  target: HudLessonTarget,
  hud: { lives: number; streakLabel: string; round: number; totalRounds: number },
): string {
  if (target === 'feathers') {
    return `Feathers. ${hud.lives} ${hud.lives === 1 ? 'feather' : 'feathers'} remaining.`;
  }
  if (target === 'streak') return `Run meter. ${hud.streakLabel}.`;
  return roundProgressAccessibilityLabel(hud.round, hud.totalRounds);
}

export function roundProgressAccessibilityLabel(round: number, totalRounds: number): string {
  return `Hunt progress. Word ${round} of ${totalRounds}. The crown is Polly's Word.`;
}
