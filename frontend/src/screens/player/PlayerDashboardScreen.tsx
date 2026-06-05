import { StyleSheet, Text, View } from 'react-native';
import { DashboardCard } from '../../components/DashboardCard';
import { GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardBadge } from '../../components/RewardBadge';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function PlayerDashboardScreen() {
  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Protected Player Mode</Text>
        <Text style={styles.title}>Turn Any Document into an Interactive Learning Game</Text>
        <Text style={styles.copy}>Player access is active. Published gameplay opens in Phase 10.</Text>
        <PrimaryButton label="Explore Games" />
      </View>

      <View style={styles.row}>
        <GameCard title="CSP Fundamentals" creator="SafetyPro" tag="CSP" progress={72} />
        <GameCard title="Electrical Safety Mastery" creator="ElectricLearn" tag="Safety" progress={48} />
        <GameCard title="OSHA 30 Challenge" creator="HardHat Hero" tag="OSHA" progress={64} />
      </View>

      <View style={styles.row}>
        <DashboardCard title="Level Progress" accent="orange">
          <Text style={styles.level}>Level 23</Text>
          <ProgressBar value={65} />
          <Text style={styles.meta}>7,850 / 12,000 XP</Text>
        </DashboardCard>
        <DashboardCard title="Recent Rewards" accent="cyan">
          <View style={styles.rewards}>
            <RewardBadge label="Quiz Master" tone="orange" />
            <RewardBadge label="Level Crusher" tone="purple" />
            <RewardBadge label="12 Day Streak" tone="cyan" />
          </View>
        </DashboardCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    minHeight: 220,
    padding: spacing.xl,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
    maxWidth: 720,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    maxWidth: 560,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  level: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    marginTop: spacing.sm,
  },
  rewards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
