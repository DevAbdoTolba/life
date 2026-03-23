import React, { useState } from 'react';
import { Modal, StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ visible, onClose, onSuccess }: AuthModalProps) {
  const [pinAttempt, setPinAttempt] = useState('');
  const [error, setError] = useState('');
  
  const { pin, setPin, unlock } = useAuthStore();
  const isSettingPin = pin === null;

  const handleSubmit = () => {
    setError('');
    
    if (isSettingPin) {
      if (pinAttempt.length < 4) {
        setError('PIN must be at least 4 characters');
        return;
      }
      setPin(pinAttempt);
      setPinAttempt('');
      onSuccess?.();
      onClose();
    } else {
      const success = unlock(pinAttempt);
      if (success) {
        setPinAttempt('');
        onSuccess?.();
        onClose();
      } else {
        setError('Incorrect PIN');
        setPinAttempt('');
      }
    }
  };

  const handleCancel = () => {
    setPinAttempt('');
    setError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {isSettingPin ? 'Set Privacy PIN' : 'Unlock Privacy Mode'}
          </Text>
          <Text style={styles.subtitle}>
            {isSettingPin 
              ? 'Create a PIN to reveal masked targets.' 
              : 'Enter your PIN to view masked targets.'}
          </Text>

          <TextInput
            style={styles.input}
            value={pinAttempt}
            onChangeText={setPinAttempt}
            placeholder={isSettingPin ? "New PIN" : "Enter PIN"}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            keyboardType="number-pad"
            autoFocus
            maxLength={8}
            onSubmitEditing={handleSubmit}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {isSettingPin ? 'Set PIN' : 'Unlock'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.lg,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
  },
  submitButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  submitButtonText: {
    color: '#000',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
  },
});
