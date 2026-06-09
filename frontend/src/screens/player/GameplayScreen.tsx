import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AnswerFeedback,
  CompleteAttempt,
  GameplaySession,
  PlayableGame,
  PlayableLevel,
  StartAttempt,
  completeAttempt,
  startLevelAttempt,
  submitAnswer,
} from '../../api/gameplay';
import { GameRewardSummary } from '../../api/rewards';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ProgressBar } from '../../components/ProgressBar';
import { RewardBadge } from '../../components/RewardBadge';
import { SecondaryButton } from '../../components/SecondaryButton';
import { XPBadge } from '../../components/XPBadge';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type GameplayScreenProps = {
  game: PlayableGame;
  gameRewards: GameRewardSummary;
  session: GameplaySession;
  onExit: () => void;
  onProgressChange: (session: GameplaySession) => void;
  onRewardChange: () => void;
  onShowCertificates?: () => void;
};

type Stage = 'explanation' | 'scenario' | 'questions' | 'result';

export function GameplayScreen({ game, gameRewards, session, onExit, onProgressChange, onRewardChange, onShowCertificates }: GameplayScreenProps) {
  const { token } = useAuth();
  const [level, setLevel] = useState(session.level);
  const [attempt, setAttempt] = useState<StartAttempt | null>(null);
  const [stage, setStage] = useState<Stage>('explanation');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [result, setResult] = useState<CompleteAttempt | null>(null);
  const [isWorking, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    resetForLevel(session.level);
  }, [session.level.id]);

  const question = level.questions[questionIndex];
  const progress = useMemo(() => {
    if (stage === 'explanation') {
      return 10;
    }
    if (stage === 'scenario') {
      return 25;
    }
    if (stage === 'result') {
      return 100;
    }
    return 25 + ((questionIndex + 1) / Math.max(level.questions.length, 1)) * 70;
  }, [level.questions.length, questionIndex, stage]);

  async function beginQuestions() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const started = await startLevelAttempt(token, level.id);
      setAttempt(started);
      setLevel(started.level);
      setStage('questions');
      setQuestionIndex(0);
    } catch (attemptError) {
      setError(getErrorMessage(attemptError));
    } finally {
      setWorking(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!token || !attempt || !question || !selectedAnswer) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const answerFeedback = await submitAnswer(token, attempt.attempt.id, question.id, selectedAnswer);
      setFeedback(answerFeedback);
    } catch (answerError) {
      setError(getErrorMessage(answerError));
    } finally {
      setWorking(false);
    }
  }

  async function handleContinue() {
    if (!attempt) {
      return;
    }
    if (questionIndex < level.questions.length - 1) {
      setQuestionIndex((current) => current + 1);
      setSelectedAnswer(null);
      setFeedback(null);
      return;
    }
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const completed = await completeAttempt(token, attempt.attempt.id);
      setResult(completed);
      setStage('result');
      onProgressChange({ progress: completed.progress, level });
      if (completed.reward) {
        onRewardChange();
      }
    } catch (completeError) {
      setError(getErrorMessage(completeError));
    } finally {
      setWorking(false);
    }
  }

  async function handleNextAction() {
    if (!token || !result) {
      return;
    }
    const targetLevelId = result.branch.target_level_id;
    if (!targetLevelId) {
      onExit();
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const nextAttempt = await startLevelAttempt(token, targetLevelId);
      resetForLevel(nextAttempt.level);
      setAttempt(nextAttempt);
      setStage(result.branch.action === 'next_level' ? 'explanation' : 'explanation');
      onProgressChange({ progress: result.progress, level: nextAttempt.level });
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setWorking(false);
    }
  }

  function resetForLevel(nextLevel: PlayableLevel) {
    setLevel(nextLevel);
    setAttempt(null);
    setStage('explanation');
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setResult(null);
    setError(null);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.gameHeader}>
        <View style={styles.headingWrap}>
          <Text style={styles.gameEyebrow}>{game.category}</Text>
          <Text style={styles.gameTitle}>{game.title}</Text>
          <Text style={styles.gameMeta}>
            {session.progress.completed_level_ids.length} of {game.level_count} levels completed
          </Text>
        </View>
        <XPBadge value={`${gameRewards.earned_xp.toLocaleString()} / ${gameRewards.total_available_xp.toLocaleString()}`} />
      </View>
      <ProgressBar
        value={(session.progress.completed_level_ids.length / Math.max(game.level_count, 1)) * 100}
        tone="cyan"
      />
      <View style={styles.topbar}>
        <View style={styles.headingWrap}>
          <Text style={styles.eyebrow}>Level {level.sequence_number}</Text>
          <Text style={styles.title}>{level.title}</Text>
          <View style={styles.badges}>
            <RewardBadge label={level.difficulty} tone="purple" />
            <RewardBadge label={`${level.pass_score}% to pass`} tone="cyan" />
            <RewardBadge label={`${levelAvailableXp(level)} XP`} tone="orange" />
          </View>
        </View>
        <SecondaryButton label="Exit Game" onPress={onExit} />
      </View>

      <ProgressBar value={progress} tone="purple" />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {stage === 'explanation' ? (
        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Learning Objective</Text>
          <Text style={styles.objective}>{level.learning_objective}</Text>
          <Text style={styles.sectionTitle}>Topic Explanation</Text>
          <Text style={styles.copy}>{level.topic_explanation}</Text>
          <PrimaryButton label="Continue to Scenario" onPress={() => setStage('scenario')} />
        </View>
      ) : null}

      {stage === 'scenario' ? (
        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Scenario</Text>
          {level.scenarios.map((scenario, index) => (
            <View key={String(scenario.id ?? index)} style={styles.scenarioCard}>
              <Text style={styles.sectionTitle}>{String(scenario.title ?? `Scenario ${index + 1}`)}</Text>
              <Text style={styles.copy}>{String(scenario.prompt ?? '')}</Text>
              <Text style={styles.criteria}>{String(scenario.success_criteria ?? '')}</Text>
            </View>
          ))}
          <PrimaryButton disabled={isWorking} label={isWorking ? 'Starting...' : 'Start Questions'} onPress={beginQuestions} />
        </View>
      ) : null}

      {stage === 'questions' && question ? (
        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>
            Question {questionIndex + 1} of {level.questions.length} / {question.xp} XP
          </Text>
          <Text style={styles.question}>{question.prompt}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const optionId = String(option.id ?? String.fromCharCode(65 + index));
              const isSelected = selectedAnswer === optionId;
              return (
                <Pressable
                  key={optionId}
                  disabled={Boolean(feedback)}
                  onPress={() => setSelectedAnswer(optionId)}
                  style={[styles.option, isSelected && styles.selectedOption]}
                >
                  <Text style={[styles.optionLetter, isSelected && styles.selectedOptionText]}>{optionId}</Text>
                  <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>{String(option.text ?? '')}</Text>
                </Pressable>
              );
            })}
          </View>

          {feedback ? (
            <View style={[styles.feedback, feedback.is_correct ? styles.correctFeedback : styles.incorrectFeedback]}>
              <Text style={styles.feedbackTitle}>{feedback.is_correct ? 'Correct' : 'Review this answer'}</Text>
              <Text style={styles.copy}>{String(feedback.feedback.message ?? '')}</Text>
            </View>
          ) : null}

          {feedback ? (
            <PrimaryButton
              disabled={isWorking}
              label={questionIndex < level.questions.length - 1 ? 'Next Question' : 'Finish Level'}
              onPress={handleContinue}
            />
          ) : (
            <PrimaryButton disabled={!selectedAnswer || isWorking} label={isWorking ? 'Checking...' : 'Submit Answer'} onPress={handleSubmitAnswer} />
          )}
        </View>
      ) : null}

      {stage === 'result' && result ? (
        <View style={styles.panel}>
          <Text style={styles.panelEyebrow}>Level Complete</Text>
          <Text style={styles.score}>{result.score}%</Text>
          <Text style={result.passed ? styles.passed : styles.failed}>{result.passed ? 'Passed' : 'Try Again'}</Text>
          {result.reward ? (
            <View style={styles.rewardRow}>
              <RewardBadge label={`${result.reward.xp} XP earned`} tone="orange" />
              {result.reward.badge_name ? <RewardBadge label={result.reward.badge_name} tone="cyan" /> : null}
            </View>
          ) : null}
          <View style={styles.branchPanel}>
            <Text style={styles.sectionTitle}>{result.branch.branch_label}</Text>
            <Text style={styles.copy}>{result.branch.message}</Text>
            {result.branch.target_level_title ? <Text style={styles.criteria}>Next: {result.branch.target_level_title}</Text> : null}
          </View>
          {result.certificate ? (
            <View style={styles.certificatePanel}>
              <Text style={styles.sectionTitle}>Certificate issued</Text>
              <Text style={styles.copy}>
                {result.certificate.certificate_number} is ready in your certificate library.
              </Text>
              <SecondaryButton label="View Certificates" onPress={onShowCertificates} />
            </View>
          ) : null}
          <PrimaryButton
            disabled={isWorking}
            label={result.branch.target_level_id ? (isWorking ? 'Loading...' : 'Continue') : 'Return to Dashboard'}
            onPress={handleNextAction}
          />
        </View>
      ) : null}
    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function levelAvailableXp(level: PlayableLevel): number {
  const questionXp = level.questions.reduce((total, question) => total + Math.max(0, Number(question.xp) || 0), 0);
  return questionXp > 0 ? questionXp : Math.max(0, Number(level.reward.xp) || 0);
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  gameHeader: {
    alignItems: 'center',
    backgroundColor: colors.glassStrong,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  gameEyebrow: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  gameTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  gameMeta: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
  },
  topbar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'space-between',
  },
  headingWrap: {
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.lg,
    padding: spacing.lg,
  },
  panelEyebrow: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  objective: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  scenarioCard: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  criteria: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  question: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 54,
    padding: spacing.md,
  },
  selectedOption: {
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    borderColor: colors.cyan,
  },
  optionLetter: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
    width: 24,
  },
  optionText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: typography.family,
    fontSize: typography.body,
  },
  selectedOptionText: {
    color: colors.textPrimary,
  },
  feedback: {
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  correctFeedback: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: colors.success,
  },
  incorrectFeedback: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: colors.warning,
  },
  feedbackTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  score: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: 48,
    fontWeight: '900',
  },
  passed: {
    color: colors.success,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  failed: {
    color: colors.warning,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  rewardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  branchPanel: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  certificatePanel: {
    backgroundColor: '#F2ECFF',
    borderColor: '#D9C8FF',
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
});
