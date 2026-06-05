import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type XPBadgeProps = {
  value: string;
};

export function XPBadge({ value }: XPBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>XP</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.16)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    color: colors.secondary,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
});

