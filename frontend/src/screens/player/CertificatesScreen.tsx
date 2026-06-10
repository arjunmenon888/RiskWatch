import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Certificate, downloadCertificate, listCertificates } from '../../api/certificates';
import { DashboardCard } from '../../components/DashboardCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

export function CertificatesScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { token } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    listCertificates(token)
      .then(setCertificates)
      .catch((certificateError) => setError(getErrorMessage(certificateError)))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleDownload(certificate: Certificate) {
    if (!token) return;
    setDownloadingId(certificate.id);
    setError(null);
    try {
      await downloadCertificate(token, certificate);
    } catch (downloadError) {
      setError(getErrorMessage(downloadError));
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <View style={styles.page}>
      <View style={[styles.hero, isMobile && styles.heroMobile]}>
        <MaterialCommunityIcons color={colors.primary} name="certificate-outline" size={40} />
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Achievements</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>Your Certificates</Text>
          <Text style={styles.copy}>Certificates are issued when you complete every required path in a published game.</Text>
        </View>
      </View>

      <DashboardCard title={`${certificates.length} Certificate${certificates.length === 1 ? '' : 's'}`} accent="purple">
        {isLoading ? <Text style={styles.copy}>Loading certificates...</Text> : null}
        {!isLoading && certificates.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons color={colors.textMuted} name="medal-outline" size={34} />
            <Text style={styles.emptyTitle}>No certificates yet</Text>
            <Text style={styles.copy}>Complete a published game to earn your first certificate.</Text>
          </View>
        ) : null}
        <View style={styles.grid}>
          {certificates.map((certificate) => (
            <View key={certificate.id} style={[styles.card, isMobile && styles.cardMobile]}>
              <View style={styles.icon}>
                <MaterialCommunityIcons color={colors.white} name="certificate" size={28} />
              </View>
              <Text style={styles.gameTitle}>{certificate.game_title}</Text>
              <Text style={styles.recipient}>Awarded to {certificate.player_name}</Text>
              <Text style={styles.meta}>
                Completed {new Date(certificate.completed_at).toLocaleDateString()} / Version {certificate.version_number}
              </Text>
              <Text style={styles.number}>{certificate.certificate_number}</Text>
              <PrimaryButton
                disabled={downloadingId === certificate.id}
                label={downloadingId === certificate.id ? 'Preparing PDF...' : 'Download PDF'}
                onPress={() => handleDownload(certificate)}
              />
            </View>
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </DashboardCard>
    </View>
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#EFE4FF',
    borderColor: '#E1D1FF',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  heroMobile: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    padding: spacing.lg,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: typography.family,
    fontSize: typography.tiny,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.title,
    fontWeight: '900',
  },
  titleMobile: {
    fontSize: 25,
    lineHeight: 32,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.md,
    minWidth: 280,
    padding: spacing.lg,
  },
  cardMobile: {
    flexBasis: '100%',
    padding: spacing.md,
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  gameTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  recipient: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  number: {
    color: colors.primary,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '900',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    marginTop: spacing.md,
  },
});
