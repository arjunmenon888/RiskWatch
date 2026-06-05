import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GameDraftPayload, GameVisibility } from '../../api/games';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type CreateGameScreenProps = {
  form: GameDraftPayload;
  isSubmitting: boolean;
  onChange: (nextForm: GameDraftPayload) => void;
  onSubmit: () => void;
};

const categories = ['Safety', 'Compliance', 'Leadership', 'Operations'];
const visibilities: GameVisibility[] = ['private', 'unlisted', 'public'];

export function CreateGameScreen({ form, isSubmitting, onChange, onSubmit }: CreateGameScreenProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Create Game Draft</Text>

      <View style={styles.modeRow}>
        <ModeCard
          active={form.creation_mode === 'ai'}
          description="Upload source material later and let AI help generate editable levels."
          label="AI Mode"
          onPress={() => onChange({ ...form, creation_mode: 'ai' })}
          tone="purple"
        />
        <ModeCard
          active={form.creation_mode === 'manual'}
          description="Start with a blank draft and build the level structure by hand."
          label="Manual Mode"
          onPress={() => onChange({ ...form, creation_mode: 'manual' })}
          tone="orange"
        />
      </View>

      <View style={styles.form}>
        <TextInput
          onChangeText={(title) => onChange({ ...form, title })}
          placeholder="Game title"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={form.title}
        />
        <TextInput
          multiline
          onChangeText={(description) => onChange({ ...form, description })}
          placeholder="Description"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.textarea]}
          value={form.description}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.optionRow}>
          {categories.map((category) => (
            <Pressable
              key={category}
              onPress={() => onChange({ ...form, category })}
              style={[styles.option, form.category === category && styles.optionActive]}
            >
              <Text style={styles.optionText}>{category}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Visibility</Text>
        <View style={styles.optionRow}>
          {visibilities.map((visibility) => (
            <Pressable
              key={visibility}
              onPress={() => onChange({ ...form, visibility })}
              style={[styles.option, form.visibility === visibility && styles.optionActive]}
            >
              <Text style={styles.optionText}>{visibility}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          disabled={isSubmitting || form.title.trim().length < 3}
          label={isSubmitting ? 'Creating Draft...' : 'Create Draft'}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

function ModeCard({
  active,
  description,
  label,
  onPress,
  tone,
}: {
  active: boolean;
  description: string;
  label: string;
  onPress: () => void;
  tone: 'purple' | 'orange';
}) {
  return (
    <Pressable onPress={onPress} style={[styles.modeCard, active && styles.modeActive]}>
      <RewardBadge label={label} tone={tone} />
      <Text style={styles.modeCopy}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  modeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    minWidth: 220,
    padding: spacing.lg,
  },
  modeActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.18)',
    borderColor: colors.primaryLight,
  },
  modeCopy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  textarea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionActive: {
    backgroundColor: 'rgba(34, 211, 238, 0.14)',
    borderColor: colors.cyan,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
