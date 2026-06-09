import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type StatusPanelProps = {
  title: string;
  description?: string;
  tone?: 'purple' | 'success' | 'info';
};

export function StatusPanel({ title, description, tone = 'purple' }: StatusPanelProps) {
  return (
    <View accessibilityRole="text" style={[styles.panel, styles[tone]]}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons
          color={tone === 'success' ? colors.success : tone === 'info' ? colors.cyan : colors.primary}
          name="check-circle"
          size={20}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  purple: {
    borderColor: '#B99AFF',
  },
  success: {
    borderColor: '#86D6A8',
  },
  info: {
    borderColor: '#7DD3FC',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.primary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
    textAlign: 'center',
  },
});
