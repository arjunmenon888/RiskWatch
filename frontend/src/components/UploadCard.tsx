import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { PrimaryButton } from './PrimaryButton';

export function UploadCard() {
  return (
    <View style={styles.card}>
      <MaterialCommunityIcons name="cloud-upload-outline" color={colors.primaryLight} size={56} />
      <Text style={styles.title}>Upload Your Learning Document</Text>
      <Text style={styles.copy}>PDF, DOCX, and PPTX are ready for AI processing.</Text>
      <PrimaryButton label="Choose File" />
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

