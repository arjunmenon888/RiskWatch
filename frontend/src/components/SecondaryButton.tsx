import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';

type SecondaryButtonProps = {
  label: string;
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export function SecondaryButton({ label, icon, onPress, disabled = false }: SecondaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    backgroundColor: '#FB923C',
  },
  disabled: {
    opacity: 0.55,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '700',
  },
});
