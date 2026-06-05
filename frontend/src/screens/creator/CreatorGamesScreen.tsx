import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Game } from '../../api/games';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type CreatorGamesScreenProps = {
  games: Game[];
  deleteTarget: Game | null;
  isDeleting: boolean;
  isLoading: boolean;
  onCancelDelete: () => void;
  onBlueprintRequest: (game: Game) => void;
  onConfirmDelete: () => void;
  onDeleteRequest: (game: Game) => void;
  onEditRequest: (game: Game) => void;
  onTopicRequest: (game: Game) => void;
  onUploadRequest: (game: Game) => void;
};

export function CreatorGamesScreen({
  games,
  deleteTarget,
  isDeleting,
  isLoading,
  onCancelDelete,
  onBlueprintRequest,
  onConfirmDelete,
  onDeleteRequest,
  onEditRequest,
  onTopicRequest,
  onUploadRequest,
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
          <View key={game.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <RewardBadge label={game.creation_mode === 'ai' ? 'AI Mode' : 'Manual Mode'} tone={game.creation_mode === 'ai' ? 'purple' : 'orange'} />
              <RewardBadge label={game.status} tone="cyan" />
            </View>
            <Text style={styles.title}>{game.title}</Text>
            <Text style={styles.description}>{game.description || 'No description yet.'}</Text>
            <Text style={styles.meta}>
              {game.category} / {game.visibility} / Updated {new Date(game.updated_at).toLocaleDateString()}
            </Text>
            <View style={styles.actions}>
              <PrimaryButton label="Upload Document" onPress={() => onUploadRequest(game)} />
              <SecondaryButton label="Review Topics" onPress={() => onTopicRequest(game)} />
              <SecondaryButton label="Blueprint" onPress={() => onBlueprintRequest(game)} />
              <SecondaryButton label="Edit Metadata" onPress={() => onEditRequest(game)} />
              <Pressable onPress={() => onDeleteRequest(game)} style={styles.deleteButton}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Modal transparent visible={Boolean(deleteTarget)} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete draft?</Text>
            <Text style={styles.description}>
              {deleteTarget ? `This will remove "${deleteTarget.title}" from your creator workspace.` : ''}
            </Text>
            <View style={styles.modalActions}>
              <SecondaryButton disabled={isDeleting} label="Cancel" onPress={onCancelDelete} />
              <PrimaryButton disabled={isDeleting} label={isDeleting ? 'Deleting...' : 'Delete Draft'} onPress={onConfirmDelete} />
            </View>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 460,
    padding: spacing.xl,
    width: '100%',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  modalActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'flex-end',
  },
});
