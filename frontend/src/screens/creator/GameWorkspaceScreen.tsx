import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Game } from '../../api/games';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { BlueprintScreen } from './BlueprintScreen';
import { GameEditorScreen } from './GameEditorScreen';
import { LevelGenerationScreen } from './LevelGenerationScreen';
import { PublishGameScreen } from './PublishGameScreen';
import { TopicSelectionScreen } from './TopicSelectionScreen';
import { UploadDocumentScreen } from './UploadDocumentScreen';

type WorkspaceSection = 'upload' | 'topics' | 'blueprint' | 'levels' | 'publish' | 'edit';

type GameWorkspaceScreenProps = {
  game: Game;
  isDeleting: boolean;
  onBack: () => void;
  onDelete: () => void;
  onGameChange: (game: Game) => void;
};

const sections: Array<{
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  id: WorkspaceSection;
  label: string;
}> = [
  { id: 'upload', label: 'Add Source Material', icon: 'file-upload-outline' },
  { id: 'topics', label: 'Review Topics', icon: 'format-list-checks' },
  { id: 'blueprint', label: 'Blueprint', icon: 'clipboard-text-outline' },
  { id: 'levels', label: 'Generate Levels', icon: 'layers-triple-outline' },
  { id: 'publish', label: 'Preview & Publish', icon: 'eye-outline' },
  { id: 'edit', label: 'Edit Game', icon: 'pencil-outline' },
];

export function GameWorkspaceScreen({
  game,
  isDeleting,
  onBack,
  onDelete,
  onGameChange,
}: GameWorkspaceScreenProps) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  if (activeSection === 'edit') {
    return (
      <GameEditorScreen
        game={game}
        onClose={() => setActiveSection(null)}
        onGameChange={onGameChange}
      />
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.pageHeader}>
        <SecondaryButton label="Back to Creator Dashboard" onPress={onBack} />
      </View>

      <View style={styles.hero}>
        <View style={styles.badges}>
          <RewardBadge label={game.status} tone="cyan" />
        </View>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description || 'No description yet.'}</Text>
        <Text style={styles.meta}>
          {game.category} / {game.visibility} / Updated {new Date(game.updated_at).toLocaleString()}
        </Text>
      </View>

      <DashboardCard title="Game Workspace" accent="purple">
        <Text style={styles.workspaceCopy}>Choose an area to view and manage its details.</Text>
        <View style={styles.actions}>
          {sections.map((section) => (
            <Pressable
              key={section.id}
              onPress={() => setActiveSection(section.id)}
              style={[styles.action, activeSection === section.id && styles.actionActive]}
            >
              <MaterialCommunityIcons
                color={activeSection === section.id ? colors.white : colors.primary}
                name={section.icon}
                size={20}
              />
              <Text style={[styles.actionText, activeSection === section.id && styles.actionTextActive]}>
                {section.label}
              </Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setShowDelete(true)} style={styles.deleteAction}>
            <MaterialCommunityIcons color={colors.danger} name="trash-can-outline" size={20} />
            <Text style={styles.deleteText}>Delete Game</Text>
          </Pressable>
        </View>
      </DashboardCard>

      {activeSection === 'upload' ? (
        <DashboardCard title="Add Source Material" accent="orange">
          <UploadDocumentScreen game={game} />
        </DashboardCard>
      ) : null}

      {activeSection === 'topics' ? (
        <DashboardCard title="Topic Selection" accent="purple">
          <TopicSelectionScreen game={game} />
        </DashboardCard>
      ) : null}

      {activeSection === 'blueprint' ? (
        <DashboardCard title="Blueprint Draft" accent="cyan">
          <BlueprintScreen game={game} />
        </DashboardCard>
      ) : null}

      {activeSection === 'levels' ? (
        <DashboardCard title="Level Generation" accent="orange">
          <LevelGenerationScreen game={game} />
        </DashboardCard>
      ) : null}

      {activeSection === 'publish' ? (
        <DashboardCard title="Preview & Publish" accent="purple">
          <PublishGameScreen game={game} onGameChange={onGameChange} />
        </DashboardCard>
      ) : null}

      <Modal animationType="fade" transparent visible={showDelete}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete game?</Text>
            <Text style={styles.description}>This will permanently remove "{game.title}" from your creator workspace.</Text>
            <View style={styles.modalActions}>
              <SecondaryButton disabled={isDeleting} label="Cancel" onPress={() => setShowDelete(false)} />
              <PrimaryButton disabled={isDeleting} label={isDeleting ? 'Deleting...' : 'Delete Game'} onPress={onDelete} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  pageHeader: {
    alignItems: 'flex-start',
  },
  hero: {
    backgroundColor: '#EFE4FF',
    borderColor: '#E1D1FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
  },
  description: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 900,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  workspaceCopy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: '#D8D0F8',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  actionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionText: {
    color: colors.primary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  actionTextActive: {
    color: colors.white,
  },
  deleteAction: {
    alignItems: 'center',
    borderColor: '#FCA5A5',
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.white,
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
