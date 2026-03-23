import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTargetStore } from '../../stores/targetStore';
import { getRandomCodename } from '../../constants/codenames';
import { pillars } from '../../constants/pillars';
import type { PillarId } from '../../constants/pillars';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

interface TargetFormModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TargetFormModal({ visible, onClose }: TargetFormModalProps) {
  const addTarget = useTargetStore(state => state.addTarget);
  
  const [realName, setRealName] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState<PillarId>(pillars[0].id);
  const [isMasked, setIsMasked] = useState(false);
  const [codename, setCodename] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setRealName('');
      setSelectedPillarId(pillars[0].id);
      setIsMasked(false);
      setCodename(null);
    }
  }, [visible]);

  const handleToggleMask = (value: boolean) => {
    setIsMasked(value);
    if (value) {
      setCodename(getRandomCodename());
    } else {
      setCodename(null);
    }
  };

  const handleSave = () => {
    if (!realName.trim()) return;
    
    addTarget(selectedPillarId, realName.trim(), codename);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text style={styles.title}>New Goal</Text>
          
          <Text style={styles.label}>Goal Name</Text>
          <TextInput
            style={styles.input}
            value={realName}
            onChangeText={setRealName}
            placeholder="e.g., Read 10 pages, Call mom..."
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />

          <Text style={styles.label}>Pillar</Text>
          <View style={styles.pillarRow}>
            {pillars.map(p => {
              const isSelected = selectedPillarId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.pillarChip, 
                    isSelected && { backgroundColor: p.positiveColor, borderColor: p.positiveColor }
                  ]}
                  onPress={() => setSelectedPillarId(p.id as PillarId)}
                >
                  <Text style={[
                    styles.pillarChipText,
                    isSelected && styles.pillarChipTextSelected
                  ]}>
                    {p.emoji} {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Hide with Privacy Codename?</Text>
            <Switch
              value={isMasked}
              onValueChange={handleToggleMask}
              trackColor={{ false: colors.surfaceLight, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>

          {isMasked && codename && (
            <Text style={styles.codenameText}>
              Publicly displayed as: <Text style={styles.codenameHighlight}>{codename}</Text>
            </Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.saveButton, !realName.trim() && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={!realName.trim()}
            >
              <Text style={styles.saveText}>Save Target</Text>
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
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
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
  },
  pillarRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pillarChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pillarChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  pillarChipTextSelected: {
    color: '#000',
    fontFamily: typography.fontFamily.bold,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  codenameText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  codenameHighlight: {
    color: colors.accent,
    fontFamily: typography.fontFamily.bold,
  },
  buttonRow: {
    flexDirection: 'row',
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
  cancelText: {
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
