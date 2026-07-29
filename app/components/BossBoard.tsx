import React from 'react';

import { BoardPresenter, type Props as BoardProps } from './MaskBoard';

// Boss-stage counterpart to MaskBoard. Both components render through the
// exact same BoardPresenter face code (from useBoardMechanics) — the
// isBossStage flag is what turns on boss-only theater (currently: the
// gauntlet chest) inside that shared presenter.
export function BossBoard(props: BoardProps) {
  return <BoardPresenter {...props} isBossStage={true} />;
}
