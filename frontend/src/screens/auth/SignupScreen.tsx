import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type SignupScreenProps = {
  onShowLogin?: () => void;
};

export function SignupScreen({ onShowLogin }: SignupScreenProps) {
  const { error, isLoading, signup } = useAuth();
  const [fullName, setFullName] = useState('Arjun Verma');
  const [email, setEmail] = useState('creator@example.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'player' | 'creator'>('creator');

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.brand}>LearnPlay</Text>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.copy}>One account can play games, build games, or do both.</Text>

        <View style={styles.form}>
          <TextInput
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={fullName}
          />
          <TextInput
            autoCapitalize="none"
            inputMode="email"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={email}
          />
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />

          <View style={styles.roleRow}>
            <Pressable onPress={() => setRole('player')} style={[styles.rolePill, role === 'player' && styles.roleActive]}>
              <Text style={styles.roleText}>Player</Text>
            </Pressable>
            <Pressable onPress={() => setRole('creator')} style={[styles.rolePill, role === 'creator' && styles.roleActive]}>
              <Text style={styles.roleText}>Creator</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            disabled={isLoading}
            label={isLoading ? 'Creating account...' : 'Sign Up'}
            onPress={() => signup({ fullName, email, password, role })}
          />
          <SecondaryButton disabled={isLoading} label="Back to Login" onPress={onShowLogin} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    minHeight: '100vh' as never,
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 500,
    padding: spacing.xl,
    width: '100%',
  },
  brand: {
    color: colors.primaryLight,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rolePill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  roleActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: colors.primaryLight,
  },
  roleText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
  },
});
