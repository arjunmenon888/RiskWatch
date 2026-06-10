import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Game, GameDraftPayload, createGame, deleteGame, listGames } from '../../api/games';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusPanel } from '../../components/StatusPanel';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { CreateGameScreen } from './CreateGameScreen';
import { CreatorGamesScreen } from './CreatorGamesScreen';
import { GameWorkspaceScreen } from './GameWorkspaceScreen';

const initialForm: GameDraftPayload = {
  title: '',
  description: '',
  category: '',
  visibility: 'private',
};

export function CreatorDashboardScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { token } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [form, setForm] = useState<GameDraftPayload>(initialForm);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
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

  async function handleSubmit() {
    if (!token) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createGame(token, form);
      setGames((current) => [created, ...current]);
      setForm(initialForm);
    } catch (gameError) {
      setError(getErrorMessage(gameError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!token || !selectedGame) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await deleteGame(token, selectedGame.id);
      setGames((current) => current.filter((game) => game.id !== selectedGame.id));
      setSelectedGame(null);
    } catch (gameError) {
      setError(getErrorMessage(gameError));
    } finally {
      setDeleting(false);
    }
  }

  function handleGameChange(updated: Game) {
    setGames((current) => current.map((game) => (game.id === updated.id ? updated : game)));
    setSelectedGame(updated);
  }

  if (selectedGame) {
    return (
      <GameWorkspaceScreen
        game={selectedGame}
        isDeleting={isDeleting}
        onBack={() => setSelectedGame(null)}
        onDelete={handleDelete}
        onGameChange={handleGameChange}
      />
    );
  }

  return (
    <View style={styles.page}>
      <View style={[styles.topGrid, isMobile && styles.topGridMobile]}>
        <View style={[styles.mainColumn, isMobile && styles.columnMobile]}>
          <View style={[styles.hero, isMobile && styles.heroMobile]}>
            <Text style={styles.eyebrow}>Creator Hub</Text>
            <Text style={[styles.title, isMobile && styles.titleMobile]}>Create New Game</Text>
            <Text style={styles.copy}>Create a game, add source material, review its learning content, and publish when ready.</Text>
            <StatusPanel
              description="You're all set. Start building your game."
              title="Draft Metadata Ready"
            />
          </View>

          <DashboardCard title="Creator Games" accent="cyan">
            <CreatorGamesScreen
              games={games}
              isLoading={isLoading}
              onSelectGame={setSelectedGame}
            />
          </DashboardCard>
        </View>

        <View style={[styles.sideColumn, isMobile && styles.columnMobile]}>
          <DashboardCard title="Create Game" accent="purple">
            <CreateGameScreen form={form} isSubmitting={isSubmitting} onChange={setForm} onSubmit={handleSubmit} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </DashboardCard>
        </View>
      </View>

    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  topGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  topGridMobile: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  mainColumn: {
    flex: 2,
    gap: spacing.lg,
    minWidth: 560,
  },
  sideColumn: {
    flex: 1,
    minWidth: 340,
  },
  columnMobile: {
    flex: 0,
    width: '100%',
  },
  hero: {
    backgroundColor: '#EFE4FF',
    borderColor: '#E1D1FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: 'hidden',
    padding: spacing.xl,
  },
  heroMobile: {
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
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
  titleMobile: {
    fontSize: 25,
    lineHeight: 32,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
    maxWidth: 560,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    marginTop: spacing.md,
  },
});
