import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../components/AppShell';
import { DashboardCard } from '../../components/DashboardCard';
import { EmptyState } from '../../components/EmptyState';
import { GameCard } from '../../components/GameCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { Stepper } from '../../components/Stepper';
import { UploadCard } from '../../components/UploadCard';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function DashboardPreview() {
  return (
    <AppShell>
      <View style={styles.grid}>
        <View style={styles.mainColumn}>
          <View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Turn Any Document into an Interactive Learning Game</Text>
              <Text style={styles.heroText}>Upload source material, choose topics, and shape each playable level with AI support.</Text>
              <View style={styles.heroActions}>
                <PrimaryButton
                  label="Create with AI"
                  icon={<MaterialCommunityIcons name="auto-fix" color={colors.white} size={18} />}
                />
                <SecondaryButton
                  label="Manual Mode"
                  icon={<MaterialCommunityIcons name="pencil-outline" color={colors.white} size={18} />}
                />
              </View>
            </View>
            <View style={styles.orbitPanel}>
              <Text style={styles.aiMark}>AI</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Games</Text>
            <Text style={styles.linkText}>View all</Text>
          </View>
          <View style={styles.cardRow}>
            <GameCard title="CSP Fundamentals" creator="SafetyPro" tag="CSP" progress={72} />
            <GameCard title="Electrical Safety Mastery" creator="ElectricLearn" tag="Safety" progress={48} />
            <GameCard title="OSHA 30 Challenge" creator="HardHat Hero" tag="OSHA" progress={64} />
          </View>

          <DashboardCard title="AI Game Creator" accent="cyan">
            <Stepper steps={['Upload', 'Configure', 'Generate', 'Review']} activeIndex={0} />
            <View style={styles.uploadGrid}>
              <UploadCard />
              <View style={styles.topicPanel}>
                <Text style={styles.cardTitle}>Detected Topics</Text>
                {['Hazard Identification', 'Risk Assessment', 'Emergency Planning', 'Work Permit System'].map((topic) => (
                  <Text key={topic} style={styles.topic}>• {topic}</Text>
                ))}
              </View>
            </View>
          </DashboardCard>
        </View>

        <View style={styles.sideColumn}>
          <DashboardCard title="Create New Game" accent="purple">
            <View style={styles.modeCard}>
              <RewardBadge label="AI Mode" tone="purple" />
              <Text style={styles.modeText}>Upload learning material and generate one editable level at a time.</Text>
            </View>
            <View style={[styles.modeCard, styles.modeCardOrange]}>
              <RewardBadge label="Manual Mode" tone="orange" />
              <Text style={styles.modeText}>Build each level manually with guided creator tools.</Text>
            </View>
          </DashboardCard>

          <DashboardCard title="Player Progress" accent="orange">
            <Text style={styles.statNumber}>Level 23</Text>
            <ProgressBar value={65} tone="purple" />
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Streak 12 days</Text>
              <Text style={styles.statLabel}>Rank #142</Text>
            </View>
          </DashboardCard>

          <DashboardCard title="Placeholder Screens" accent="cyan">
            <EmptyState
              title="Phase 0 Screens Ready"
              description="Auth, creator dashboard, player dashboard, upload, editor, gameplay, and certificates placeholders are scaffolded."
            />
          </DashboardCard>
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  mainColumn: {
    flex: 3,
    gap: spacing.lg,
    minWidth: 680,
  },
  sideColumn: {
    flex: 1,
    gap: spacing.lg,
    minWidth: 300,
  },
  hero: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 260,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  heroCopy: {
    flex: 1.4,
    gap: spacing.md,
    justifyContent: 'center',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
    lineHeight: 39,
    maxWidth: 620,
  },
  heroText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    maxWidth: 560,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  orbitPanel: {
    alignItems: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    borderRadius: radius.xl,
    borderWidth: 1,
    flex: 0.8,
    justifyContent: 'center',
    minWidth: 220,
  },
  aiMark: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: 76,
    fontWeight: '900',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  linkText: {
    color: colors.primaryLight,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  topicPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 240,
    padding: spacing.lg,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  topic: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 26,
  },
  modeCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  modeCardOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    borderColor: 'rgba(249, 115, 22, 0.35)',
  },
  modeText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 22,
  },
  statNumber: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
});

