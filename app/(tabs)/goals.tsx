import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/constants/colors';
import { typography, spacing } from '../../src/constants/theme';
import { TargetList } from '../../src/components/goals/TargetList';
import { TargetFormModal } from '../../src/components/goals/TargetFormModal';
import { TargetActionSheet } from '../../src/components/goals/TargetActionSheet';
import type { Target } from '../../src/database/types';
import { useTargetStore } from '../../src/stores/targetStore';
import { useAuthStore } from '../../src/stores/authStore';
import { AuthModal } from '../../src/components/privacy/AuthModal';

export default function GoalsScreen() {
  const { targets, loadTargets } = useTargetStore();
  const { isUnlocked, lock } = useAuthStore();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);

  useEffect(() => {
    loadTargets();
  }, [loadTargets]);

  const handlePrivacyToggle = () => {
    if (isUnlocked) {
      lock();
    } else {
      setAuthModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <TouchableOpacity style={styles.privacyButton} onPress={handlePrivacyToggle}>
          <Ionicons
            name={isUnlocked ? "eye-outline" : "eye-off-outline"}
            size={24}
            color={isUnlocked ? colors.textPrimary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TargetList
        targets={targets}
        onTargetPress={(target) => setSelectedTarget(target)}
      />

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setFormVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color={colors.background} />
      </TouchableOpacity>

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />

      <TargetFormModal 
        visible={formVisible}
        onClose={() => setFormVisible(false)}
      />

      <TargetActionSheet 
        target={selectedTarget}
        visible={!!selectedTarget}
        onClose={() => setSelectedTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  privacyButton: {
    padding: spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxxl, 
    right: spacing.xl,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
});
