import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Game, GameDraftPayload, updateGame } from '../../api/games';
import { GameLevel, createLevel, listLevels, reorderLevels } from '../../api/levels';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { LevelEditorScreen } from './LevelEditorScreen';

type GameEditorScreenProps = {
  game: Game;
  onClose: () => void;
  onGameChange: (game: Game) => void;
};

export function GameEditorScreen({ game, onClose, onGameChange }: GameEditorScreenProps) {
  const { token } = useAuth();
  const [draft, setDraft] = useState<GameDraftPayload>(() => toDraft(game));
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isWorking, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(toDraft(game));
  }, [game.id, game.updated_at]);

  useEffect(() => {
    void refreshLevels();
  }, [game.id, token]);

  async function refreshLevels(selectLevelId?: number) {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const nextLevels = await listLevels(token, game.id);
      setLevels(nextLevels);
      if (selectLevelId !== undefined) {
        setSelectedLevel(nextLevels.find((level) => level.id === selectLevelId) ?? null);
      } else {
        setSelectedLevel((current) => nextLevels.find((level) => level.id === current?.id) ?? null);
      }
    } catch (levelError) {
      setError(getErrorMessage(levelError));
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveMetadata() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateGame(token, game.id, draft);
      onGameChange(updated);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLevel(insertAt: number) {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const created = await createLevel(token, game.id, insertAt);
      await refreshLevels(created.id);
    } catch (levelError) {
      setError(getErrorMessage(levelError));
    } finally {
      setWorking(false);
    }
  }

  async function handleMoveLevel(levelIndex: number, direction: -1 | 1) {
    if (!token) {
      return;
    }
    const reordered = moveItem(levels, levelIndex, levelIndex + direction);
    if (reordered === levels) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const saved = await reorderLevels(token, game.id, reordered.map((level) => level.id));
      setLevels(saved);
      setSelectedLevel((current) => saved.find((level) => level.id === current?.id) ?? null);
    } catch (levelError) {
      setError(getErrorMessage(levelError));
    } finally {
      setWorking(false);
    }
  }

  function handleLevelChange(level: GameLevel) {
    setLevels((current) =>
      current
        .map((item) => (item.id === level.id ? level : item))
        .sort((first, second) => first.sequence_number - second.sequence_number),
    );
    setSelectedLevel(level);
  }

  function handleLevelClone(level: GameLevel) {
    setLevels((current) => [...current, level].sort((first, second) => first.sequence_number - second.sequence_number));
    setSelectedLevel(level);
  }

  if (selectedLevel) {
    return (
      <View style={styles.page}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>Game Editor / {game.title}</Text>
            <Text style={styles.title}>Edit Level {selectedLevel.sequence_number}</Text>
          </View>
          <SecondaryButton label="Back to Game Editor" onPress={() => setSelectedLevel(null)} />
        </View>
        <LevelEditorScreen
          game={game}
          level={selectedLevel}
          levels={levels}
          onClose={() => setSelectedLevel(null)}
          onLevelChange={handleLevelChange}
          onLevelClone={handleLevelClone}
          onLevelDelete={(levelId) => {
            setSelectedLevel(null);
            void refreshLevels(levelId);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Dedicated Game Editor</Text>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.copy}>Edit game details, insert levels anywhere, reorder them, and open each level for detailed question editing.</Text>
        </View>
        <SecondaryButton label="Back to Game Workspace" onPress={onClose} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.metadata}>
        <Text style={styles.sectionTitle}>Game Details</Text>
        <View style={styles.fieldRow}>
          <EditorField label="Title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} />
          <EditorField label="Category" value={draft.category} onChangeText={(category) => setDraft({ ...draft, category })} />
        </View>
        <EditorField
          label="Description"
          value={draft.description}
          multiline
          onChangeText={(description) => setDraft({ ...draft, description })}
        />
        <View style={styles.choiceRow}>
          {(['private', 'unlisted', 'public'] as const).map((visibility) => (
            <Pressable
              key={visibility}
              onPress={() => setDraft({ ...draft, visibility })}
              style={[styles.choice, draft.visibility === visibility && styles.choiceActive]}
            >
              <Text style={[styles.choiceText, draft.visibility === visibility && styles.choiceTextActive]}>{visibility}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton disabled={isSaving} label={isSaving ? 'Saving...' : 'Save Game Details'} onPress={handleSaveMetadata} />
      </View>

      <View style={styles.workspace}>
        <View style={styles.levelRail}>
          <View style={styles.railHeader}>
            <Text style={styles.sectionTitle}>Levels</Text>
            <RewardBadge label={`${levels.length} total`} tone="cyan" />
          </View>
          <InsertLevelButton disabled={isWorking} position={1} onPress={() => handleAddLevel(1)} />
          {levels.map((level, index) => (
            <View key={level.id} style={styles.levelGroup}>
              <Pressable onPress={() => setSelectedLevel(level)} style={styles.levelCard}>
                <View style={styles.levelTop}>
                  <Text style={styles.levelNumber}>Level {level.sequence_number}</Text>
                  <RewardBadge label={level.status} tone={level.status === 'approved' ? 'cyan' : 'orange'} />
                </View>
                <Text style={styles.levelTitle}>{level.title}</Text>
                <Text style={styles.levelMeta}>
                  {level.questions.length} questions / {questionXpTotal(level).toLocaleString()} XP
                </Text>
                <View style={styles.levelActions}>
                  <SmallButton disabled={isWorking || index === 0} label="Move Up" onPress={() => handleMoveLevel(index, -1)} />
                  <SmallButton
                    disabled={isWorking || index === levels.length - 1}
                    label="Move Down"
                    onPress={() => handleMoveLevel(index, 1)}
                  />
                  <SmallButton label="Edit Level" onPress={() => setSelectedLevel(level)} />
                </View>
              </Pressable>
              <InsertLevelButton
                disabled={isWorking}
                position={index + 2}
                onPress={() => handleAddLevel(index + 2)}
              />
            </View>
          ))}
          {!isLoading && levels.length === 0 ? <Text style={styles.copy}>No levels yet. Add the first level to begin.</Text> : null}
          {isLoading ? <Text style={styles.copy}>Loading levels...</Text> : null}
        </View>

        <View style={styles.guide}>
          <Text style={styles.sectionTitle}>Editing Guide</Text>
          <Text style={styles.guideTitle}>Select a level to edit its full content.</Text>
          <Text style={styles.copy}>Inside a level you can edit question text, correct answers, feedback, and XP per question.</Text>
          <Text style={styles.copy}>Use Move Up and Move Down to reorder questions and answer choices.</Text>
          <Text style={styles.copy}>Changes to a published game remain a draft until you approve affected levels and publish a new version.</Text>
        </View>
      </View>
    </View>
  );
}

type EditorFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
};

function EditorField({ label, value, onChangeText, multiline = false }: EditorFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.textarea]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function InsertLevelButton({ position, onPress, disabled }: { position: number; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.insertButton, disabled && styles.disabled]}>
      <Text style={styles.insertText}>+ Add level at position {position}</Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.smallButton, disabled && styles.disabled]}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function toDraft(game: Game): GameDraftPayload {
  return {
    title: game.title,
    description: game.description,
    category: game.category,
    visibility: game.visibility,
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function questionXpTotal(level: GameLevel): number {
  const total = level.questions.reduce((sum, question) => sum + Math.max(0, Number(question.xp) || 0), 0);
  return total > 0 ? total : Math.max(0, Number(level.reward.xp) || 0);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
    width: '100%',
  },
  pageHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 320,
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
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  metadata: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 240,
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
    minHeight: 100,
  },
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  choice: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  choiceActive: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  choiceText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  choiceTextActive: {
    color: colors.background,
  },
  workspace: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  levelRail: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 2,
    gap: spacing.sm,
    minWidth: 440,
    padding: spacing.lg,
  },
  railHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  levelGroup: {
    gap: spacing.sm,
  },
  levelCard: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  levelTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelNumber: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  levelTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  levelMeta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  levelActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  smallButton: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallButtonText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  insertButton: {
    alignItems: 'center',
    borderColor: colors.primaryLight,
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
  },
  insertText: {
    color: colors.primaryLight,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  guide: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    minWidth: 280,
    padding: spacing.lg,
  },
  guideTitle: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.5,
  },
});
