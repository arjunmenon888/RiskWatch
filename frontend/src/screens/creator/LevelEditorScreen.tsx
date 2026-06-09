import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Game } from '../../api/games';
import {
  GameLevel,
  RegenerateSection,
  approveLevel,
  cloneLevel,
  deleteLevel,
  lockLevel,
  regenerateLevel,
  updateLevel,
} from '../../api/levels';
import { BranchDraft, BranchingEditor } from '../../components/BranchingEditor';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { RewardEditor } from '../../components/RewardEditor';
import { SecondaryButton } from '../../components/SecondaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type LevelEditorScreenProps = {
  game: Game;
  level: GameLevel;
  levels: GameLevel[];
  onClose: () => void;
  onLevelChange: (level: GameLevel) => void;
  onLevelClone: (level: GameLevel) => void;
  onLevelDelete: (levelId: number) => void;
};

type EditorSection = 'settings' | 'explanation' | 'scenarios' | 'questions' | 'rewards' | 'branching' | 'media' | 'sources' | 'preview';

type ScenarioDraft = {
  id: string;
  title: string;
  prompt: string;
  success_criteria: string;
};

type QuestionOptionDraft = {
  id: string;
  text: string;
};

type QuestionDraft = {
  id: string;
  prompt: string;
  xp: string;
  options: QuestionOptionDraft[];
  correct_answer: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
};

type RewardDraft = {
  xp: string;
  badge: string;
  style: string;
};

type BranchingDraft = {
  style: string;
  success_path: string;
  review_path: string;
  branches: BranchDraft[];
};

const sections: Array<{ id: EditorSection; label: string }> = [
  { id: 'settings', label: 'Settings' },
  { id: 'explanation', label: 'Explanation' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'questions', label: 'Questions' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'branching', label: 'Branching' },
  { id: 'media', label: 'Media' },
  { id: 'sources', label: 'Sources' },
  { id: 'preview', label: 'Preview' },
];

