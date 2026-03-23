import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import type { Target, TargetStatus } from '../../database/types';
import { useTargetStore } from '../../stores/targetStore';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

interface TargetActionSheetProps {
  target: Target | null;
  visible: boolean;
  onClose: () => void;
}

export function TargetActionSheet({ target, visible, onClose }: TargetActionSheetProps) {
  const updateTargetStatus = useTargetStore(state => state.updateTargetStatus);
  const deleteTarget = useTargetStore(state => state.deleteTarget);

  if (!target) return null;

  const handleStatusChange = (status: TargetStatus) => {
    updateTargetStatus(target.id, status);
    onClose();
  };

  const handleDelete = () => {
    deleteTarget(target.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={styles.sheet}>
            <Text style={styles.title}>Update Target</Text>
            
            {target.status !== 'completed' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('completed')}>
                <Text style={[styles.actionText, { color: colors.selfPositive }]}>Mark Completed</Text>
              </TouchableOpacity>
            )}

            {target.status !== 'failed' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('failed')}>
                <Text style={[styles.actionText, { color: colors.selfNegative }]}>Mark Failed</Text>
              </TouchableOpacity>
            )}

            {target.status !== 'paused' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('paused')}>
                <Text style={[styles.actionText, { color: colors.afterlifeNegative }]}>Pause Goal</Text>
              </TouchableOpacity>
            )}

            {target.status !== 'active' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleStatusChange('active')}>
                <Text style={[styles.actionText, { color: colors.accent }]}>Resume (Active)</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionBtn} onPress={handleDelete}>
              <Text style={[styles.actionText, { color: colors.error }]}>Delete Goal</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  actionBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
});
