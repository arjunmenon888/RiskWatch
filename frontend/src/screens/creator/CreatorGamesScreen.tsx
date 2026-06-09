import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Game } from '../../api/games';
import { RewardBadge } from '../../components/RewardBadge';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type CreatorGamesScreenProps = {
  games: Game[];
  isLoading: boolean;
  onSelectGame: (game: Game) => void;
};

export function CreatorGamesScreen({
  games,
  isLoading,
  onSelectGame,
}: CreatorGamesScreenProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Your Draft Games</Text>
        <Text style={styles.count}>{games.length} drafts</Text>
      </View>

      {isLoading ? <Text style={styles.muted}>Loading drafts...</Text> : null}
      {!isLoading && games.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No drafts yet</Text>
          <Text style={styles.muted}>Create your first game draft to start the creator workflow.</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {games.map((game) => (
          <Pressable
            accessibilityHint="Opens the game workspace"
            accessibilityRole="button"
            key={game.id}
            onPress={() => onSelectGame(game)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.badges}>
                <RewardBadge label={game.status} tone="cyan" />
              </View>
              <MaterialCommunityIcons color={colors.textMuted} name="chevron-right" size={24} />
            </View>
            <Text style={styles.title}>{game.title}</Text>
            <Text style={styles.description}>{game.description || 'No description yet.'}</Text>
            <Text style={styles.meta}>
              {game.category} / {game.visibility} / Updated {new Date(game.updated_at).toLocaleString()}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  headerRow: {
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
  count: {
    color: colors.primaryLight,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  muted: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 22,
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
  cardPressed: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primaryLight,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
