import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type RoleSelectScreenProps = {
  onChooseRole?: (role: 'player' | 'creator') => Promise<void>;
};

export function RoleSelectScreen({ onChooseRole }: RoleSelectScreenProps) {
  const { error, isLoading, user } = useAuth();

  return (
    <View style={styles.page}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Choose your mode</Text>
        <Text style={styles.copy}>Creators can also access player features from the same account.</Text>

        <View style={styles.cards}>
          <DashboardCard title="Player Mode" accent="cyan">
            <Text style={styles.cardCopy}>Play published learning games, earn XP, track progress, and collect certificates.</Text>
            <SecondaryButton disabled={isLoading} label="Continue as Player" onPress={() => onChooseRole?.('player')} />
          </DashboardCard>

          <DashboardCard title="Creator Mode" accent="purple">
            <Text style={styles.cardCopy}>Create learning games from documents and manage your game drafts.</Text>
            <PrimaryButton
              disabled={isLoading}
              label={user?.role_creator ? 'Continue as Creator' : 'Enable Creator Access'}
              onPress={() => onChooseRole?.('creator')}
            />
          </DashboardCard>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
  wrap: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: 920,
    padding: spacing.xl,
    width: '100%',
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
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  cardCopy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
});
