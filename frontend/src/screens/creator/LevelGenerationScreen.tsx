import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Game } from '../../api/games';
import { GameLevel, approveLevel, generateNextLevel, listLevels } from '../../api/levels';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { LevelEditorScreen } from './LevelEditorScreen';

type LevelGenerationScreenProps = {
  game: Game;
};

export function LevelGenerationScreen({ game }: LevelGenerationScreenProps) {
  const { token } = useAuth();
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isGenerating, setGenerating] = useState(false);
  const [isApproving, setApproving] = useState(false);
  const [editingLevel, setEditingLevel] = useState<GameLevel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    listLevels(token, game.id)
      .then(setLevels)
      .catch((levelError) => setError(getErrorMessage(levelError)))
      .finally(() => setLoading(false));
  }, [game.id, token]);

  const currentLevel = levels[levels.length - 1] ?? null;
  const hasBlockingLevel = Boolean(currentLevel && currentLevel.status !== 'approved');
  const canGenerate = !isGenerating && !hasBlockingLevel;

  async function handleGenerate() {
    if (!token) {
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const generated = await generateNextLevel(token, game.id);
      setLevels((current) => [...current, generated]);
      setEditingLevel(generated);
    } catch (levelError) {
      setError(getErrorMessage(levelError));
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(level: GameLevel) {
    if (!token) {
      return;
    }
    setApproving(true);
    setError(null);
    try {
      const approved = await approveLevel(token, game.id, level.id);
      handleLevelChange(approved);
    } catch (levelError) {
      setError(getErrorMessage(levelError));
    } finally {
      setApproving(false);
    }
  }

  const actionLabel = useMemo(() => {
    if (isGenerating) {
      return 'Generating...';
    }
    return levels.length === 0 ? 'Generate Level 1' : 'Generate Next Level';
  }, [isGenerating, levels.length]);

  function handleLevelChange(level: GameLevel) {
    setLevels((current) => current.map((item) => (item.id === level.id ? level : item)));
    setEditingLevel((current) => (current?.id === level.id ? level : current));
  }

  function handleLevelClone(level: GameLevel) {
    setLevels((current) => [...current, level].sort((first, second) => first.sequence_number - second.sequence_number));
    setEditingLevel(level);
  }

  function handleLevelDelete(levelId: number) {
    setLevels((current) => current.filter((item) => item.id !== levelId));
    setEditingLevel(null);
  }

  if (editingLevel) {
    return (
      <LevelEditorScreen
        game={game}
        level={editingLevel}
        levels={levels}
        onClose={() => setEditingLevel(null)}
        onLevelChange={handleLevelChange}
        onLevelClone={handleLevelClone}
        onLevelDelete={handleLevelDelete}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Level-by-Level Generation</Text>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.copy}>Generate only one level at a time. Approve the current level before creating the next one.</Text>
        </View>
        <PrimaryButton disabled={!canGenerate} label={actionLabel} onPress={handleGenerate} />
      </View>

      {isLoading ? <Text style={styles.copy}>Loading generated levels...</Text> : null}
      {hasBlockingLevel ? <Text style={styles.warning}>Approve the current level to unlock the next generation.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {levels.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No levels yet</Text>
          <Text style={styles.copy}>Approve a blueprint first, then generate Level 1 from the next selected topic.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {levels.map((level) => (
          <View key={level.id} style={styles.card}>
            <View style={styles.cardTop}>
              <RewardBadge label={level.status} tone={level.status === 'approved' ? 'cyan' : 'orange'} />
              <RewardBadge label={level.difficulty} tone={level.difficulty === 'advanced' ? 'orange' : 'purple'} />
              <RewardBadge label={`${level.questions.length} questions`} tone="cyan" />
              <RewardBadge label={`${level.pass_score}% pass`} tone="purple" />
              {level.locked_from_ai_changes ? <RewardBadge label="AI locked" tone="orange" /> : null}
            </View>

            <Text style={styles.levelTitle}>{level.title}</Text>
            <Text style={styles.objective}>{level.learning_objective}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Topic Explanation</Text>
              <Text style={styles.copy}>{level.topic_explanation}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Scenario Preview</Text>
              <Text style={styles.copy}>{String(level.scenarios[0]?.prompt ?? 'No scenario generated.')}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaPanel}>
                <Text style={styles.sectionTitle}>Reward</Text>
                <Text style={styles.copy}>{String(level.reward.badge ?? 'Reward')}</Text>
                <Text style={styles.small}>{String(level.reward.xp ?? 0)} XP</Text>
              </View>
              <View style={styles.metaPanel}>
                <Text style={styles.sectionTitle}>Branching</Text>
                <Text style={styles.copy}>{String(level.branching_suggestion.style ?? 'Review path')}</Text>
              </View>
            </View>

            <Text style={styles.sources}>Sources: chunks {level.source_chunk_ids.join(', ') || 'none'}</Text>

            <SecondaryButton label="Edit Level" onPress={() => setEditingLevel(level)} />
            {level.status !== 'approved' ? (
              <SecondaryButton disabled={isApproving} label={isApproving ? 'Approving...' : 'Approve Level'} onPress={() => handleApprove(level)} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
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
    fontSize: typography.heading,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  warning: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
    marginBottom: spacing.xs,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  levelTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  objective: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaPanel: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    minWidth: 220,
    padding: spacing.md,
  },
  small: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  sources: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
});
