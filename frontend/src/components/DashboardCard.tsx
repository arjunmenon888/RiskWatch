import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type DashboardCardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  accent?: 'purple' | 'orange' | 'cyan';
};

export function DashboardCard({ title, eyebrow, children, accent = 'purple' }: DashboardCardProps) {
  return (
    <View style={[styles.card, styles[accent]]}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  purple: {
    shadowColor: colors.primary,
  },
  orange: {
    shadowColor: colors.secondary,
  },
  cyan: {
    shadowColor: colors.cyan,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
});

