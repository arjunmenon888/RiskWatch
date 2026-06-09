import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameplaySession, PlayableGame, listPlayableGames, startGame } from '../../api/gameplay';
import { GameRewardSummary, getGameRewardSummary } from '../../api/rewards';
import { DashboardCard } from '../../components/DashboardCard';
import { StatusPanel } from '../../components/StatusPanel';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { GameplayScreen } from './GameplayScreen';

export function PlayerDashboardScreen({ onShowCertificates }: { onShowCertificates?: () => void }) {
  const { token } = useAuth();
  const [games, setGames] = useState<PlayableGame[]>([]);
  const [session, setSession] = useState<GameplaySession | null>(null);
  const [activeGame, setActiveGame] = useState<PlayableGame | null>(null);
  const [gameRewards, setGameRewards] = useState<GameRewardSummary | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isStarting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    listPlayableGames(token)
      .then(setGames)
      .catch((dashboardError) => setError(getErrorMessage(dashboardError)))
      .finally(() => setLoading(false));
  }, [token]);

  function refreshGameRewards(gameId: number) {
    if (!token) {
      return;
    }
    getGameRewardSummary(token, gameId).then(setGameRewards).catch(() => undefined);
  }

  async function handleStartGame(game: PlayableGame) {
    if (!token) {
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const [started, rewards] = await Promise.all([
        startGame(token, game.id),
        getGameRewardSummary(token, game.id),
      ]);
      setActiveGame(game);
      setGameRewards(rewards);
      setSession(started);
    } catch (startError) {
      setError(getErrorMessage(startError));
    } finally {
      setStarting(false);
    }
  }

  if (session && activeGame && gameRewards) {
    return (
      <GameplayScreen
        game={activeGame}
        gameRewards={gameRewards}
        session={session}
        onExit={() => {
          setSession(null);
          setActiveGame(null);
          setGameRewards(null);
        }}
        onProgressChange={setSession}
        onRewardChange={() => refreshGameRewards(activeGame.id)}
        onShowCertificates={onShowCertificates}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Protected Player Mode</Text>
        <Text style={styles.title}>Turn Any Document into an Interactive Learning Game</Text>
        <Text style={styles.copy}>Browse published learning games, complete levels, and continue through score-based paths.</Text>
        <StatusPanel
          description="Choose a published game below to start or continue learning."
          title={`${games.length} Games Available`}
          tone="info"
        />
      </View>

      <DashboardCard title="Explore Games" accent="purple">
        {isLoading ? <Text style={styles.copy}>Loading published games...</Text> : null}
        {games.length ? (
          <View style={styles.gameGrid}>
            {games.map((game) => (
              <View key={game.id} style={styles.gameCard}>
                <View style={styles.gameTop}>
                  <Text style={styles.gameTag}>{game.category}</Text>
                  <Text style={styles.gameMeta}>{game.level_count} levels</Text>
                </View>
                <Text style={styles.gameTitle}>{game.title}</Text>
                <Text style={styles.copy}>{game.description || 'Interactive learning game'}</Text>
                <Pressable disabled={isStarting} onPress={() => handleStartGame(game)} style={styles.playButton}>
                  <Text style={styles.playButtonText}>{isStarting ? 'Opening...' : 'Start or Resume'}</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : !isLoading ? (
          <Text style={styles.copy}>No published games are available yet. Publishing is added in Phase 11.</Text>
        ) : null}
      </DashboardCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  hero: {
    backgroundColor: '#EAF3FF',
    borderColor: '#CFE2FF',
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
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gameCard: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    minWidth: 240,
    padding: spacing.lg,
  },
  gameTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameTag: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  gameMeta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  gameTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  playButtonText: {
    color: colors.white,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
});
