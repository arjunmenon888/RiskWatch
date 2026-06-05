import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { SignupScreen } from './SignupScreen';

export function LoginScreen() {
  const { clearError, error, isLoading, login } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState('creator@example.com');
  const [password, setPassword] = useState('password123');

  if (showSignup) {
    return <SignupScreen onShowLogin={() => setShowSignup(false)} />;
  }

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.brand}>LearnPlay</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.copy}>Log in to continue as a creator or player.</Text>

        <View style={styles.form}>
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton disabled={isLoading} label={isLoading ? 'Logging in...' : 'Login'} onPress={() => login(email, password)} />
          <SecondaryButton
            disabled={isLoading}
            label="Create Account"
            onPress={() => {
              clearError();
              setShowSignup(true);
            }}
          />
        </View>

        <Pressable onPress={() => setShowSignup(true)}>
          <Text style={styles.helper}>New creators and players can sign up here.</Text>
        </Pressable>
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
    maxWidth: 460,
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
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
  },
  helper: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
});
