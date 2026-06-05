import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme/tokens';

type ProgressBarProps = {
  value: number;
  tone?: 'purple' | 'orange' | 'cyan' | 'success';
};

export function ProgressBar({ value, tone = 'purple' }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.track}>
      <View style={[styles.fill, styles[tone], { width: `${safeValue}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    borderRadius: radius.sm,
    height: '100%',
  },
  purple: {
    backgroundColor: colors.primaryLight,
  },
  orange: {
    backgroundColor: colors.secondary,
  },
  cyan: {
    backgroundColor: colors.cyan,
  },
  success: {
    backgroundColor: colors.success,
  },
});

