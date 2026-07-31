import { useEffect, useRef, useState } from 'react';

import { GhostMeaning, Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import {
  chainMultiplierForStreak,
  getUnresolvedMaskIds,
  realMaskPoints,
  trapMaskPoints,
  mysteryMasteryPoints,
} from '../game/polyRunEngine';
import type { SwipeMaskState } from '../components/SwipeMask';
import type { PollyEvent } from '../game/pollyVisitPolicy';

export type ChainTier = 1 | 2 | 3;
type WordOutcomeState = 'none' | 'mastered' | 'haunted';

export type GauntletTile = {
  pairIndex: number;
  mask: Mask;
  isReal: boolean;
};

function chainTierFromMultiplier(mult: number): ChainTier {
  if (mult >= 2.5) return 3;
  if (mult >= 1.5) return 2;
  return 1;
}

function eventKicker(step: WordStep): string | null {
  // Reward-only framing let the boss round's stakes go unsignaled on every
  // repeat visit, not just a player's first — this always-visible badge is
  // the persistent half of that fix; BossIntroOverlay is the one-time half.
  if (step.eventType === 'bossWord')  return "POLLY'S WORD · 2× OR HAUNTED";
  if (step.eventType === 'slangDrop') return 'SLANG DROP';
  return null;
}

function buildInitialTileStates(
  masks: Mask[],
  swipedUpIds: readonly string[],
  swipedDownIds: readonly string[],
): Map<string, SwipeMaskState> {
  const swipedUp = new Set(swipedUpIds);
  const swipedDown = new Set(swipedDownIds);
  const states = new Map<string, SwipeMaskState>();
  masks.forEach(mask => {
    if (swipedUp.has(mask.id)) {
      states.set(mask.id, mask.isReal ? 'correct' : 'wrong');
      return;
    }
    if (swipedDown.has(mask.id)) {
      states.set(mask.id, mask.isReal ? 'wrong' : 'trap-caught');
      return;
    }
    states.set(mask.id, 'idle');
  });
  return states;
}

// Sensory callbacks — the hook calls these, the presenter performs them.
// Never call Animated.*, playSfx, or Haptics.* inside this hook itself;
// that's what these exist for.
export type BoardMechanicsPerform = {
  onRealClaimed(info: { mask: Mask; tier: ChainTier; points: number; nextFound: number; totalReals: number }): void;
  onTrapRejected(info: { mask: Mask; tier: ChainTier; points: number }): void;
  onWrongSwipe(info: { mask: Mask; brokeRealChain: boolean }): void;
  onGauntletCorrect(info: { swipedUp: boolean; phrase: string }): void;
  onGauntletTileDrop(index: number): void;
  onGauntletBegin(): void;
  onWordExit(perfect: boolean): void;
  onMasteredSequence(info: { isBoss: boolean; isHaunt: boolean; masteryPoints: number }): void;
  onHauntedSequence(info: { isHaunt: boolean; failedMaskId: string }): void;
  onOutcomeReveal(outcome: 'mastered' | 'haunted'): void;
  // Not in the original spec list — needed to keep the deck's red-tint
  // reaction to "lives hit zero" out of this file without duplicating the
  // firePollyEvent('oneWrongMove') call site in both places.
  onLivesDepleted(): void;
};

export type UseBoardMechanicsParams = {
  step: WordStep;
  firePollyEvent: (event: PollyEvent) => void;
  perform: BoardMechanicsPerform;
};

// Headless brain for MaskBoard/BossBoard: owns tile/deck/gauntlet/outcome
// state, store calls, and Polly judging events. Renders nothing, touches no
// Animated value, sound, or haptic — see docs/BOSS_ROUND_SPEC.md context in
// CLAUDE.md for why this exists (BossBoard reuses this same brain).
//
// MaskBoard remounts per word (keyed board-${stepIndex} by GameContent), so
// all state below is fresh on every word via plain useState/useRef
// initializers — there is no reset() to call.
export function useBoardMechanics({ step, firePollyEvent, perform }: UseBoardMechanicsParams) {
  // Scoped selectors, not a bare useGameStore() — this hook drives the
  // hottest render path in the app (every swipe), so a whole-store
  // subscription here re-rendered on completely unrelated state (daily
  // session, settings, pollyMemory...). Action functions are stable
  // references from the store, so selecting them individually never
  // triggers a re-render on their own account.
  const game = useGameStore(s => s.game);
  const ghosts = useGameStore(s => s.ghosts);
  const runStartGhostWordIds = useGameStore(s => s.runStartGhostWordIds);
  const beginMysteryGauntlet = useGameStore(s => s.beginMysteryGauntlet);
  const setGauntletActive = useGameStore(s => s.setGauntletActive);
  const incrementGauntletCorrectCount = useGameStore(s => s.incrementGauntletCorrectCount);
  const completeWord = useGameStore(s => s.completeWord);
  const submitSwipeUp = useGameStore(s => s.submitSwipeUp);
  const submitSwipeDown = useGameStore(s => s.submitSwipeDown);
  const resolveMystery = useGameStore(s => s.resolveMystery);
  const isBoss  = step.eventType === 'bossWord';
  const isHaunt = step.isHauntReturn === true;
  const isFinalGateStep = isBoss || isHaunt;
  const kicker = eventKicker(step);

  const visibleGridMasks = (game.shuffledMasks[game.stepIndex] ?? step.masks)
    .filter(m => !m.isHidden);
  const initialRemainingMaskIds = getUnresolvedMaskIds(game, visibleGridMasks);
  const initialResolvedMaskCount =
    visibleGridMasks.length - initialRemainingMaskIds.length;

  // Stale-closure-safe refs
  const streakRef = useRef(game.streak);
  streakRef.current = game.streak;
  const livesRef = useRef(game.lives);
  livesRef.current = game.lives;

  const [tileStates, setTileStates] = useState<Map<string, SwipeMaskState>>(() =>
    buildInitialTileStates(step.masks, game.swipedUpIds, game.swipedDownIds));

  const completedRef                 = useRef(false);
  const gateTriggeredRef             = useRef(false);
  const wrongSwipeOccurred           = useRef(game.mistakesOnWord > 0);
  const visiblePerfectRef            = useRef(game.mistakesOnWord === 0);
  const preMysteryChainMultiplierRef = useRef(1);
  const gapLockedRef                 = useRef(false);
  const tileIndexInWordRef           = useRef(initialResolvedMaskCount);

  const ghost = runStartGhostWordIds.includes(step.word)
    ? ghosts.find((g: GhostMeaning) => g.wordId === step.word) ?? null
    : null;

  const [remainingMaskIds, setRemainingMaskIds] = useState<string[]>(() =>
    initialRemainingMaskIds
  );

  const topMaskId    = remainingMaskIds[0] ?? null;
  const topMask      = topMaskId
    ? visibleGridMasks.find(m => m.id === topMaskId) ?? null
    : null;
  const deckSize     = remainingMaskIds.length;
  const nearMastery  = !isBoss && deckSize <= 2 && deckSize > 0;
  const topMaskState = topMask ? tileStates.get(topMask.id) ?? 'idle' : 'idle';

  const realMasks  = visibleGridMasks.filter(m => m.isReal);
  const foundCount = realMasks.filter(m => tileStates.get(m.id) === 'correct').length;

  // Returning Haunt re-tests the exact pair that beat you last run, stored on
  // the ghost. Boss draws up to 3 distinct pairs, one tile each.
  const hauntPair = ghost && ghost.hiddenMeaningReal && ghost.hiddenMeaningTrap
    ? { real: ghost.hiddenMeaningReal, trap: ghost.hiddenMeaningTrap }
    : null;

  const stepPairs: { real: string; trap: string }[] =
    step.hiddenPairs && step.hiddenPairs.length > 0
      ? step.hiddenPairs
      : step.hiddenMeaning != null && step.hiddenTrap != null
        ? [{ real: step.hiddenMeaning, trap: step.hiddenTrap }]
        : [];

  const gauntletPairs = isHaunt
    ? (hauntPair ? [hauntPair] : stepPairs.slice(0, 1))
    : stepPairs;

  const hasHidden = gauntletPairs.length > 0;

  const [gatePhase, setGatePhase] = useState<
    'locked' | 'tiles' | 'wrongFail' | 'mastered'
  >('locked');
  const [finalTileStates, setFinalTileStates] = useState<Map<string, SwipeMaskState>>(new Map());
  const [gauntletTiles, setGauntletTiles] = useState<GauntletTile[]>([]);
  const [gauntletIndex, setGauntletIndex] = useState(0);
  const [tileLanded, setTileLanded] = useState(false);
  const [failedHiddenTileId, setFailedHiddenTileId] = useState<string | null>(null);
  const activeGauntletTile = gauntletTiles[gauntletIndex] ?? null;

  const splitCompletedRef = useRef(false);

  const [wordOutcome, setWordOutcome] = useState<WordOutcomeState>('none');
  const [outcomeDetail, setOutcomeDetail] = useState<string | undefined>(undefined);
  const [outcomeBonusLabel, setOutcomeBonusLabel] = useState<string | undefined>(undefined);
  const outcomeContinueRef = useRef<(() => void) | null>(null);
  const outcomeActiveRef   = useRef(false);

  const inputLocked = wordOutcome !== 'none';

  // ── hesitation timers ─────────────────────────────────────────
  const hes1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes3Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Presenter-driven: flips true once entrance animations finish showing the
  // board, mirroring the old `showBoardContent` gate (that flag is built from
  // presentation-only readiness state, so it stays owned by the presenter).
  const [boardContentReady, setBoardContentReady] = useState(false);

  function startHesitationTimers() {
    if (hes1Ref.current !== null) { clearTimeout(hes1Ref.current); hes1Ref.current = null; }
    if (hes2Ref.current !== null) { clearTimeout(hes2Ref.current); hes2Ref.current = null; }
    if (hes3Ref.current !== null) { clearTimeout(hes3Ref.current); hes3Ref.current = null; }
    hes1Ref.current = setTimeout(() => firePollyEvent('hesitation3s'), 3000);
    hes2Ref.current = setTimeout(() => firePollyEvent('hesitation6s'), 6000);
    hes3Ref.current = setTimeout(() => firePollyEvent('hesitation9s'), 9000);
  }

  function resetHesitation() {
    firePollyEvent('hesitationCleared');
    startHesitationTimers();
  }

  useEffect(() => {
    if (!boardContentReady) return;
    startHesitationTimers();
    return () => {
      if (hes1Ref.current !== null) clearTimeout(hes1Ref.current);
      if (hes2Ref.current !== null) clearTimeout(hes2Ref.current);
      if (hes3Ref.current !== null) clearTimeout(hes3Ref.current);
    };
  }, [boardContentReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polly reactive triggers (pure brain — no Animated involved) ────────
  useEffect(() => {
    if (game.lives === 1) firePollyEvent('oneHeartLeft');
  }, [game.lives]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.lives === 0 && !completedRef.current) {
      firePollyEvent('oneWrongMove');
      perform.onLivesDepleted();
    }
  }, [game.lives]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.status === 'gameOver') firePollyEvent('gameOver');
  }, [game.status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (game.streak > 0 && game.streak % 10 === 0) {
      firePollyEvent('streakX10');
    }
  }, [game.streak]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── gate sequence ────────────────────────────────────────────────────

  function dropGauntletTile(index: number) {
    setGauntletIndex(index);
    setTileLanded(false);
    perform.onGauntletTileDrop(index);
  }

  function triggerFinalTilesDrop() {
    if (gauntletPairs.length === 0) return;
    setGauntletActive(true);

    // One tile per pair, max 3. Which face shows is an independent coin flip
    // per tile, so three tiles is 12.5% guess-through, not 50%.
    const chosen = gauntletPairs.slice(0, 3);
    const tiles: GauntletTile[] = chosen.map((pair, i) => {
      const useReal = Math.random() < 0.5;
      return {
        pairIndex: i,
        isReal: useReal,
        mask: {
          id: `${step.word}_hidden_${i}_${useReal ? 'real' : 'trap'}`,
          phrase: useReal ? pair.real : pair.trap,
          isReal: useReal,
        },
      };
    });

    // Chain multiplier does not move across the gauntlet, so capture once.
    preMysteryChainMultiplierRef.current = game.chainMultiplier;
    beginMysteryGauntlet(tiles.length);

    setGatePhase('tiles');
    setGauntletTiles(tiles);
    setFinalTileStates(new Map(tiles.map(t => [t.mask.id, 'idle' as SwipeMaskState])));
    dropGauntletTile(0);
  }

  function buildHauntedDetail(failedMaskId?: string): string | undefined {
    const failedTile = gauntletTiles.find(t => t.mask.id === failedMaskId);
    if (failedTile) {
      return failedTile.isReal
        ? `Missed: ${failedTile.mask.phrase}`
        : `Trap claimed: ${failedTile.mask.phrase}`;
    }

    const missedReal = visibleGridMasks.find(m => m.isReal && tileStates.get(m.id) === 'wrong');
    if (missedReal) return `Missed: ${missedReal.phrase}`;

    const acceptedTrap = visibleGridMasks.find(m => !m.isReal && tileStates.get(m.id) === 'wrong');
    if (acceptedTrap) return `Trap claimed: ${acceptedTrap.phrase}`;

    if (ghost?.isGhostedMaster) return 'Still haunted.';
    return undefined;
  }

  function showWordOutcome(
    outcome: Exclude<WordOutcomeState, 'none'>,
    options: { detail?: string; bonusLabel?: string },
    onContinue: () => void
  ) {
    if (outcomeActiveRef.current) return;
    outcomeActiveRef.current = true;
    perform.onOutcomeReveal(outcome);
    setOutcomeDetail(options.detail);
    setOutcomeBonusLabel(options.bonusLabel);
    setWordOutcome(outcome);
    outcomeContinueRef.current = () => {
      outcomeContinueRef.current = null;
      outcomeActiveRef.current = false;
      setWordOutcome('none');
      setOutcomeDetail(undefined);
      setOutcomeBonusLabel(undefined);
      onContinue();
    };
  }

  function continueOutcome() {
    outcomeContinueRef.current?.();
  }

  function triggerWrongFail(failedMaskId: string) {
    if (splitCompletedRef.current) return;
    splitCompletedRef.current = true;
    completedRef.current = true;
    wrongSwipeOccurred.current = true;
    setGauntletActive(false);
    setGatePhase('wrongFail');
    setFailedHiddenTileId(failedMaskId);
    firePollyEvent('hiddenMasterFailed');

    perform.onHauntedSequence({ isHaunt, failedMaskId });

    // Runs on its own timer (rather than nested inside the presenter's
    // STILL HAUNTED visual sequence) so this file never has to reach back
    // into presentation code to fire a judging event.
    if (isHaunt) {
      setTimeout(() => {
        firePollyEvent('hauntFailed');
      }, 400);
    }

    setTimeout(() => {
      showWordOutcome(
        'haunted',
        { detail: buildHauntedDetail(failedMaskId) },
        () => {
          completeWord();
        }
      );
    }, isBoss ? 600 : 800);
  }

  function triggerMasteredBrain() {
    setGauntletActive(false);
    setGatePhase('mastered');
    completedRef.current = true;
    const masteryPoints = isHaunt ? 0 : mysteryMasteryPoints(preMysteryChainMultiplierRef.current);

    perform.onMasteredSequence({ isBoss, isHaunt, masteryPoints });

    // These two fire on their own timers, matched to the presentation phase
    // timings perform.onMasteredSequence uses, so the judging events and the
    // outcome reveal land at the same moments they did before the split.
    setTimeout(() => {
      firePollyEvent(isBoss ? 'gateMasteredBoss' : 'gateMastered');
    }, isBoss ? 400 : 2600);

    setTimeout(() => {
      showWordOutcome(
        'mastered',
        {
          bonusLabel: isHaunt
            ? 'HAUNT BROKEN'
            : isBoss
              ? `BOSS MASTERY +${masteryPoints}`
              : undefined,
        },
        () => {
          completeWord();
        }
      );
    }, isBoss ? 700 : 3450);
  }

  // ── swipe resolution ─────────────────────────────────────────────────

  function computeGapMs(
    combo: number,
    resolution: 'up' | 'right' | 'wrong',
    bossWord: boolean,
    tileIndex: number,
    phaseRole: WordStep['emotionalRole'],
  ): number {
    let gap = 350;
    // Combo modifier
    if      (combo <= 3)  gap += 100;
    else if (combo <= 6)  gap += 0;
    else if (combo <= 9)  gap -= 80;
    else                  gap -= 150;
    // Resolution type
    if      (resolution === 'right') gap -= 50;
    else if (resolution === 'wrong') gap += 150;
    // GPS phase modifier — confidence/flow stay generous, panic tightens,
    // independent of streak so early rounds never feel rushed and late
    // rounds never feel slack even after a chain break.
    switch (phaseRole) {
      case 'confidence':
      case 'flow':
        gap += 60;
        break;
      case 'panic':
      case 'adrenaline':
        gap -= 40;
        break;
      default:
        break;
    }
    // Boss modifier
    if (bossWord) gap -= 100;
    // Per-tile escalation: each tile within a word tightens the gap
    gap -= Math.min(tileIndex * 18, 90);
    return Math.min(Math.max(gap, 150), 500);
  }

  function onSwipeUp(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (mask.isReal) {
      const chainMult = chainMultiplierForStreak(game.streak + 1);
      const tier = chainTierFromMultiplier(chainMult);
      const upPoints = realMaskPoints({ isRare: mask.isRare, isBoss, chainMultiplier: chainMult });
      submitSwipeUp(maskId);

      const nextFound = realMasks.filter(m =>
        tileStates.get(m.id) === 'correct' || m.id === maskId
      ).length;

      perform.onRealClaimed({ mask, tier, points: upPoints, nextFound, totalReals: realMasks.length });

      setTileStates(prev => new Map(prev).set(maskId, 'correct'));
      firePollyEvent('correct');
      const gapUp = computeGapMs(game.combo, 'up', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapUp);
    } else {
      // Wrong swipe — UP on trap
      wrongSwipeOccurred.current = true;
      const brokeRealChain = game.chainMultiplier >= 1.5;
      firePollyEvent('wrong');
      perform.onWrongSwipe({ mask, brokeRealChain });
      submitSwipeUp(maskId);
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const gapWrong = computeGapMs(game.combo, 'wrong', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapWrong);
    }
  }

  function onSwipeRight(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    resetHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      const chainMultTrap = chainMultiplierForStreak(game.streak + 1);
      const trapTier = chainTierFromMultiplier(chainMultTrap);
      const trapPoints = trapMaskPoints({ isBoss, chainMultiplier: chainMultTrap });
      submitSwipeDown(maskId);
      perform.onTrapRejected({ mask, tier: trapTier, points: trapPoints });
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      const gapRight = computeGapMs(game.combo, 'right', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapRight);
    } else {
      // Wrong swipe — RIGHT on real meaning
      wrongSwipeOccurred.current = true;
      const brokeRealChain = game.chainMultiplier >= 1.5;
      firePollyEvent('wrong');
      perform.onWrongSwipe({ mask, brokeRealChain });
      submitSwipeDown(maskId);
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const gapWrongR = computeGapMs(game.combo, 'wrong', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      setTimeout(() => { gapLockedRef.current = false; }, gapWrongR);
    }
  }

  function onTileExitComplete(maskId: string) {
    setRemainingMaskIds(prev => prev.filter(id => id !== maskId));
  }

  function resolveGauntletTile(correct: boolean, swipedUp: boolean) {
    if (wordOutcome !== 'none') return;
    const tile = gauntletTiles[gauntletIndex];
    if (!tile) return;
    resetHesitation();

    const failedPair = correct
      ? undefined
      : { real: gauntletPairs[tile.pairIndex].real, trap: gauntletPairs[tile.pairIndex].trap };
    resolveMystery(correct, visiblePerfectRef.current, failedPair);

    if (!correct) {
      wrongSwipeOccurred.current = true;
      // Same feedback as a normal-tile wrong swipe (original code used one
      // shared function for both) — routed through onWrongSwipe rather than
      // a separate gauntlet-only callback so the "broke real chain" bonus
      // sfx/haptic isn't silently dropped for gauntlet misses.
      const brokeRealChain = game.chainMultiplier >= 1.5;
      firePollyEvent('wrong');
      perform.onWrongSwipe({ mask: tile.mask, brokeRealChain });
      setFinalTileStates(prev => new Map(prev).set(tile.mask.id, 'wrong'));
      triggerWrongFail(tile.mask.id);
      return;
    }

    perform.onGauntletCorrect({ swipedUp, phrase: tile.mask.phrase });
    incrementGauntletCorrectCount();
    setFinalTileStates(prev =>
      new Map(prev).set(tile.mask.id, swipedUp ? 'correct' : 'trap-caught'));

    const isLast = gauntletIndex + 1 >= gauntletTiles.length;
    if (isLast) {
      splitCompletedRef.current = true;
      setTimeout(() => triggerMasteredBrain(), 200);
    } else {
      setTileLanded(false);
      setTimeout(() => dropGauntletTile(gauntletIndex + 1), 320);
    }
  }

  function onGauntletSwipeUp() {
    const tile = gauntletTiles[gauntletIndex];
    if (!tile) return;
    resolveGauntletTile(tile.isReal, true);
  }

  function onGauntletSwipeRight() {
    const tile = gauntletTiles[gauntletIndex];
    if (!tile) return;
    resolveGauntletTile(!tile.isReal, false);
  }

  // ── completion check ─────────────────────────────────────────────────
  useEffect(() => {
    if (completedRef.current || gateTriggeredRef.current) return;
    if (remainingMaskIds.length > 0) return;

    // Deck empty — all tiles judged (correct, trap-caught, or wrong)
    const perfect = !wrongSwipeOccurred.current;

    if (isFinalGateStep) {
      if (hasHidden) {
        // Survival unlocks the mystery — a visible mistake no longer bars it.
        visiblePerfectRef.current = perfect;
        gateTriggeredRef.current = true;
        firePollyEvent('allMasksFound');
        perform.onGauntletBegin();
        setTimeout(() => {
          triggerFinalTilesDrop();
        }, 600);
      } else {
        // No hidden content on this final-gate word — falls through as a normal fail.
        gateTriggeredRef.current = true;
        resolveMystery(false, perfect);
        const failedMaskId = visibleGridMasks.find(
          mask => tileStates.get(mask.id) === 'wrong',
        )?.id ?? `${step.word}_gate_fail`;
        triggerWrongFail(failedMaskId);
      }
    } else {
      // Ordinary words always complete without touching the ghost queue.
      gateTriggeredRef.current = true;
      if (perfect) firePollyEvent('cleanSweep');
      perform.onWordExit(perfect);
      // Matches triggerWordExit's original 290ms book-slide-out timing.
      setTimeout(() => {
        completeWord();
      }, 290);
    }
  }, [remainingMaskIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    tileStates,
    remainingMaskIds,
    visibleGridMasks,
    topMask,
    topMaskState,
    deckSize,
    nearMastery,
    realMasks,
    foundCount,
    gatePhase,
    gauntletTiles,
    gauntletIndex,
    activeGauntletTile,
    finalTileStates,
    tileLanded,
    failedHiddenTileId,
    hasHidden,
    gauntletPairs,
    wordOutcome,
    outcomeDetail,
    outcomeBonusLabel,
    inputLocked,
    isBoss,
    isHaunt,
    isFinalGateStep,
    kicker,
    ghost,
    onSwipeUp,
    onSwipeRight,
    onTileExitComplete,
    onGauntletSwipeUp,
    onGauntletSwipeRight,
    continueOutcome,
    // Not in the original spec list — the two small entry points the
    // presenter needs to report animation-driven timing back into brain
    // state without the hook touching Animated itself.
    onGauntletTileLanded: () => setTileLanded(true),
    onBoardContentReady: () => setBoardContentReady(true),
  };
}
