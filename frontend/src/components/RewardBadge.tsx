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
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  purple: {
    backgroundColor: '#F2ECFF',
    borderColor: '#D9C8FF',
  },
  orange: {
    backgroundColor: '#FFF4E8',
    borderColor: '#FED7AA',
  },
  cyan: {
    backgroundColor: '#EAFBF2',
    borderColor: '#BBE8CE',
  },
  text: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '800',
  },
});
