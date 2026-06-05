import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type RewardBadgeProps = {
  label: string;
  tone?: 'purple' | 'orange' | 'cyan';
};

export function RewardBadge({ label, tone = 'purple' }: RewardBadgeProps) {
  return (
    <View style={[styles.badge, styles[tone]]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  purple: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  orange: {
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
  },
  cyan: {
    backgroundColor: 'rgba(34, 211, 238, 0.16)',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
});

