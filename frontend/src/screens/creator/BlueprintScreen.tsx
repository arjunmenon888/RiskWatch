import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { approveBlueprint, Blueprint, createBlueprint, getBlueprint, updateBlueprint } from '../../api/blueprints';
import { Game } from '../../api/games';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type BlueprintScreenProps = {
  game: Game;
};

export function BlueprintScreen({ game }: BlueprintScreenProps) {
  const { token } = useAuth();
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [draft, setDraft] = useState<Blueprint | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isGenerating, setGenerating] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    getBlueprint(token, game.id)
      .then((result) => {
        setBlueprint(result);
        setDraft(result);
      })
      .catch(() => {
        setBlueprint(null);
        setDraft(null);
      })
      .finally(() => setLoading(false));
  }, [game.id, token]);

  async function handleGenerate() {
    if (!token) {
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const result = await createBlueprint(token, game.id);
      setBlueprint(result);
      setDraft(result);
    } catch (blueprintError) {
      setError(getErrorMessage(blueprintError));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!token || !draft) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateBlueprint(token, game.id, {
        title: draft.title,
        description: draft.description,
        total_levels: draft.total_levels,
        estimated_duration_minutes: draft.estimated_duration_minutes,
        topic_order: draft.topic_order,
        difficulty_distribution: draft.difficulty_distribution,
        reward_style: draft.reward_style,
        branching_style: draft.branching_style,
      });
      setBlueprint(result);
      setDraft(result);
    } catch (blueprintError) {
      setError(getErrorMessage(blueprintError));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await approveBlueprint(token, game.id);
      setBlueprint(result);
      setDraft(result);
    } catch (blueprintError) {
      setError(getErrorMessage(blueprintError));
    } finally {
      setSaving(false);
    }
  }

  const current = draft;
  const totalDifficulty = current ? Object.values(current.difficulty_distribution).reduce((sum, value) => sum + value, 0) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Game Blueprint</Text>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.copy}>Create a high-level game plan from selected topics. Level content is not generated in this phase.</Text>
        </View>
        <PrimaryButton disabled={isGenerating} label={isGenerating ? 'Generating...' : 'Generate Blueprint'} onPress={handleGenerate} />
      </View>

      {isLoading ? <Text style={styles.copy}>Loading blueprint...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!current ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No blueprint yet</Text>
          <Text style={styles.copy}>Extract and select topics first, then generate the game blueprint.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          <View style={styles.panel}>
            <View style={styles.statusRow}>
              <RewardBadge label={current.approved ? 'Approved' : 'Draft'} tone={current.approved ? 'cyan' : 'orange'} />
              <RewardBadge label={`${current.total_levels} levels`} tone="purple" />
              <RewardBadge label={`${current.estimated_duration_minutes} min`} tone="cyan" />
            </View>

            <Text style={styles.label}>Game Title</Text>
            <TextInput
              onChangeText={(title) => setDraft({ ...current, title })}
              placeholder="Blueprint title"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={current.title}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={(description) => setDraft({ ...current, description })}
              placeholder="Blueprint description"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.textarea]}
              value={current.description}
            />

            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.label}>Levels</Text>
                <TextInput
                  inputMode="numeric"
                  onChangeText={(value) => setDraft({ ...current, total_levels: Math.max(1, Number(value) || 1) })}
                  style={styles.input}
                  value={String(current.total_levels)}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Minutes</Text>
                <TextInput
                  inputMode="numeric"
                  onChangeText={(value) => setDraft({ ...current, estimated_duration_minutes: Math.max(1, Number(value) || 1) })}
                  style={styles.input}
                  value={String(current.estimated_duration_minutes)}
                />
              </View>
            </View>

            <Text style={styles.label}>Reward Style</Text>
            <TextInput
              onChangeText={(reward_style) => setDraft({ ...current, reward_style })}
              style={styles.input}
              value={current.reward_style}
            />

            <Text style={styles.label}>Branching Style</Text>
            <TextInput
              onChangeText={(branching_style) => setDraft({ ...current, branching_style })}
              style={styles.input}
              value={current.branching_style}
            />

            <View style={styles.actions}>
              <SecondaryButton disabled={isSaving} label={isSaving ? 'Saving...' : 'Save Draft'} onPress={handleSave} />
              <PrimaryButton disabled={isSaving || !blueprint} label="Approve Blueprint" onPress={handleApprove} />
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Selected Topic Order</Text>
            {current.topic_order.map((topicId, index) => (
              <View key={`${topicId}-${index}`} style={styles.orderRow}>
                <Text style={styles.orderNumber}>{index + 1}</Text>
                <Text style={styles.orderText}>Topic #{topicId}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Difficulty Distribution</Text>
            {Object.entries(current.difficulty_distribution).map(([difficulty, count]) => (
              <View key={difficulty} style={styles.difficultyRow}>
                <Text style={styles.orderText}>{difficulty}</Text>
                <View style={styles.progressWrap}>
                  <ProgressBar value={totalDifficulty ? (count / totalDifficulty) * 100 : 0} tone={difficulty === 'advanced' ? 'orange' : 'purple'} />
                </View>
                <Text style={styles.count}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
    maxWidth: 650,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    minWidth: 320,
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  orderRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  orderNumber: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  orderText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  difficultyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  progressWrap: {
    flex: 1,
  },
  count: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    minWidth: 20,
    textAlign: 'right',
  },
});
