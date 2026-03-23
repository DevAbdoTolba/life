import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLogStore } from '../../stores/logStore';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

interface NoteEntryModalProps {
  logId: string | null;
  onClose: () => void;
}

export function NoteEntryModal({ logId, onClose }: NoteEntryModalProps) {
  const updateLogNote = useLogStore((state) => state.updateLogNote);
  const [note, setNote] = useState('');

  // Reset note text when modal opens with a new logId
  useEffect(() => {
    if (logId) {
      setNote('');
    }
  }, [logId]);

  const handleSave = async () => {
    if (logId && note.trim()) {
      await updateLogNote(logId, note.trim());
    }
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={!!logId}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={handleSkip}
        />
        <View style={styles.card}>
          <Text style={styles.title}>Add a note?</Text>
          <Text style={styles.subtitle}>Optional — tap Skip to continue without a note</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="What were you thinking..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={280}
            autoFocus
            textAlignVertical="top"
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, !note.trim() && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!note.trim()}
            >
              <Text style={styles.saveText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    minHeight: 80,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  saveButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveText: {
    fontFamily: typography.fontFamily.bold,
    color: '#000',
    fontSize: typography.sizes.md,
  },
});