export function LevelEditorScreen({
  game,
  level,
  levels,
  onClose,
  onLevelChange,
  onLevelClone,
  onLevelDelete,
}: LevelEditorScreenProps) {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState<EditorSection>('settings');
  const [draft, setDraft] = useState(() => createDraft(level));
  const [isSaving, setSaving] = useState(false);
  const [isWorking, setWorking] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(createDraft(level));
    setDeleteArmed(false);
    setError(null);
  }, [level.id, level.updated_at]);

  const previewQuestion = draft.questions[0];
  const regenerateSection = useMemo<RegenerateSection>(() => {
    if (activeSection === 'rewards') {
      return 'reward';
    }
    if (activeSection === 'preview' || activeSection === 'media' || activeSection === 'sources') {
      return 'all';
    }
    return activeSection;
  }, [activeSection]);

  async function handleSave() {
    if (!token) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await updateLevel(token, game.id, level.id, {
        title: draft.title,
        learning_objective: draft.learningObjective,
        topic_explanation: draft.topicExplanation,
        difficulty: draft.difficulty,
        scenarios: draft.scenarios,
        questions: normalizeQuestions(draft.questions),
        reward: normalizeReward(draft.reward),
        pass_score: clampNumber(Number(draft.passScore) || 70, 1, 100),
        branching_suggestion: normalizeBranching(draft.branching),
        source_chunk_ids: parseSourceIds(draft.sourceChunkIds),
      });
      onLevelChange(saved);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const saved = await updateLevel(token, game.id, level.id, {
        title: draft.title,
        learning_objective: draft.learningObjective,
        topic_explanation: draft.topicExplanation,
        difficulty: draft.difficulty,
        scenarios: draft.scenarios,
        questions: normalizeQuestions(draft.questions),
        reward: normalizeReward(draft.reward),
        pass_score: clampNumber(Number(draft.passScore) || 70, 1, 100),
        branching_suggestion: normalizeBranching(draft.branching),
        source_chunk_ids: parseSourceIds(draft.sourceChunkIds),
      });
      const approved = await approveLevel(token, game.id, saved.id);
      onLevelChange(approved);
    } catch (approvalError) {
      setError(getErrorMessage(approvalError));
    } finally {
      setWorking(false);
    }
  }

  async function handleRegenerate() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const regenerated = await regenerateLevel(token, game.id, level.id, regenerateSection);
      onLevelChange(regenerated);
    } catch (regenerateError) {
      setError(getErrorMessage(regenerateError));
    } finally {
      setWorking(false);
    }
  }

  async function handleClone() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const cloned = await cloneLevel(token, game.id, level.id);
      onLevelClone(cloned);
    } catch (cloneError) {
      setError(getErrorMessage(cloneError));
    } finally {
      setWorking(false);
    }
  }

  async function handleLock() {
    if (!token) {
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const locked = await lockLevel(token, game.id, level.id, !level.locked_from_ai_changes);
      onLevelChange(locked);
    } catch (lockError) {
      setError(getErrorMessage(lockError));
    } finally {
      setWorking(false);
    }
  }

  async function handleDelete() {
    if (!token) {
      return;
    }
    if (!deleteArmed) {
      setDeleteArmed(true);
      return;
    }
    setWorking(true);
    setError(null);
    try {
      await deleteLevel(token, game.id, level.id);
      onLevelDelete(level.id);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setWorking(false);
    }
  }

  function updateScenario(index: number, update: Partial<ScenarioDraft>) {
    setDraft((current) => ({
      ...current,
      scenarios: current.scenarios.map((scenario, scenarioIndex) => (scenarioIndex === index ? { ...scenario, ...update } : scenario)),
    }));
  }

  function updateQuestion(index: number, update: Partial<QuestionDraft>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) => (questionIndex === index ? { ...question, ...update } : question)),
    }));
  }

  function updateOption(questionIndex: number, optionIndex: number, update: Partial<QuestionOptionDraft>) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, currentOptionIndex) => (currentOptionIndex === optionIndex ? { ...option, ...update } : option)),
            }
          : question,
      ),
    }));
  }

  function moveQuestion(questionIndex: number, direction: -1 | 1) {
    setDraft((current) => ({
      ...current,
      questions: moveItem(current.questions, questionIndex, questionIndex + direction),
    }));
  }

  function moveOption(questionIndex: number, optionIndex: number, direction: -1 | 1) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) =>
        index === questionIndex
          ? { ...question, options: moveItem(question.options, optionIndex, optionIndex + direction) }
          : question,
      ),
    }));
  }

  function addOption(questionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }
        const id = nextOptionId(question.options);
        return { ...question, options: [...question.options, { id, text: '' }] };
      }),
    }));
  }

  function removeOption(questionIndex: number, optionIndex: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question, index) => {
        if (index !== questionIndex || question.options.length <= 2) {
          return question;
        }
        const removed = question.options[optionIndex];
        const options = question.options.filter((_, currentIndex) => currentIndex !== optionIndex);
        return {
          ...question,
          options,
          correct_answer: question.correct_answer === removed.id ? options[0].id : question.correct_answer,
        };
      }),
    }));
  }

  function addScenario() {
    setDraft((current) => ({
      ...current,
      scenarios: [
        ...current.scenarios,
        {
          id: `scenario-${level.sequence_number}-${current.scenarios.length + 1}`,
          title: 'New Scenario',
          prompt: '',
          success_criteria: '',
        },
      ],
    }));
  }

  function addQuestion() {
    setDraft((current) => ({
      ...current,
      questions: [
        ...current.questions,
        {
          id: `question-${level.sequence_number}-${current.questions.length + 1}`,
          prompt: '',
          xp: '10',
          options: ['A', 'B', 'C', 'D'].map((id) => ({ id, text: '' })),
          correct_answer: 'A',
          feedback: { correct: '', incorrect: '' },
        },
      ],
    }));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Level Editor</Text>
          <Text style={styles.title}>{draft.title}</Text>
          <View style={styles.badges}>
            <RewardBadge label={level.status} tone={level.status === 'approved' ? 'cyan' : 'orange'} />
            <RewardBadge label={`Level ${level.sequence_number}`} tone="purple" />
            <RewardBadge label={level.locked_from_ai_changes ? 'AI Locked' : 'AI Editable'} tone={level.locked_from_ai_changes ? 'orange' : 'cyan'} />
          </View>
        </View>
        <SecondaryButton label="Back to Levels" onPress={onClose} />
      </View>

      <View style={styles.tabs}>
        {sections.map((section) => (
          <Pressable
            key={section.id}
            onPress={() => setActiveSection(section.id)}
            style={[styles.tab, activeSection === section.id && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeSection === section.id && styles.activeTabText]}>{section.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.panel}>
        {activeSection === 'settings' ? (
          <View style={styles.form}>
            <Field label="Title" value={draft.title} onChangeText={(title) => setDraft({ ...draft, title })} />
            <Field
              label="Learning Objective"
              value={draft.learningObjective}
              multiline
              onChangeText={(learningObjective) => setDraft({ ...draft, learningObjective })}
            />
            <View style={styles.fieldRow}>
              <View style={styles.field}>
                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.segmentRow}>
                  {['beginner', 'intermediate', 'advanced'].map((difficulty) => (
                    <Pressable
                      key={difficulty}
                      onPress={() => setDraft({ ...draft, difficulty })}
                      style={[styles.segment, draft.difficulty === difficulty && styles.activeSegment]}
                    >
                      <Text style={[styles.segmentText, draft.difficulty === difficulty && styles.activeSegmentText]}>{difficulty}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <Field
                label="Pass Score"
                value={draft.passScore}
                inputMode="numeric"
                onChangeText={(passScore) => setDraft({ ...draft, passScore })}
              />
            </View>
          </View>
        ) : null}

        {activeSection === 'explanation' ? (
          <Field
            label="Topic Explanation"
            value={draft.topicExplanation}
            multiline
            tall
            onChangeText={(topicExplanation) => setDraft({ ...draft, topicExplanation })}
          />
        ) : null}

        {activeSection === 'scenarios' ? (
          <View style={styles.form}>
            {draft.scenarios.map((scenario, index) => (
              <View key={`${scenario.id}-${index}`} style={styles.editorBlock}>
                <View style={styles.blockTop}>
                  <Text style={styles.blockTitle}>Scenario {index + 1}</Text>
                  <Pressable
                    onPress={() => setDraft({ ...draft, scenarios: draft.scenarios.filter((_, scenarioIndex) => scenarioIndex !== index) })}
                    style={styles.textAction}
                  >
                    <Text style={styles.textActionLabel}>Remove</Text>
                  </Pressable>
                </View>
                <Field label="Title" value={scenario.title} onChangeText={(title) => updateScenario(index, { title })} />
                <Field label="Prompt" value={scenario.prompt} multiline onChangeText={(prompt) => updateScenario(index, { prompt })} />
                <Field
                  label="Success Criteria"
                  value={scenario.success_criteria}
                  multiline
                  onChangeText={(success_criteria) => updateScenario(index, { success_criteria })}
                />
              </View>
            ))}
            <SecondaryButton label="Add Scenario" onPress={addScenario} />
          </View>
        ) : null}

        {activeSection === 'questions' ? (
          <View style={styles.form}>
            {draft.questions.map((question, questionIndex) => (
              <View key={`${question.id}-${questionIndex}`} style={styles.editorBlock}>
                <View style={styles.blockTop}>
                  <Text style={styles.blockTitle}>Question {questionIndex + 1}</Text>
                  <View style={styles.inlineActions}>
                    <SmallAction disabled={questionIndex === 0} label="Move Up" onPress={() => moveQuestion(questionIndex, -1)} />
                    <SmallAction
                      disabled={questionIndex === draft.questions.length - 1}
                      label="Move Down"
                      onPress={() => moveQuestion(questionIndex, 1)}
                    />
                    <SmallAction
                      danger
                      label="Remove"
                      onPress={() => setDraft({ ...draft, questions: draft.questions.filter((_, index) => index !== questionIndex) })}
                    />
                  </View>
                </View>
                <View style={styles.fieldRow}>
                  <Field label="Prompt" value={question.prompt} multiline onChangeText={(prompt) => updateQuestion(questionIndex, { prompt })} />
                  <Field
                    label="Question XP"
                    value={question.xp}
                    inputMode="numeric"
                    onChangeText={(xp) => updateQuestion(questionIndex, { xp })}
                  />
                </View>
                <View style={styles.optionGrid}>
                  {question.options.map((option, optionIndex) => (
                    <View key={`${option.id}-${optionIndex}`} style={styles.optionPanel}>
                      <Field label={`Option ${option.id}`} value={option.text} onChangeText={(text) => updateOption(questionIndex, optionIndex, { text })} />
                      <View style={styles.inlineActions}>
                        <SmallAction disabled={optionIndex === 0} label="Up" onPress={() => moveOption(questionIndex, optionIndex, -1)} />
                        <SmallAction
                          disabled={optionIndex === question.options.length - 1}
                          label="Down"
                          onPress={() => moveOption(questionIndex, optionIndex, 1)}
                        />
                        <SmallAction
                          danger
                          disabled={question.options.length <= 2}
                          label="Remove"
                          onPress={() => removeOption(questionIndex, optionIndex)}
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <SecondaryButton label="Add Answer" onPress={() => addOption(questionIndex)} />
                <View style={styles.field}>
                  <Text style={styles.label}>Correct Answer</Text>
                  <View style={styles.segmentRow}>
                    {question.options.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => updateQuestion(questionIndex, { correct_answer: option.id })}
                        style={[styles.segment, question.correct_answer === option.id && styles.activeSegment]}
                      >
                        <Text style={[styles.segmentText, question.correct_answer === option.id && styles.activeSegmentText]}>{option.id}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <Field
                  label="Correct Feedback"
                  value={question.feedback.correct}
                  multiline
                  onChangeText={(correct) => updateQuestion(questionIndex, { feedback: { ...question.feedback, correct } })}
                />
                <Field
                  label="Incorrect Feedback"
                  value={question.feedback.incorrect}
                  multiline
                  onChangeText={(incorrect) => updateQuestion(questionIndex, { feedback: { ...question.feedback, incorrect } })}
                />
              </View>
            ))}
            <SecondaryButton label="Add Question" onPress={addQuestion} />
          </View>
        ) : null}

        {activeSection === 'rewards' ? (
          <RewardEditor
            value={draft.reward}
            passScore={draft.passScore}
            onChange={(reward) => setDraft({ ...draft, reward })}
            onPassScoreChange={(passScore) => setDraft({ ...draft, passScore })}
          />
        ) : null}

        {activeSection === 'branching' ? (
          <BranchingEditor
            currentLevelId={level.id}
            levels={levels}
            value={draft.branching}
            onChange={(branching) => setDraft({ ...draft, branching })}
          />
        ) : null}

        {activeSection === 'media' ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.blockTitle}>Media</Text>
            <Text style={styles.copy}>Attachable media assets are planned for a later phase. This level can still be reviewed, saved, cloned, locked, and approved.</Text>
          </View>
        ) : null}

        {activeSection === 'sources' ? (
          <View style={styles.form}>
            <Field
              label="Source Chunk IDs"
              value={draft.sourceChunkIds}
              onChangeText={(sourceChunkIds) => setDraft({ ...draft, sourceChunkIds })}
            />
            <Text style={styles.copy}>Use comma-separated source chunk IDs.</Text>
          </View>
        ) : null}

        {activeSection === 'preview' ? (
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>{draft.title}</Text>
            <Text style={styles.objective}>{draft.learningObjective}</Text>
            <Text style={styles.copy}>{draft.topicExplanation}</Text>
            <View style={styles.previewQuestion}>
              <Text style={styles.blockTitle}>{previewQuestion?.prompt || 'No question prompt yet.'}</Text>
              {previewQuestion?.options.map((option) => (
                <View key={option.id} style={styles.previewOption}>
                  <Text style={styles.optionLetter}>{option.id}</Text>
                  <Text style={styles.copy}>{option.text || 'Option text'}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <PrimaryButton disabled={isSaving} label={isSaving ? 'Saving...' : 'Save Level'} onPress={handleSave} />
        <PrimaryButton disabled={isWorking} label="Approve Level" onPress={handleApprove} />
        <SecondaryButton disabled={isWorking || level.locked_from_ai_changes} label={`Regenerate ${regenerateSection}`} onPress={handleRegenerate} />
        <SecondaryButton disabled={isWorking} label="Clone Level" onPress={handleClone} />
        <SecondaryButton disabled={isWorking} label={level.locked_from_ai_changes ? 'Unlock AI Changes' : 'Lock AI Changes'} onPress={handleLock} />
        <Pressable disabled={isWorking} onPress={handleDelete} style={[styles.deleteButton, isWorking && styles.disabled]}>
          <Text style={styles.deleteText}>{deleteArmed ? 'Confirm Delete' : 'Delete Level'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  tall?: boolean;
  inputMode?: 'numeric' | 'text';
};

function Field({ label, value, onChangeText, multiline = false, tall = false, inputMode = 'text' }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        inputMode={inputMode}
        multiline={multiline || tall}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, (multiline || tall) && styles.textarea, tall && styles.tallTextarea]}
        textAlignVertical={multiline || tall ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

type SmallActionProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
};

function SmallAction({ label, onPress, disabled = false, danger = false }: SmallActionProps) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.smallAction, disabled && styles.disabled]}>
      <Text style={[styles.smallActionText, danger && styles.dangerActionText]}>{label}</Text>
    </Pressable>
  );
}

function createDraft(level: GameLevel) {
  const fallbackQuestionXp = Math.floor(Number(level.reward.xp ?? 0) / Math.max(level.questions.length, 1));
  return {
    title: level.title,
    learningObjective: level.learning_objective,
    topicExplanation: level.topic_explanation,
    difficulty: level.difficulty,
    scenarios: level.scenarios.map(toScenarioDraft),
    questions: level.questions.map((question, index) => toQuestionDraft(question, index, fallbackQuestionXp)),
    reward: toRewardDraft(level.reward),
    passScore: String(level.pass_score ?? 70),
    branching: toBranchingDraft(level.branching_suggestion),
    sourceChunkIds: level.source_chunk_ids.join(', '),
  };
}

function toScenarioDraft(value: Record<string, unknown>, index: number): ScenarioDraft {
  return {
    id: String(value.id ?? `scenario-${index + 1}`),
    title: String(value.title ?? `Scenario ${index + 1}`),
    prompt: String(value.prompt ?? ''),
    success_criteria: String(value.success_criteria ?? ''),
  };
}

function toQuestionDraft(value: Record<string, unknown>, index: number, fallbackXp: number): QuestionDraft {
  const options = Array.isArray(value.options)
    ? value.options.map((option, optionIndex) => {
        const optionRecord = option as Record<string, unknown>;
        return {
          id: String(optionRecord.id ?? String.fromCharCode(65 + optionIndex)),
          text: String(optionRecord.text ?? ''),
        };
      })
    : ['A', 'B', 'C', 'D'].map((id) => ({ id, text: '' }));
  const feedback = typeof value.feedback === 'object' && value.feedback ? (value.feedback as Record<string, unknown>) : {};
  return {
    id: String(value.id ?? `question-${index + 1}`),
    prompt: String(value.prompt ?? ''),
    xp: String(value.xp ?? fallbackXp),
    options,
    correct_answer: String(value.correct_answer ?? options[0]?.id ?? 'A'),
    feedback: {
      correct: String(feedback.correct ?? ''),
      incorrect: String(feedback.incorrect ?? ''),
    },
  };
}

function toRewardDraft(value: Record<string, unknown>): RewardDraft {
  return {
    xp: String(value.xp ?? 100),
    badge: String(value.badge ?? 'Level Badge'),
    style: String(value.style ?? 'XP + badges'),
  };
}

function toBranchingDraft(value: Record<string, unknown>): BranchingDraft {
  const branches = Array.isArray(value.branches) ? value.branches.map(toBranchDraft) : defaultBranchDrafts();
  return {
    style: String(value.style ?? 'pass/fail with review paths'),
    success_path: String(value.success_path ?? ''),
    review_path: String(value.review_path ?? ''),
    branches,
  };
}

function toBranchDraft(value: unknown, index: number): BranchDraft {
  const branch = typeof value === 'object' && value ? (value as Record<string, unknown>) : {};
  return {
    id: String(branch.id ?? `branch-${index + 1}`),
    label: String(branch.label ?? `Branch ${index + 1}`),
    condition: String(branch.condition ?? 'pass'),
    target_type: String(branch.target_type ?? 'next_level'),
    target_level_id: branch.target_level_id === null || branch.target_level_id === undefined ? '' : String(branch.target_level_id),
    min_score: branch.min_score === null || branch.min_score === undefined ? '' : String(branch.min_score),
    max_score: branch.max_score === null || branch.max_score === undefined ? '' : String(branch.max_score),
    description: String(branch.description ?? ''),
  };
}

function defaultBranchDrafts(): BranchDraft[] {
  return [
    {
      id: 'branch-pass',
      label: 'Pass path',
      condition: 'pass',
      target_type: 'next_level',
      target_level_id: '',
      min_score: '',
      max_score: '',
      description: 'Move the player to the next approved level.',
    },
    {
      id: 'branch-fail',
      label: 'Fail path',
      condition: 'fail',
      target_type: 'review_path',
      target_level_id: '',
      min_score: '',
      max_score: '',
      description: 'Send the player through review before retrying.',
    },
  ];
}

function normalizeReward(reward: RewardDraft): Record<string, unknown> {
  return {
    xp: Math.max(0, Number(reward.xp) || 0),
    badge: reward.badge,
    style: reward.style,
  };
}

function normalizeQuestions(questions: QuestionDraft[]): Array<Record<string, unknown>> {
  return questions.map((question) => ({
    ...question,
    xp: Math.max(0, Number(question.xp) || 0),
  }));
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

function nextOptionId(options: QuestionOptionDraft[]): string {
  const used = new Set(options.map((option) => option.id));
  for (let code = 65; code <= 90; code += 1) {
    const candidate = String.fromCharCode(code);
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  return `OPTION_${options.length + 1}`;
}

function normalizeBranching(branching: BranchingDraft): Record<string, unknown> {
  return {
    style: branching.style,
    success_path: branching.success_path,
    review_path: branching.review_path,
    branches: branching.branches.map((branch) => ({
      id: branch.id,
      label: branch.label,
      condition: branch.condition,
      target_type: branch.target_type,
      target_level_id: nullableNumber(branch.target_level_id),
      min_score: nullableNumber(branch.min_score),
      max_score: nullableNumber(branch.max_score),
      description: branch.description,
    })),
  };
}

function nullableNumber(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function parseSourceIds(value: string): number[] {
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 38,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  tabText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  activeTabText: {
    color: colors.white,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 220,
  },
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
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
    minHeight: 92,
  },
  tallTextarea: {
    minHeight: 260,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segment: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeSegment: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  segmentText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  activeSegmentText: {
    color: colors.background,
  },
  editorBlock: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  blockTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inlineActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  smallAction: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  smallActionText: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
  },
  dangerActionText: {
    color: colors.danger,
  },
  blockTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  textAction: {
    padding: spacing.sm,
  },
  textActionLabel: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  optionPanel: {
    flex: 1,
    minWidth: 220,
  },
  emptyPanel: {
    gap: spacing.sm,
  },
  preview: {
    gap: spacing.md,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.heading,
    fontWeight: '900',
  },
  objective: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
  previewQuestion: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  previewOption: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionLetter: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
    width: 20,
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
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.55,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
  },
});
