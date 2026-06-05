import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Game, GameDraftPayload, createGame, deleteGame, listGames, updateGame } from '../../api/games';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { BlueprintScreen } from './BlueprintScreen';
import { CreateGameScreen } from './CreateGameScreen';
import { CreatorGamesScreen } from './CreatorGamesScreen';
import { TopicSelectionScreen } from './TopicSelectionScreen';
import { UploadDocumentScreen } from './UploadDocumentScreen';

const initialForm: GameDraftPayload = {
  title: '',
  description: '',
  category: 'Safety',
  visibility: 'private',
  creation_mode: 'ai',
};

export function CreatorDashboardScreen() {
  const { token } = useAuth();
  const [blueprintGame, setBlueprintGame] = useState<Game | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState<GameDraftPayload>(initialForm);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [topicGame, setTopicGame] = useState<Game | null>(null);
  const [uploadGame, setUploadGame] = useState<Game | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    listGames(token)
      .then(setGames)
      .catch((gameError) => setError(getErrorMessage(gameError)))
      .finally(() => setLoading(false));
  }, [token]);

  const heroCopy = useMemo(() => {
    if (editingGame) {
      return `Editing metadata for "${editingGame.title}".`;
    }
    return 'Create a draft first, then future phases will attach uploads, topics, blueprints, and generated levels.';
  }, [editingGame]);

  async function handleSubmit() {
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      if (editingGame) {
        const updated = await updateGame(token, editingGame.id, form);
        setGames((current) => current.map((game) => (game.id === updated.id ? updated : game)));
        setEditingGame(null);
      } else {
        const created = await createGame(token, form);
        setGames((current) => [created, ...current]);
      }
      setForm(initialForm);
    } catch (gameError) {
      setError(getErrorMessage(gameError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!token || !deleteTarget) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteGame(token, deleteTarget.id);
      setGames((current) => current.filter((game) => game.id !== deleteTarget.id));
      if (editingGame?.id === deleteTarget.id) {
        setEditingGame(null);
        setForm(initialForm);
      }
      if (uploadGame?.id === deleteTarget.id) {
        setUploadGame(null);
      }
      if (topicGame?.id === deleteTarget.id) {
        setTopicGame(null);
      }
      if (blueprintGame?.id === deleteTarget.id) {
        setBlueprintGame(null);
      }
      setDeleteTarget(null);
    } catch (gameError) {
      setError(getErrorMessage(gameError));
    } finally {
      setDeleting(false);
    }
  }

  function beginEdit(game: Game) {
    setEditingGame(game);
    setBlueprintGame(null);
    setUploadGame(null);
    setTopicGame(null);
    setForm({
      title: game.title,
      description: game.description,
      category: game.category,
      visibility: game.visibility,
      creation_mode: game.creation_mode,
    });
  }

  function cancelEdit() {
    setEditingGame(null);
    setForm(initialForm);
    setError(null);
  }

  function beginUpload(game: Game) {
    setUploadGame(game);
    setBlueprintGame(null);
    setTopicGame(null);
    setEditingGame(null);
    setForm(initialForm);
    setError(null);
  }

  function beginTopics(game: Game) {
    setTopicGame(game);
    setBlueprintGame(null);
    setUploadGame(null);
    setEditingGame(null);
    setForm(initialForm);
    setError(null);
  }

  function beginBlueprint(game: Game) {
    setBlueprintGame(game);
    setTopicGame(null);
    setUploadGame(null);
    setEditingGame(null);
    setForm(initialForm);
    setError(null);
  }

  return (
    <View style={styles.grid}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Creator Game Drafts</Text>
        <Text style={styles.title}>{editingGame ? 'Edit Game Draft' : 'Create New Game'}</Text>
        <Text style={styles.copy}>{heroCopy}</Text>
        {editingGame ? <SecondaryButton label="Cancel Edit" onPress={cancelEdit} /> : <PrimaryButton label="Draft Metadata Ready" />}
      </View>

      <DashboardCard title={editingGame ? 'Edit Metadata' : 'Create Game'} accent="purple">
        <CreateGameScreen form={form} isSubmitting={isSubmitting} onChange={setForm} onSubmit={handleSubmit} />
        {editingGame ? (
          <View style={styles.editActions}>
            <SecondaryButton disabled={isSubmitting} label="Cancel Edit" onPress={cancelEdit} />
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </DashboardCard>

      <DashboardCard title="Creator Games" accent="cyan">
        <CreatorGamesScreen
          deleteTarget={deleteTarget}
          games={games}
          isDeleting={isDeleting}
          isLoading={isLoading}
          onCancelDelete={() => setDeleteTarget(null)}
          onBlueprintRequest={beginBlueprint}
          onConfirmDelete={handleDelete}
          onDeleteRequest={setDeleteTarget}
          onEditRequest={beginEdit}
          onTopicRequest={beginTopics}
          onUploadRequest={beginUpload}
        />
      </DashboardCard>

      {uploadGame ? (
        <DashboardCard title="Upload Source Document" accent="orange">
          <UploadDocumentScreen game={uploadGame} />
        </DashboardCard>
      ) : null}

      {topicGame ? (
        <DashboardCard title="Topic Selection" accent="purple">
          <TopicSelectionScreen game={topicGame} />
        </DashboardCard>
      ) : null}

      {blueprintGame ? (
        <DashboardCard title="Blueprint Draft" accent="cyan">
          <BlueprintScreen game={blueprintGame} />
        </DashboardCard>
      ) : null}
    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  hero: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 2,
    gap: spacing.md,
    minWidth: 420,
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
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    maxWidth: 560,
  },
  editActions: {
    marginTop: spacing.md,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    marginTop: spacing.md,
  },
});
