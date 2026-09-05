export type HuntControlTier = 'steady' | 'flow' | 'control' | 'rattled';

export type HuntControlState = {
  tier: HuntControlTier;
  label: string;
  description: string;
};

export type HuntHudState = HuntControlState & {
  contextLabel: string | null;
};

/**
 * The player's live condition. This is system status, not Polly dialogue.
 * HUNTED means the player is down to one feather and the run is in danger.
 */
export function resolveLiveHuntControl(
  chainMultiplier: number,
  lives: number,
): HuntControlState {
  if (lives <= 1) {
    return {
      tier: 'rattled',
      label: 'HUNTED',
      description: 'The run is on the edge.',
    };
  }
  if (chainMultiplier >= 2.0) {
    return {
      tier: 'control',
      label: 'IN CONTROL',
      description: 'You are reading her pattern.',
    };
  }
  if (chainMultiplier >= 1.5) {
    return {
      tier: 'flow',
      label: 'FLOW',
      description: 'The read is holding.',
    };
  }
  return {
    tier: 'steady',
    label: 'STEADY',
    description: 'One read at a time.',
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
