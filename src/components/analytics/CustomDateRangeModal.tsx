import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import DatePicker from 'react-native-date-picker';
import { colors } from '../../constants/colors';
import { spacing, typography, borderRadius } from '../../constants/theme';
import type { DateRange } from '../../types/analytics';

interface CustomDateRangeModalProps {
  visible: boolean;
  defaultStart: Date;
  defaultEnd: Date;
  onConfirm: (range: DateRange) => void;
  onClose: () => void;
}

export function CustomDateRangeModal({
  visible,
  defaultStart,
  defaultEnd,
  onConfirm,
  onClose,
}: CustomDateRangeModalProps) {
  const [step, setStep] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<Date>(defaultStart);
  const [tempEnd, setTempEnd] = useState<Date>(defaultEnd);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('start');
      setTempStart(defaultStart);
      setTempEnd(defaultEnd);
    }
  }, [visible]);

  const handleNext = () => {
    setStep('end');
  };

  const handleBack = () => {
    setStep('start');
  };

  const handleConfirm = () => {
    onConfirm({ start: tempStart.toISOString(), end: tempEnd.toISOString() });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header row */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'start' ? 'Select Start Date' : 'Select End Date'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {(['start', 'end'] as const).map((s) => {
              const isActive = step === s;
              return (
                <View key={s} style={styles.stepItem}>
                  <Text style={[styles.stepLabel, isActive ? styles.stepLabelActive : styles.stepLabelInactive]}>
                    {s === 'start' ? 'Start' : 'End'}
                  </Text>
                  <View style={[styles.stepDot, isActive ? styles.stepDotActive : styles.stepDotInactive]} />
                </View>
              );
            })}
          </View>

          {/* Inline DatePicker */}
          <DatePicker
            date={step === 'start' ? tempStart : tempEnd}
            onDateChange={(d) => step === 'start' ? setTempStart(d) : setTempEnd(d)}
            mode="date"
            theme="dark"
            minimumDate={step === 'end' ? tempStart : undefined}
          />

          {/* Action button row */}
          <View style={styles.buttonRow}>
            {step === 'end' ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, step === 'end' ? styles.primaryButtonFlex : styles.primaryButtonFull]}
              onPress={step === 'start' ? handleNext : handleConfirm}
            >
              <Text style={styles.primaryButtonText}>
                {step === 'start' ? 'Next' : 'Confirm'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginVertical: spacing.md,
  },
  stepItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.bold,
  },
  stepLabelActive: {
    color: colors.textPrimary,
  },
  stepLabelInactive: {
    color: colors.textSecondary,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    backgroundColor: colors.accent,
  },
  stepDotInactive: {
    backgroundColor: colors.surfaceLight,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  primaryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonFlex: {
    flex: 1,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.md,
    color: '#000000',
  },
});
