import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GameDraftPayload, GameVisibility } from '../../api/games';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type CreateGameScreenProps = {
  form: GameDraftPayload;
  isSubmitting: boolean;
  onChange: (nextForm: GameDraftPayload) => void;
  onSubmit: () => void;
};

const visibilities: GameVisibility[] = ['private', 'unlisted', 'public'];

export function CreateGameScreen({ form, isSubmitting, onChange, onSubmit }: CreateGameScreenProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.intro}>Create the game, add source material, review the generated content, and publish when ready.</Text>

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

        <TextInput
          maxLength={80}
          onChangeText={(category) => onChange({ ...form, category })}
          placeholder="Category"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={form.category}
        />

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
          disabled={isSubmitting || form.title.trim().length < 3 || form.category.trim().length < 2}
          label={isSubmitting ? 'Creating Draft...' : 'Create Draft'}
          onPress={onSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  intro: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
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
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.primaryLight,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});
