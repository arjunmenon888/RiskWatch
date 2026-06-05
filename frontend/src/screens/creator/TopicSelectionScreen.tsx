import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Game } from '../../api/games';
import { Topic, TopicDifficulty, deleteTopic, extractTopics, listTopics, reorderTopics, updateTopic } from '../../api/topics';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type TopicSelectionScreenProps = {
  game: Game;
};

const difficulties: TopicDifficulty[] = ['beginner', 'intermediate', 'advanced'];

export function TopicSelectionScreen({ game }: TopicSelectionScreenProps) {
  const { token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isExtracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    listTopics(token, game.id)
      .then(setTopics)
      .catch((topicError) => setError(getErrorMessage(topicError)))
      .finally(() => setLoading(false));
  }, [game.id, token]);

  async function handleExtract() {
    if (!token) {
      return;
    }
    setExtracting(true);
    setError(null);
    try {
      const extracted = await extractTopics(token, game.id);
      setTopics(extracted);
      setEditingId(null);
    } catch (topicError) {
      setError(getErrorMessage(topicError));
    } finally {
      setExtracting(false);
    }
  }

  async function patchTopic(topic: Topic, payload: Partial<Topic>) {
    if (!token) {
      return;
    }
    setTopics((current) => current.map((item) => (item.id === topic.id ? { ...item, ...payload } : item)));
    try {
      const updated = await updateTopic(token, game.id, topic.id, payload);
      setTopics((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (topicError) {
      setError(getErrorMessage(topicError));
    }
  }

  async function moveTopic(topic: Topic, direction: -1 | 1) {
    if (!token) {
      return;
    }
    const index = topics.findIndex((item) => item.id === topic.id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= topics.length) {
      return;
    }
    const nextTopics = [...topics];
    const [moved] = nextTopics.splice(index, 1);
    nextTopics.splice(nextIndex, 0, moved);
    setTopics(nextTopics);
    try {
      const reordered = await reorderTopics(token, game.id, nextTopics.map((item) => item.id));
      setTopics(reordered);
    } catch (topicError) {
      setError(getErrorMessage(topicError));
    }
  }

  async function removeTopic(topic: Topic) {
    if (!token) {
      return;
    }
    setTopics((current) => current.filter((item) => item.id !== topic.id));
    try {
      await deleteTopic(token, game.id, topic.id);
    } catch (topicError) {
      setError(getErrorMessage(topicError));
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>AI Topic Extraction</Text>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.copy}>Extract topics from processed document chunks, then choose which ones become game levels.</Text>
        </View>
        <PrimaryButton disabled={isExtracting} label={isExtracting ? 'Extracting...' : 'Extract Topics'} onPress={handleExtract} />
      </View>

      {isLoading ? <Text style={styles.copy}>Loading topics...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {topics.length === 0 && !isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No topics yet</Text>
          <Text style={styles.copy}>Upload and process a document, then extract topics here.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {topics.map((topic, index) => {
          const editing = editingId === topic.id;
          return (
            <View key={topic.id} style={[styles.card, !topic.selected && styles.cardMuted]}>
              <View style={styles.cardTop}>
                <Pressable onPress={() => patchTopic(topic, { selected: !topic.selected })} style={[styles.check, topic.selected && styles.checkActive]}>
                  <Text style={styles.checkText}>{topic.selected ? 'Selected' : 'Skipped'}</Text>
                </Pressable>
                <View style={styles.badges}>
                  <RewardBadge label={topic.difficulty} tone={topic.difficulty === 'advanced' ? 'orange' : 'purple'} />
                  <RewardBadge label={`${topic.recommended_level_count} level${topic.recommended_level_count > 1 ? 's' : ''}`} tone="cyan" />
                </View>
              </View>

              {editing ? (
                <View style={styles.editForm}>
                  <TextInput
                    onChangeText={(title) => setTopics((current) => current.map((item) => (item.id === topic.id ? { ...item, title } : item)))}
                    onBlur={() => patchTopic(topic, { title: topics.find((item) => item.id === topic.id)?.title ?? topic.title })}
                    placeholder="Topic title"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    value={topic.title}
                  />
                  <TextInput
                    multiline
                    onChangeText={(summary) => setTopics((current) => current.map((item) => (item.id === topic.id ? { ...item, summary } : item)))}
                    onBlur={() => patchTopic(topic, { summary: topics.find((item) => item.id === topic.id)?.summary ?? topic.summary })}
                    placeholder="Topic summary"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, styles.textarea]}
                    value={topic.summary}
                  />
                  <View style={styles.optionRow}>
                    {difficulties.map((difficulty) => (
                      <Pressable
                        key={difficulty}
                        onPress={() => patchTopic(topic, { difficulty })}
                        style={[styles.option, topic.difficulty === difficulty && styles.optionActive]}
                      >
                        <Text style={styles.optionText}>{difficulty}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.summary}>{topic.summary}</Text>
                </>
              )}

              <Text style={styles.sources}>Sources: chunks {topic.source_chunk_ids.join(', ')}</Text>

              <View style={styles.actions}>
                <SecondaryButton label={editing ? 'Done Editing' : 'Edit'} onPress={() => setEditingId(editing ? null : topic.id)} />
                <SecondaryButton disabled={index === 0} label="Move Up" onPress={() => moveTopic(topic, -1)} />
                <SecondaryButton disabled={index === topics.length - 1} label="Move Down" onPress={() => moveTopic(topic, 1)} />
                <Pressable onPress={() => removeTopic(topic)} style={styles.deleteButton}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
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
    maxWidth: 620,
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
  cardMuted: {
    opacity: 0.62,
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  check: {
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  checkActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.16)',
    borderColor: colors.success,
  },
  checkText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  summary: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  sources: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  editForm: {
    gap: spacing.md,
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
    minHeight: 88,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.22)',
    borderColor: colors.primaryLight,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
});
