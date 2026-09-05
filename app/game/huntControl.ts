export type HuntControlTier = 'steady' | 'flow' | 'control' | 'rattled';

/** The streak read alone, never overridden by lives. See resolveLiveHuntControl. */
export type HuntReadTier = 'steady' | 'flow' | 'control';

export type HuntControlState = {
  tier: HuntControlTier;
  label: string;
  description: string;
  readTier: HuntReadTier;
};

export type HuntHudState = HuntControlState & {
  contextLabel: string | null;
};

function resolveReadTier(chainMultiplier: number): HuntReadTier {
  if (chainMultiplier >= 2.0) return 'control';
  if (chainMultiplier >= 1.5) return 'flow';
  return 'steady';
}

/**
 * The player's live condition. This is system status, not Polly dialogue.
 * HUNTED means the player is down to one feather and the run is in danger.
 *
 * `readTier` is derived from `chainMultiplier` alone and is always populated,
 * even at HUNTED — `tier`/`label` describe the danger, `readTier` keeps
 * reporting the streak, so the two facts never compete for one field.
 */
export function resolveLiveHuntControl(
  chainMultiplier: number,
  lives: number,
): HuntControlState {
  const readTier = resolveReadTier(chainMultiplier);

  if (lives <= 1) {
    return {
      tier: 'rattled',
      label: 'HUNTED',
      description: 'The run is on the edge.',
      readTier,
    };
  }
  if (readTier === 'control') {
    return {
      tier: 'control',
      label: 'GETTING PAST',
      description: 'You are getting past her clean.',
      readTier,
    };
  }
  if (readTier === 'flow') {
    return {
      tier: 'flow',
      label: 'READING',
      description: 'You are reading the pattern.',
      readTier,
    };
  }
  return {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
    readTier,
  };
}

/**
 * The Hunt HUD always reserves two rows. The context row identifies the kind
 * of word or challenge; the main row identifies the player's current state.
 */
export function resolveHuntHud(input: {
  chainMultiplier: number;
  lives: number;
  isHauntReturn?: boolean;
  isMasteredReturn?: boolean;
  isBossWord?: boolean;
  isGauntletActive?: boolean;
}): HuntHudState {
  const live = resolveLiveHuntControl(input.chainMultiplier, input.lives);

  if (input.isGauntletActive) {
    return {
      ...live,
      contextLabel: input.isHauntReturn ? 'RETURNING HAUNT' : "POLLY'S WORD",
      label: 'GAUNTLET',
      description: input.isHauntReturn
        ? 'Face the word that got you.'
        : "Face Polly's final test.",
    };
  }

  return {
    ...live,
    contextLabel: input.isHauntReturn
      ? 'RETURNING HAUNT'
      : input.isMasteredReturn
      ? 'MASTERED RETURN'
      : input.isBossWord
      ? "POLLY'S WORD"
      : null,
  };
}

export type HuntResultLabel =
  | 'MASTERED'
  | "CLOSE, BUT CLOSE DOESN'T COUNT."
  | 'HAUNTED'
  | 'YOU WERE HUNTED';

/**
 * The final result uses the game's actual relationship outcome. It is not a
 * grade and it never competes with the boss or Haunt verdict.
 */
export function resolveHuntResultLabel(input: {
  status: 'gameOver' | 'complete';
  bossMastered: boolean;
  haunted: boolean;
}): HuntResultLabel {
  if (input.bossMastered) return 'MASTERED';
  if (input.haunted) return 'HAUNTED';
  if (input.status === 'gameOver') return 'YOU WERE HUNTED';
  return "CLOSE, BUT CLOSE DOESN'T COUNT.";
}
