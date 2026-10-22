// The Hunt dive (Pete, 2026-10-22): tap ENTER THE HUNT, the two console buttons retreat back into
// the console one after the other (POLYBOOK first, then HUNT), the hall with the golden end shows
// in the opening, the whole scene zooms down the hall, a flash in the hall's own gold covers the
// screen, and the Hunt is there. Pete asked for a fast zoom and could not remember which mock speed
// felt right, so EVERY number is here, in one place, to be tuned on the phone after seeing it.
// RN-free so it can be tested.
import { TERRACE_CASTLE_DOOR } from './homeTerraceScene';

export const TERRACE_DIVE = {
  /** Multiplies every duration. 1 = the mock's fastest zoom; 0.8 is 20% quicker. */
  timescale: 1,
  /** One button receding into the hall. */
  retreatMs: 380,
  /** A retreating button ends this fraction of its size, at the hall's golden end. */
  retreatScale: 0.3,
  /** HUNT starts retreating this long after POLYBOOK. */
  retreatStaggerMs: 150,
  /** Pause with the hall showing, before the zoom starts. */
  holdMs: 300,
  /** The zoom itself. */
  zoomMs: 850,
  /** Final scale of the scene. Past the point the golden end fills the screen. */
  zoomScale: 10,
  /** The flash starts this far through the zoom (0..1) and ends with it. */
  flashFrom: 0.6,
  /** The flash: the Daily door's gold (PW.color.gold), richer than the hall art's pale yellow. */
  flashColor: '#F5C842',
} as const;

/** The golden end's centre inside hall.png, as fractions of the hall (measured from the art). */
export const HALL_GOLD_CENTER = { x: 0.4882, y: 0.6559 } as const;

export type DiveConfig = {
  timescale: number;
  retreatMs: number;
  retreatStaggerMs: number;
  holdMs: number;
  zoomMs: number;
  flashFrom: number;
};

export type DiveTimeline = {
  polybookRetreatAt: number;
  huntRetreatAt: number;
  retreatMs: number;
  zoomAt: number;
  zoomMs: number;
  flashAt: number;
  flashMs: number;
  /** When to navigate: the zoom is over and the screen is gold. */
  navigateAt: number;
};

/** Every moment of the dive in ms from the tap, with timescale applied. */
export function terraceDiveTimeline(c: DiveConfig = TERRACE_DIVE): DiveTimeline {
  const s = c.timescale;
  const retreatMs = c.retreatMs * s;
  const stagger = c.retreatStaggerMs * s;
  const zoomMs = c.zoomMs * s;
  const retreatsDone = stagger + retreatMs;
  const zoomAt = retreatsDone + c.holdMs * s;
  const flashAt = zoomAt + c.flashFrom * zoomMs;
  return {
    polybookRetreatAt: 0,
    huntRetreatAt: stagger,
    retreatMs,
    zoomAt,
    zoomMs,
    flashAt,
    flashMs: zoomAt + zoomMs - flashAt,
    navigateAt: zoomAt + zoomMs,
  };
}

/** Where the zoom aims: the hall's golden end, in scene pixels, given the console opening. */
export function terraceDiveOrigin(niche: { left: number; top: number; width: number; height: number }) {
  return {
    x: niche.left + HALL_GOLD_CENTER.x * niche.width,
    y: niche.top + HALL_GOLD_CENTER.y * niche.height,
  };
}

/**
 * Scaling about a point without transformOrigin: shift the point to the view's centre, scale, shift
 * back. Use as [translate(dx,dy), scale, translate(-dx,-dy)]. dx, dy = point minus view centre.
 */
export function terraceZoomShift(point: { x: number; y: number }, width: number, height: number) {
  return { dx: point.x - width / 2, dy: point.y - height / 2 };
}

// ---------------------------------------------------------------------------------------------
// The Daily dive (Pete, 2026-10-22): the castle is hidden until DAILY CHALLENGE is tapped. It then
// rises from behind the mountains to its place, the scene zooms into the castle's golden door, a
// gold flash covers the screen, and the Daily is there. As with the Hunt, every number is here to
// be tuned on the phone.
export const TERRACE_DAILY_DIVE = {
  /** Multiplies every duration. */
  timescale: 1,
  /** The castle rising from behind the mountains. */
  riseMs: 650,
  /** Pause with the castle standing, before the zoom. */
  holdMs: 250,
  zoomMs: 1100,
  /** The castle's door is tiny on the Home, so this is much more than the Hunt's zoom. */
  zoomScale: 30,
  flashFrom: 0.5,
} as const;

