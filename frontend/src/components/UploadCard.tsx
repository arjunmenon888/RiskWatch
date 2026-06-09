import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { PrimaryButton } from './PrimaryButton';

type UploadCardProps = {
  onChooseFile?: () => void;
};

export function UploadCard({ onChooseFile }: UploadCardProps) {
  return (
    <View style={styles.card}>
      <MaterialCommunityIcons name="cloud-upload-outline" color={colors.primaryLight} size={56} />
      <Text style={styles.title}>Upload Your Learning Document</Text>
      <Text style={styles.copy}>Add a PDF, DOCX, or PPTX to create structured learning content.</Text>
      {onChooseFile ? <PrimaryButton label="Choose File" onPress={onChooseFile} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 250,
    padding: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '800',
    textAlign: 'center',
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    textAlign: 'center',
  },
});
