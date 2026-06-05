import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type GameCardProps = {
  title: string;
  creator: string;
  progress?: number;
  tag: string;
};

export function GameCard({ title, creator, progress = 0, tag }: GameCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.imagePlate}>
        <Text style={styles.tag}>{tag}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.creator}>by {creator}</Text>
      <ProgressBar value={progress} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minWidth: 190,
    padding: spacing.md,
  },
  imagePlate: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
    height: 112,
    justifyContent: 'flex-start',
    marginBottom: spacing.md,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 211, 238, 0.18)',
    borderRadius: radius.sm,
    color: colors.cyan,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '800',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  creator: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    marginBottom: spacing.md,
  },
});

