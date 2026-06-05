import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DocumentRecord, listDocuments, uploadDocument } from '../../api/documents';
import { Game } from '../../api/games';
import { PrimaryButton } from '../../components/PrimaryButton';
import { RewardBadge } from '../../components/RewardBadge';
import { useAuth } from '../../store/auth';
import { colors, radius, spacing, typography } from '../../theme/tokens';

type UploadDocumentScreenProps = {
  game: Game;
};

const supportedExtensions = ['.pdf', '.docx', '.pptx'];

export function UploadDocumentScreen({ game }: UploadDocumentScreenProps) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'uploading' | 'processed' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }
    listDocuments(token, game.id)
      .then(setDocuments)
      .catch((documentError) => setError(getErrorMessage(documentError)));
  }, [game.id, token]);

  function chooseFile() {
    if (typeof document === 'undefined') {
      setError('File picking is available in the web app.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.pptx';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }
      const extension = getExtension(file.name);
      if (!supportedExtensions.includes(extension)) {
        setError('Only PDF, DOCX, and PPTX files are supported.');
        setStatus('failed');
        return;
      }
      setSelectedFile(file);
      setStatus('ready');
      setError(null);
    };
    input.click();
  }

  async function submitUpload() {
    if (!token || !selectedFile) {
      return;
    }

    setStatus('uploading');
    setError(null);
    try {
      const result = await uploadDocument(token, game.id, selectedFile);
      setDocuments((current) => [result, ...current]);
      setStatus(result.status === 'processed' ? 'processed' : 'failed');
      if (result.error_message) {
        setError(result.error_message);
      }
    } catch (uploadError) {
      setStatus('failed');
      setError(getErrorMessage(uploadError));
    }
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Document Upload</Text>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.copy}>Upload PDF, DOCX, or PPTX source material. The backend stores the original file, extracts text, and saves chunks.</Text>
      </View>

      <Pressable onPress={chooseFile} style={styles.uploadCard}>
        <MaterialCommunityIcons name="cloud-upload-outline" color={colors.primaryLight} size={64} />
        <Text style={styles.uploadTitle}>{selectedFile ? selectedFile.name : 'Choose Learning Document'}</Text>
        <Text style={styles.copy}>Supported formats: PDF, DOCX, PPTX</Text>
      </Pressable>

      {selectedFile ? (
        <View style={styles.preview}>
          <View>
            <Text style={styles.previewTitle}>{selectedFile.name}</Text>
            <Text style={styles.meta}>{formatBytes(selectedFile.size)} / {getExtension(selectedFile.name).toUpperCase()}</Text>
          </View>
          <RewardBadge label={status} tone={status === 'failed' ? 'orange' : 'cyan'} />
        </View>
      ) : null}

      <PrimaryButton
        disabled={!selectedFile || status === 'uploading'}
        label={status === 'uploading' ? 'Uploading and Processing...' : 'Upload and Process'}
        onPress={submitUpload}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.documents}>
        <Text style={styles.sectionTitle}>Processed Documents</Text>
        {documents.length === 0 ? <Text style={styles.copy}>No documents uploaded for this game yet.</Text> : null}
        {documents.map((item) => (
          <View key={item.id} style={styles.documentRow}>
            <View style={styles.documentMain}>
              <Text style={styles.previewTitle}>{item.filename}</Text>
              <Text style={styles.meta}>
                {item.status} / {item.chunk_count} chunks / {item.extracted_text_char_count} characters
              </Text>
            </View>
            <RewardBadge label={item.file_extension.replace('.', '').toUpperCase()} tone="purple" />
          </View>
        ))}
      </View>

      <View style={styles.topicPlaceholder}>
        <Text style={styles.sectionTitle}>Detected Topics</Text>
        <Text style={styles.copy}>Topic extraction starts in Phase 4. Uploaded chunks are ready for grounded AI topic detection.</Text>
      </View>
    </View>
  );
}

function getExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
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
  copy: {
    color: colors.textSecondary,
    fontFamily: typography.family,
    fontSize: typography.body,
    lineHeight: 23,
  },
  uploadCard: {
    alignItems: 'center',
    borderColor: colors.cardBorder,
    borderRadius: radius.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 230,
    padding: spacing.xl,
  },
  uploadTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
    textAlign: 'center',
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  previewTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.body,
    fontWeight: '900',
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  error: {
    color: colors.danger,
    fontFamily: typography.family,
    fontSize: typography.helper,
    fontWeight: '800',
  },
  documents: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.family,
    fontSize: typography.subheading,
    fontWeight: '900',
  },
  documentRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  documentMain: {
    flex: 1,
  },
  topicPlaceholder: {
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.28)',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
