import { ReactNode } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../theme/tokens';

type DashboardCardProps = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  accent?: 'purple' | 'orange' | 'cyan';
};

export function DashboardCard({ title, eyebrow, children, accent = 'purple' }: DashboardCardProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={[styles.card, styles[accent], isMobile && styles.cardMobile]}>
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
    maxWidth: '100%',
    padding: spacing.lg,
    ...shadows.panel,
  },
  cardMobile: {
    padding: spacing.md,
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
    color: colors.primary,
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
    fontWeight: '900',
    marginBottom: spacing.md,
  },
});
