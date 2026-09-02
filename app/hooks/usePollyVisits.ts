import { useCallback, useRef, useState } from 'react';
import {
  PollyBudgetState,
  PollyEvent,
  VisitSpec,
  resolveVisit,
} from '../game/pollyVisitPolicy';
import { useGameStore } from '../store/useGameStore';

export type ActiveVisit = {
  id: number;
  spec: VisitSpec;
  fastExit: boolean; // component cuts to a ~250ms fly-out when this flips true
};

// Director for Hunt Polly visits. Owns the budget flags and the one-deep
// queue; the pure policy decides, PollyHuntVisit animates. Exposes the same
// firePollyEvent(event) signature as the quarantined usePollyAnimator so
// MaskBoard's call sites stay untouched.
export function usePollyVisits(isSpeedRound: boolean, ghostRunsMissed = 0) {
  const rememberLine = useGameStore(s => s.rememberPollyLine);
  const [visit, setVisit] = useState<ActiveVisit | null>(null);
  const visitRef = useRef<ActiveVisit | null>(null);
  const pendingRef = useRef<VisitSpec | null>(null);
  const idRef = useRef(0);
  const flagsRef = useRef({
    heckleUsedThisWord: false,
    wrongSeenThisWord: false,
    cleanSweepSeenThisRun: false,
  });
  const isSpeedRoundRef = useRef(isSpeedRound);
  isSpeedRoundRef.current = isSpeedRound;
  const ghostRunsMissedRef = useRef(ghostRunsMissed);
  ghostRunsMissedRef.current = ghostRunsMissed;

  const setVisitBoth = (v: ActiveVisit | null) => {
    visitRef.current = v;
    setVisit(v);
  };

  const startVisit = (spec: VisitSpec) => {
    idRef.current += 1;
    if (spec.kind === 'heckle') flagsRef.current.heckleUsedThisWord = true;
    if (spec.lineId) rememberLine(spec.lineId, 'hunt');
    setVisitBoth({ id: idRef.current, spec, fastExit: false });
  };

  // Component reports its arc finished (fly-out done, or fast exit done).
  const onVisitDone = useCallback((id: number) => {
    if (visitRef.current?.id !== id) return;
    setVisitBoth(null);
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) startVisit(pending);
  }, [rememberLine]);

  const firePollyEvent = useCallback((event: PollyEvent) => {
    const flags = flagsRef.current;
    const state: PollyBudgetState = {
      busy: visitRef.current !== null || pendingRef.current !== null,
      heckleUsedThisWord: flags.heckleUsedThisWord,
      wrongSeenThisWord: flags.wrongSeenThisWord,
      cleanSweepSeenThisRun: flags.cleanSweepSeenThisRun,
      isSpeedRound: isSpeedRoundRef.current,
      ghostRunsMissed: ghostRunsMissedRef.current,
      recentLineIds: useGameStore.getState().pollyMemory.recentLineIds,
      lineRoll: Math.random(),
    };
    const decision = resolveVisit(event, state);

    // Flag bookkeeping happens on the EVENT, not only on shown visits:
    // the first wrong of a word consumes eligibility even if dropped.
    if (event === 'wrong' || event === 'oneHeartLeft') flags.wrongSeenThisWord = true;
    if (event === 'cleanSweep' && decision.action === 'visit' && decision.spec.kind === 'guaranteed') {
      flags.cleanSweepSeenThisRun = true;
    }

    if (decision.action === 'wordEntry') {
      flags.heckleUsedThisWord = false;
      flags.wrongSeenThisWord = false;
      // Word advanced while a heckle was on screen → fast fly-out.
      // Guaranteed visits are never cut by a word change.
      const cur = visitRef.current;
      if (cur && cur.spec.kind === 'heckle' && !cur.fastExit) {
        setVisitBoth({ ...cur, fastExit: true });
      }
      return;
    }

    if (decision.action !== 'visit') return;

    const cur = visitRef.current;
    if (cur) {
      // Only guaranteed specs reach here while busy (policy drops busy
      // heckles). Hard-cut the current visit and queue this one behind it.
      pendingRef.current = decision.spec;
      if (!cur.fastExit) setVisitBoth({ ...cur, fastExit: true });
      return;
    }
    startVisit(decision.spec);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { visit, onVisitDone, firePollyEvent };
}
