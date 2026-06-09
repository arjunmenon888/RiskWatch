import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Game } from '../../api/games';
import { GamePreview, getGamePreview, publishGame, unpublishGame } from '../../api/publishing';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type PublishGameScreenProps = {
  game: Game;
  onGameChange: (game: Game) => void;
};

export function PublishGameScreen({ game, onGameChange }: PublishGameScreenProps) {
  const { token } = useAuth();
  const [preview, setPreview] = useState<GamePreview | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isWorking, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreview();
  }, [game.id, token]);

  async function loadPreview() {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setPreview(await getGamePreview(token, game.id));
    } catch (previewError) {
      setError(getErrorMessage(previewError));
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await publishGame(token, game.id);
      onGameChange({ ...game, status: 'published' });
      await loadPreview();
    } catch (publishError) {
      setError(getErrorMessage(publishError));
    } finally {
      setWorking(false);
    }
  }

  async function handleUnpublish() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await unpublishGame(token, game.id);
      onGameChange({ ...game, status: 'draft' });
      await loadPreview();
    } catch (unpublishError) {
      setError(getErrorMessage(unpublishError));
    } finally {
      setWorking(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Publish Game</Text>
          <Text style={styles.title}>{game.title}</Text>
          <Text style={styles.copy}>Publishing creates an immutable player snapshot. Draft edits remain separate until you publish a new version.</Text>
        </View>
        {preview?.active_version ? (
          <RewardBadge label={`Live v${preview.active_version.version_number}`} tone="cyan" />
        ) : (
          <RewardBadge label="Draft only" tone="orange" />
        )}
      </View>

      {isLoading ? <Text style={styles.copy}>Building preview...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {preview ? (
        <>
          <View style={styles.grid}>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Validation Checklist</Text>
              {preview.validation.checks.map((check) => (
                <View key={check.key} style={styles.checkRow}>
                  <View style={[styles.checkMark, check.passed ? styles.checkPass : styles.checkFail]}>
                    <Text style={styles.checkMarkText}>{check.passed ? 'OK' : '!'}</Text>
                  </View>
                  <View style={styles.checkCopy}>
                    <Text style={styles.checkTitle}>{check.label}</Text>
                    <Text style={styles.helper}>{check.detail}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Player Preview</Text>
              <Text style={styles.previewTitle}>{String(preview.game.title ?? game.title)}</Text>
              <Text style={styles.copy}>{String(preview.game.description ?? '')}</Text>
              <View style={styles.levelList}>
                {preview.levels.map((level) => (
                  <View key={String(level.id)} style={styles.levelRow}>
                    <Text style={styles.levelNumber}>Level {String(level.sequence_number)}</Text>
                    <View style={styles.levelCopy}>
                      <Text style={styles.checkTitle}>{String(level.title)}</Text>
                      <Text style={styles.helper}>
                        {String(level.question_count)} questions - {String(level.scenario_count)} scenarios - Pass {String(level.pass_score)}%
                      </Text>
                    </View>
                    <RewardBadge label={String(level.status)} tone={level.status === 'approved' ? 'cyan' : 'orange'} />
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <PrimaryButton
              disabled={!preview.validation.can_publish || isWorking}
              label={isWorking ? 'Publishing...' : preview.active_version ? 'Publish New Version' : 'Publish Game'}
              onPress={handlePublish}
            />
            {preview.active_version ? (
              <SecondaryButton disabled={isWorking} label="Unpublish" onPress={handleUnpublish} />
            ) : null}
            <SecondaryButton disabled={isLoading || isWorking} label="Refresh Preview" onPress={loadPreview} />
          </View>
        </>
      ) : null}
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
  headerCopy: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 260,
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
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
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
    minWidth: 300,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  checkRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  checkMark: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  checkPass: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  checkFail: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  checkMarkText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  checkCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  checkTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  helper: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  levelList: {
    gap: spacing.sm,
  },
  levelRow: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
  },
  levelNumber: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    minWidth: 58,
  },
  levelCopy: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 180,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
});
