import React from 'react';

import { BoardPresenter, type Props as BoardProps } from './MaskBoard';

// Boss-stage counterpart to MaskBoard. Both components render through the
// exact same BoardPresenter face code (from useBoardMechanics) — the
// isBossStage flag is what turns on boss-only theater inside that shared
// presenter: the distinct mastered/haunted book-close motion beats and the
// (future) seal art / gauntlet count-up. There is no chest anymore.
export function BossBoard(props: BoardProps) {
  return <BoardPresenter {...props} isBossStage={true} />;
}