export type DailyDiveConfig = {
  timescale: number;
  riseMs: number;
  holdMs: number;
  zoomMs: number;
  flashFrom: number;
};

export type DailyDiveTimeline = {
  riseMs: number;
  zoomAt: number;
  zoomMs: number;
  flashAt: number;
  flashMs: number;
  navigateAt: number;
};

export function terraceDailyDiveTimeline(c: DailyDiveConfig = TERRACE_DAILY_DIVE): DailyDiveTimeline {
  const s = c.timescale;
  const riseMs = c.riseMs * s;
  const zoomMs = c.zoomMs * s;
  const zoomAt = riseMs + c.holdMs * s;
  const flashAt = zoomAt + c.flashFrom * zoomMs;
  return { riseMs, zoomAt, zoomMs, flashAt, flashMs: zoomAt + zoomMs - flashAt, navigateAt: zoomAt + zoomMs };
}

/** The castle's painted golden door (measured from castle.webp), as fractions of the castle. */
export function terraceCastleDoor() {
  return { x: TERRACE_CASTLE_DOOR.x, y: TERRACE_CASTLE_DOOR.y };
}

/** Where the Daily zoom aims: the castle door, in scene pixels, given the castle's rect. */
export function terraceDailyOrigin(castle: { left: number; top: number; width: number; height: number }) {
  const door = terraceCastleDoor();
  return { x: castle.left + door.x * castle.width, y: castle.top + door.y * castle.height };
}

// ---------------------------------------------------------------------------------------------
// The Polybook rise (Pete, 2026-10-22): tap POLYBOOK, HUNT and POLYBOOK retreat into the hall exactly
// as in the Hunt dive, then the Polybook screen opens TRANSPARENT over the Home and its own closed
// cover rises out of the hall by itself, face forward, growing into its resting place (so it lands
// exactly, on every phone). Only after it has landed does the Polybook page come up around it.
export const TERRACE_BOOK_DIVE = {
  /** Multiplies the rise and hold (the retreat keeps the Hunt dive's own timescale). */
  timescale: 1,
  /** Pause with the hall showing, after both buttons are gone, before the Polybook screen opens. */
  holdMs: 120,
  /** The cover rising out of the hall to its resting place. */
  riseMs: 800,
  /** The cover starts this fraction of the console opening's width, at the hall's golden end. */
  startWidthFraction: 0.12,
  /** The Polybook page (background, header, navigation) fading in once the cover has landed. */
  pageFadeMs: 350,
} as const;

/** When Home hands over to the Polybook screen: both buttons have retreated and the hall has been seen. */
export function terraceBookDiveNavigateAt(
  hunt: DiveConfig = TERRACE_DIVE,
  book: { timescale: number; holdMs: number } = TERRACE_BOOK_DIVE,
): number {
  const t = terraceDiveTimeline(hunt);
  return t.huntRetreatAt + t.retreatMs + book.holdMs * book.timescale;
}

export type BookRiseFrom = { x: number; y: number; w: number };

/** Where the cover starts, in window pixels: the hall's golden end, and how wide it starts. */
export function terraceBookRiseFrom(niche: { left: number; top: number; width: number; height: number }): BookRiseFrom {
  const o = terraceDiveOrigin(niche);
  return { x: o.x, y: o.y, w: TERRACE_BOOK_DIVE.startWidthFraction * niche.width };
}

/**
 * The shift and scale that put the cover's centre on the start point at the start's width:
 * dx, dy move the cover's centre to the start point; scale is start width over cover width.
 */
export function terraceBookRiseTransform(
  from: BookRiseFrom,
  cover: { x: number; y: number; w: number; h: number },
): { dx: number; dy: number; scale: number } {
  return { dx: from.x - (cover.x + cover.w / 2), dy: from.y - (cover.y + cover.h / 2), scale: from.w / cover.w };
}
