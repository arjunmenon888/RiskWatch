import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import * as authApi from '../../api/auth';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type ViewName = 'login' | 'forgot' | 'reset';

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const resetToken = getResetToken();
  const { authenticateWithGoogle, clearError, error, isLoading } = useAuth();
  const [view, setView] = useState<ViewName>(resetToken ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

  async function submitForgotPassword() {
    setSubmitting(true);
    setFormError(null);
    setMessage(null);
    try {
      setMessage(await authApi.forgotPassword(email.trim()));
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitResetPassword() {
    if (!resetToken) return;
    setSubmitting(true);
    setFormError(null);
    setMessage(null);
    try {
      setMessage(await authApi.resetPassword(resetToken, newPassword));
      removeResetTokenFromUrl();
      setNewPassword('');
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.page, isMobile && styles.pageMobile]}>
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        <View style={styles.logo}>
          <Text style={styles.logoMark}>R</Text>
        </View>
        <Text style={styles.brand}>RiskWatch</Text>

        {view === 'login' ? (
          <>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.copy}>Continue with your Google account.</Text>
            <View style={styles.googleButton}>
              {googleClientId ? (
                <GoogleLogin
                  onError={() => setFormError('Google sign-in could not be started.')}
                  onSuccess={(response) => {
                    if (response.credential) {
                      void authenticateWithGoogle(response.credential);
                    } else {
                      setFormError('Google did not return a valid credential.');
                    }
                  }}
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  theme="outline"
                  width={String(Math.max(240, Math.min(360, width - (isMobile ? 66 : 128))))}
                />
              ) : (
                <Text style={styles.error}>Google sign-in needs an OAuth client ID.</Text>
              )}
            </View>
            {isLoading ? <Text style={styles.helper}>Signing in...</Text> : null}
            {error || formError ? <Text style={styles.error}>{error ?? formError}</Text> : null}
            <Pressable
              onPress={() => {
                clearError();
                setFormError(null);
                setMessage(null);
                setView('forgot');
              }}
            >
              <Text style={styles.link}>Forgot Password</Text>
            </Pressable>
          </>
        ) : null}

        {view === 'forgot' ? (
          <>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.copy}>Enter your account email to request a reset link.</Text>
            <TextInput
              autoCapitalize="none"
              inputMode="email"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={email}
            />
            <PrimaryButton
              disabled={isSubmitting || !email.trim()}
              label={isSubmitting ? 'Sending...' : 'Send Reset Link'}
              onPress={submitForgotPassword}
            />
            <SecondaryButton label="Back" onPress={() => setView('login')} />
            {message ? <Text style={styles.success}>{message}</Text> : null}
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
          </>
        ) : null}

        {view === 'reset' ? (
          <>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.copy}>Choose a password for future password-login support.</Text>
            <TextInput
              onChangeText={setNewPassword}
              placeholder="New password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.input}
              value={newPassword}
            />
            <PrimaryButton
              disabled={isSubmitting || newPassword.length < 8}
              label={isSubmitting ? 'Resetting...' : 'Reset Password'}
              onPress={submitResetPassword}
            />
            <SecondaryButton label="Back to Google Login" onPress={() => setView('login')} />
            {message ? <Text style={styles.success}>{message}</Text> : null}
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
          </>
        ) : null}
      </View>
    </View>
  );
}

function getResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('reset_token');
}

function removeResetTokenFromUrl() {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, '', window.location.pathname);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
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
  pageMobile: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
    paddingTop: spacing.xxl,
  },
  card: {
    alignItems: 'stretch',
    backgroundColor: colors.white,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 440,
    padding: spacing.xl,
    width: '100%',
  },
  cardMobile: {
    maxWidth: 'calc(100% - 32px)' as never,
    padding: spacing.lg,
    width: 'calc(100% - 32px)' as never,
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  logoMark: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  brand: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  googleButton: {
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 44,
  },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  link: {
    color: colors.primary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    textAlign: 'center',
  },
  helper: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
    textAlign: 'center',
  },
  success: {
    color: colors.success,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
    textAlign: 'center',
  },
});
