import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme/tokens';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons name="auto-fix" color={colors.cyan} size={34} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    textAlign: 'center',
  },
});

