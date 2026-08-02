import { useEffect, useRef, useState } from 'react';

import { GhostMeaning, Mask, WordStep } from '../game/types';
import { useGameStore } from '../store/useGameStore';
import {
  chainMultiplierForStreak,
  getUnresolvedMaskIds,
  realMaskPoints,
  trapMaskPoints,
  mysteryMasteryPoints,
  isGauntletTilePickable,
  isLastRemainingGauntletTile,
} from '../game/polyRunEngine';
import type { SwipeMaskState } from '../components/SwipeMask';
import type { PollyEvent } from '../game/pollyVisitPolicy';
import { createSeededTruthPlan } from '../game/seededRandom';
import { recordPlaytestEvent } from '../game/playtestTelemetry';

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
  if (step.eventType === 'bossWord' && step.isMasteryRematch) return "MASTER'S REMATCH · 2×";
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
  const resumedBossOutcome = isBoss && game.bossOutcome !== 'pending'
    ? game.bossOutcome
    : null;
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

  const completedRef                 = useRef(resumedBossOutcome !== null);
  const gateTriggeredRef             = useRef(resumedBossOutcome !== null);
  const wrongSwipeOccurred           = useRef(game.mistakesOnWord > 0);
  const visiblePerfectRef            = useRef(game.mistakesOnWord === 0);
  const preMysteryChainMultiplierRef = useRef(1);
  const gapLockedRef                 = useRef(false);
  const tileIndexInWordRef           = useRef(initialResolvedMaskCount);
  const resolutionClockRef           = useRef<{ startedAt: number; targetMs: number } | null>(null);
  const readyTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  // -1 = no tile currently active; the player must pick one. Never defaults
  // to 0 — even the first tile of a gauntlet is a player choice now.
  const [gauntletIndex, setGauntletIndex] = useState(-1);
  const [tileLanded, setTileLanded] = useState(false);
  const [failedHiddenTileId, setFailedHiddenTileId] = useState<string | null>(null);
  const activeGauntletTile = gauntletTiles[gauntletIndex] ?? null;

  const splitCompletedRef = useRef(false);

  const [wordOutcome, setWordOutcome] = useState<WordOutcomeState>('none');
  const [outcomeDetail, setOutcomeDetail] = useState<string | undefined>(undefined);
  const [outcomeBonusLabel, setOutcomeBonusLabel] = useState<string | undefined>(undefined);
  const outcomeContinueRef = useRef<(() => void) | null>(null);
  const outcomeActiveRef   = useRef(false);
  const [decisionLocked, setDecisionLocked] = useState(true);

  const inputLocked = wordOutcome !== 'none' || decisionLocked;

  // ── hesitation timers ─────────────────────────────────────────
  const hes1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hes3Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  function clearHesitationTimers() {
    if (hes1Ref.current !== null) { clearTimeout(hes1Ref.current); hes1Ref.current = null; }
    if (hes2Ref.current !== null) { clearTimeout(hes2Ref.current); hes2Ref.current = null; }
    if (hes3Ref.current !== null) { clearTimeout(hes3Ref.current); hes3Ref.current = null; }
  }

  function startHesitationTimers() {
    clearHesitationTimers();
    if (completedRef.current || outcomeActiveRef.current) return;
    hes1Ref.current = setTimeout(() => {
      recordPlaytestEvent('hunt_hesitation', { round: game.stepIndex + 1, seconds: 3, boss: isBoss, haunt: isHaunt });
      firePollyEvent('hesitation3s');
    }, 3000);
    hes2Ref.current = setTimeout(() => {
      recordPlaytestEvent('hunt_hesitation', { round: game.stepIndex + 1, seconds: 6, boss: isBoss, haunt: isHaunt });
      firePollyEvent('hesitation6s');
    }, 6000);
    hes3Ref.current = setTimeout(() => {
      recordPlaytestEvent('hunt_hesitation', { round: game.stepIndex + 1, seconds: 9, boss: isBoss, haunt: isHaunt });
      firePollyEvent('hesitation9s');
    }, 9000);
  }

  function pauseHesitation() {
    firePollyEvent('hesitationCleared');
    clearHesitationTimers();
  }

  function onDecisionReady() {
    // Resuming directly into an already-decided boss outcome (app was
    // killed/backgrounded between the live gauntlet judgment and the
    // outcome card showing) — replay the same presentation callbacks a live
    // win/loss uses instead of jumping straight to the overlay, so the
    // player still gets the boss-specific theater (gold seed/bloom, book
    // snap) rather than a bare card. gatePhase is set directly to the
    // terminal phase with no gauntlet tiles built, since there's nothing
    // left to judge — showGauntletCard's gauntletTiles.length guard keeps
    // that from flashing an empty "0/0" gauntlet in the meantime.
    if (resumedBossOutcome && !outcomeActiveRef.current) {
      setGauntletActive(false);
      if (resumedBossOutcome === 'mastered') {
        setGatePhase('mastered');
        const masteryPoints = mysteryMasteryPoints(preMysteryChainMultiplierRef.current);
        perform.onMasteredSequence({ isBoss: true, isHaunt: false, masteryPoints });
        setTimeout(() => {
          showWordOutcome(
            'mastered',
            { bonusLabel: `BOSS MASTERY +${masteryPoints}` },
            () => completeWord(),
          );
        }, 700);
      } else {
        setGatePhase('wrongFail');
        perform.onHauntedSequence({ isHaunt: false, failedMaskId: '' });
        setTimeout(() => {
          showWordOutcome('haunted', {}, () => completeWord());
        }, 600);
      }
      return;
    }
    if (completedRef.current || outcomeActiveRef.current) return;
    gapLockedRef.current = false;
    setDecisionLocked(false);
    startHesitationTimers();
  }

  useEffect(() => {
    return () => {
      clearHesitationTimers();
      if (readyTimerRef.current !== null) clearTimeout(readyTimerRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Player-driven pick — the only way a tile becomes active now. Guards
  // against picking mid-judgment (one already active) or picking a tile
  // that's already resolved.
  function pickGauntletTile(index: number) {
    if (decisionLocked || activeGauntletTile !== null) return;
    const tileIds = gauntletTiles.map(t => t.mask.id);
    if (!isGauntletTilePickable(tileIds, finalTileStates, index)) return;
    setDecisionLocked(true);
    dropGauntletTile(index);
  }

  function triggerFinalTilesDrop() {
    if (gauntletPairs.length === 0) return;
    // After the guard, not before: a final-gate word with zero gauntlet
    // pairs never reaches triggerWrongFail/triggerMasteredBrain (the only
    // places that clear this flag), so setting it earlier would leave
    // gauntletActive stuck true for the rest of the run.
    // One tile per pair, max 3. Which face shows is an independent coin flip
    // per tile, so three tiles is 12.5% guess-through, not 50%.
    const chosen = gauntletPairs.slice(0, 3);
    const truths = game.mysteryTileTruths?.length === chosen.length
      ? game.mysteryTileTruths
      : createSeededTruthPlan(
          game.runSeed,
          `gauntlet:${game.stepIndex}:${step.word}`,
          chosen.length,
        );
    const tiles: GauntletTile[] = chosen.map((pair, i) => {
      const useReal = truths[i];
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
    beginMysteryGauntlet(truths);
    setGauntletActive(true);

    setGatePhase('tiles');
    setGauntletTiles(tiles);
    const resolvedPairIndices = new Set(game.mysteryResolvedPairIndices ?? []);
    setFinalTileStates(new Map(tiles.map(t => [
      t.mask.id,
      resolvedPairIndices.has(t.pairIndex)
        ? (t.isReal ? 'correct' : 'trap-caught')
        : 'idle',
    ])));
    onDecisionReady();
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
    clearHesitationTimers();
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
    clearHesitationTimers();
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
    }, isBoss ? 400 : isHaunt ? 180 : 2600);

    // Haunt's reveal must land sooner than Boss's — it's the smaller,
    // quicker beat ("one decisive banishment beat... before it can
    // overshadow Polly's Word", per the commit that introduced the short
    // sequence). 950ms here previously made it resolve slower than Boss's
    // 700ms, backwards from that intent.
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
    }, isBoss ? 700 : isHaunt ? 550 : 3450);
  }

  // ── swipe resolution ─────────────────────────────────────────────────

  function computeCadenceMs(
    combo: number,
    resolution: 'up' | 'right' | 'wrong',
    bossWord: boolean,
    tileIndex: number,
    phaseRole: WordStep['emotionalRole'],
  ): number {
    // Minimum commitment-to-next-card cadence. SwipeMask may take longer for
    // a particular result; in that case its real exit duration wins and no
    // artificial delay is added after it.
    let cadence = resolution === 'up' ? 650 : resolution === 'right' ? 420 : 760;
    if (combo >= 7) cadence -= 30;
    if (combo >= 10) cadence -= 30;
    switch (phaseRole) {
      case 'confidence':
      case 'flow':
        cadence += 60;
        break;
      case 'panic':
      case 'adrenaline':
        cadence -= 40;
        break;
      default:
        break;
    }
    if (bossWord) cadence -= 40;
    cadence -= Math.min(tileIndex * 8, 40);
    return Math.min(Math.max(cadence, 350), 850);
  }

  function onSwipeUp(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    setDecisionLocked(true);
    pauseHesitation();
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
      const cadenceUp = computeCadenceMs(game.combo, 'up', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      resolutionClockRef.current = { startedAt: Date.now(), targetMs: cadenceUp };
    } else {
      // Wrong swipe — UP on trap
      wrongSwipeOccurred.current = true;
      const brokeRealChain = game.chainMultiplier >= 1.5;
      firePollyEvent('wrong');
      perform.onWrongSwipe({ mask, brokeRealChain });
      submitSwipeUp(maskId);
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const cadenceWrong = computeCadenceMs(game.combo, 'wrong', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      resolutionClockRef.current = { startedAt: Date.now(), targetMs: cadenceWrong };
    }
  }

  function onSwipeRight(maskId: string) {
    if (wordOutcome !== 'none') return;
    if (gapLockedRef.current) return;
    setDecisionLocked(true);
    pauseHesitation();
    const mask = step.masks.find(m => m.id === maskId)!;
    if (!mask.isReal) {
      const chainMultTrap = chainMultiplierForStreak(game.streak + 1);
      const trapTier = chainTierFromMultiplier(chainMultTrap);
      const trapPoints = trapMaskPoints({ isBoss, chainMultiplier: chainMultTrap });
      submitSwipeDown(maskId);
      perform.onTrapRejected({ mask, tier: trapTier, points: trapPoints });
      setTileStates(prev => new Map(prev).set(maskId, 'trap-caught'));
      const cadenceRight = computeCadenceMs(game.combo, 'right', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      resolutionClockRef.current = { startedAt: Date.now(), targetMs: cadenceRight };
    } else {
      // Wrong swipe — RIGHT on real meaning
      wrongSwipeOccurred.current = true;
      const brokeRealChain = game.chainMultiplier >= 1.5;
      firePollyEvent('wrong');
      perform.onWrongSwipe({ mask, brokeRealChain });
      submitSwipeDown(maskId);
      // Tile exits permanently — no retry
      setTileStates(prev => new Map(prev).set(maskId, 'wrong'));
      const cadenceWrongR = computeCadenceMs(game.combo, 'wrong', isBoss, tileIndexInWordRef.current, step.emotionalRole);
      tileIndexInWordRef.current += 1;
      gapLockedRef.current = true;
      resolutionClockRef.current = { startedAt: Date.now(), targetMs: cadenceWrongR };
    }
  }

  function onTileExitComplete(maskId: string) {
    const clock = resolutionClockRef.current;
    const remainingMs = clock
      ? Math.max(0, clock.targetMs - (Date.now() - clock.startedAt))
      : 0;
    const revealNext = () => {
      readyTimerRef.current = null;
      resolutionClockRef.current = null;
      setRemainingMaskIds(prev => prev.filter(id => id !== maskId));
    };
    if (remainingMs === 0) {
      revealNext();
    } else {
      readyTimerRef.current = setTimeout(revealNext, remainingMs);
    }
  }

  function resolveGauntletTile(correct: boolean, swipedUp: boolean) {
    if (wordOutcome !== 'none') return;
    const tile = gauntletTiles[gauntletIndex];
    if (!tile) return;
    setDecisionLocked(true);
    pauseHesitation();

    const failedPair = correct
      ? undefined
      : { real: gauntletPairs[tile.pairIndex].real, trap: gauntletPairs[tile.pairIndex].trap };
    resolveMystery(correct, visiblePerfectRef.current, failedPair, tile.pairIndex);

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

    const isLast = isLastRemainingGauntletTile(
      gauntletTiles.map(t => t.mask.id),
      finalTileStates,
      tile.mask.id,
    );
    if (isLast) {
      splitCompletedRef.current = true;
      setTimeout(() => triggerMasteredBrain(), 200);
    } else {
      setTileLanded(false);
      // Return to "no active tile" — the remaining spine(s) wait for the
      // player's next pick instead of auto-advancing in sequence.
      setTimeout(() => {
        setGauntletIndex(-1);
        setDecisionLocked(false);
      }, 320);
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
    pickGauntletTile,
    continueOutcome,
    // Not in the original spec list — the two small entry points the
    // presenter needs to report animation-driven timing back into brain
    // state without the hook touching Animated itself.
    onGauntletTileLanded: () => {
      setTileLanded(true);
      onDecisionReady();
    },
    onDecisionReady,
  };
}
