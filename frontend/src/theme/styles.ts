import { StyleSheet } from 'react-native';
import { colors, radius, shadows, spacing, typography } from './tokens';

export const sharedStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    color: colors.textPrimary,
    fontFamily: typography.family,
  },
  mutedText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
  },
  panel: {
    backgroundColor: colors.glass,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.panel,
  },
});
