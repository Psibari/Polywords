import type { PressableProps } from 'react-native';

type BossGauntletPressProps = Pick<PressableProps, 'disabled' | 'onPress'>;

export function createBossGauntletPressProps(
  index: number,
  disabled: boolean,
  onPick: (index: number) => void,
): BossGauntletPressProps {
  if (disabled) return { disabled: true, onPress: undefined };
  return {
    disabled: false,
    onPress: () => onPick(index),
  };
}
