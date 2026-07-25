import React from 'react';

import { BoardPresenter, type Props as BoardProps } from './MaskBoard';

// Boss-stage counterpart to MaskBoard. Step 2 of the BossBoard rebuild: both
// components render through the exact same BoardPresenter face code (from
// useBoardMechanics), so this step changes nothing visible — it only gives
// the boss step its own presenter to build theater into later.
export function BossBoard(props: BoardProps) {
  return <BoardPresenter {...props} isBossStage={true} />;
}
