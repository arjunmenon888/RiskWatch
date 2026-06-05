import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type StepperProps = {
  steps: string[];
  activeIndex: number;
};

export function Stepper({ steps, activeIndex }: StepperProps) {
  return (
    <View style={styles.wrap}>
      {steps.map((step, index) => {
        const active = index <= activeIndex;
        return (
          <View key={step} style={styles.step}>
            <View style={[styles.dot, active && styles.dotActive]}>
              <Text style={styles.dotText}>{index + 1}</Text>
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  step: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dot: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  dotActive: {
    backgroundColor: colors.primary,
  },
  dotText: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.textPrimary,
  },
});

