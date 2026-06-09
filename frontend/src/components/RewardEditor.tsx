import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { RewardBadge } from './RewardBadge';

export type RewardEditorValue = {
  xp: string;
  badge: string;
  style: string;
};

type RewardEditorProps = {
  value: RewardEditorValue;
  passScore: string;
  onChange: (value: RewardEditorValue) => void;
  onPassScoreChange: (value: string) => void;
};

export function RewardEditor({ value, passScore, onChange, onPassScoreChange }: RewardEditorProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.preview}>
        <Text style={styles.eyebrow}>Reward Preview</Text>
        <Text style={styles.xp}>{Number(value.xp || 0).toLocaleString()} XP</Text>
        <View style={styles.badges}>
          <RewardBadge label={value.badge || 'Badge reward'} tone="orange" />
          <RewardBadge label={`Pass ${passScore || 70}%`} tone="cyan" />
        </View>
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.field}>
          <Text style={styles.label}>XP</Text>
          <TextInput
            inputMode="numeric"
            onChangeText={(xp) => onChange({ ...value, xp })}
            style={styles.input}
            value={value.xp}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Pass Score</Text>
          <TextInput inputMode="numeric" onChangeText={onPassScoreChange} style={styles.input} value={passScore} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Badge Name</Text>
        <TextInput onChangeText={(badge) => onChange({ ...value, badge })} style={styles.input} value={value.badge} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Reward Style</Text>
        <TextInput onChangeText={(style) => onChange({ ...value, style })} style={styles.input} value={value.style} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  preview: {
    backgroundColor: colors.backgroundSoft,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  eyebrow: {
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  xp: {
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
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  field: {
    flex: 1,
    gap: spacing.sm,
    minWidth: 220,
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
});
