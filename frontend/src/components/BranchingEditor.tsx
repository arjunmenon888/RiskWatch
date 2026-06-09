import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GameLevel } from '../api/levels';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { SecondaryButton } from './SecondaryButton';

export type BranchDraft = {
  id: string;
  label: string;
  condition: string;
  target_type: string;
  target_level_id: string;
  min_score: string;
  max_score: string;
  description: string;
};

export type BranchingEditorValue = {
  style: string;
  success_path: string;
  review_path: string;
  branches: BranchDraft[];
};

type BranchingEditorProps = {
  currentLevelId: number;
  levels: GameLevel[];
  value: BranchingEditorValue;
  onChange: (value: BranchingEditorValue) => void;
};

const conditionOptions = ['pass', 'fail', 'high_score', 'low_score', 'review'];
const targetOptions = ['next_level', 'retry_current', 'review_path', 'end_game'];

export function BranchingEditor({ currentLevelId, levels, value, onChange }: BranchingEditorProps) {
  function updateBranch(index: number, update: Partial<BranchDraft>) {
    onChange({
      ...value,
      branches: value.branches.map((branch, branchIndex) => (branchIndex === index ? { ...branch, ...update } : branch)),
    });
  }

  function addBranch() {
    onChange({
      ...value,
      branches: [
        ...value.branches,
        {
          id: `branch-${Date.now()}`,
          label: 'New Branch',
          condition: 'pass',
          target_type: 'next_level',
          target_level_id: '',
          min_score: '',
          max_score: '',
          description: '',
        },
      ],
    });
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Text style={styles.label}>Branching Style</Text>
        <TextInput
          onChangeText={(style) => onChange({ ...value, style })}
          style={styles.input}
          value={value.style}
        />
      </View>

      <View style={styles.flow}>
        {levels.map((level) => (
          <View key={level.id} style={[styles.flowNode, level.id === currentLevelId && styles.activeNode]}>
            <Text style={styles.nodeTitle}>Level {level.sequence_number}</Text>
            <Text style={styles.nodeCopy}>{level.title}</Text>
          </View>
        ))}
      </View>

      {value.branches.map((branch, index) => (
        <View key={`${branch.id}-${index}`} style={styles.branchCard}>
          <View style={styles.branchTop}>
            <Text style={styles.branchTitle}>Branch {index + 1}</Text>
            <Pressable
              onPress={() => onChange({ ...value, branches: value.branches.filter((_, branchIndex) => branchIndex !== index) })}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Label</Text>
            <TextInput onChangeText={(label) => updateBranch(index, { label })} style={styles.input} value={branch.label} />
          </View>

          <View style={styles.optionBlock}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.segmentRow}>
              {conditionOptions.map((condition) => (
                <Pressable
                  key={condition}
                  onPress={() => updateBranch(index, { condition })}
                  style={[styles.segment, branch.condition === condition && styles.activeSegment]}
                >
                  <Text style={[styles.segmentText, branch.condition === condition && styles.activeSegmentText]}>{condition.replace('_', ' ')}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.optionBlock}>
            <Text style={styles.label}>Target</Text>
            <View style={styles.segmentRow}>
              {targetOptions.map((target) => (
                <Pressable
                  key={target}
                  onPress={() => updateBranch(index, { target_type: target })}
                  style={[styles.segment, branch.target_type === target && styles.activeSegment]}
                >
                  <Text style={[styles.segmentText, branch.target_type === target && styles.activeSegmentText]}>{target.replace('_', ' ')}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Target Level ID</Text>
              <TextInput
                inputMode="numeric"
                onChangeText={(target_level_id) => updateBranch(index, { target_level_id })}
                placeholder="auto"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={branch.target_level_id}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Minimum Score</Text>
              <TextInput
                inputMode="numeric"
                onChangeText={(min_score) => updateBranch(index, { min_score })}
                placeholder="none"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={branch.min_score}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Maximum Score</Text>
              <TextInput
                inputMode="numeric"
                onChangeText={(max_score) => updateBranch(index, { max_score })}
                placeholder="none"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={branch.max_score}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              multiline
              onChangeText={(description) => updateBranch(index, { description })}
              style={[styles.input, styles.textarea]}
              textAlignVertical="top"
              value={branch.description}
            />
          </View>
        </View>
      ))}

      <SecondaryButton label="Add Branch" onPress={addBranch} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  flow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  flowNode: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 180,
    padding: spacing.md,
  },
  activeNode: {
    borderColor: colors.cyan,
  },
  nodeTitle: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  nodeCopy: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  branchCard: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  branchTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  branchTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  removeButton: {
    padding: spacing.sm,
  },
  removeText: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
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
  optionBlock: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  input: {
    backgroundColor: colors.surface,
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
    minHeight: 82,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  segment: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 38,
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
});
