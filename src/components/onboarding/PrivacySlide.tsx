import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

export function PrivacySlide() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Privacy Matters</Text>
        <Text style={styles.subtitle}>
          Keep your goals private with codenames
        </Text>

        <View style={styles.illustrationContainer}>
          {/* Before card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Before</Text>
            <View style={styles.goalRow}>
              <Text style={styles.goalTextNormal}>Learn Arabic</Text>
            </View>
          </View>

          {/* Arrow */}
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={24} color={colors.textMuted} />
          </View>

          {/* After card */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>After</Text>
            <View style={styles.goalRow}>
              <Ionicons
                name="lock-closed"
                size={16}
                color={colors.accent}
                style={styles.lockIcon}
              />
              <Text style={styles.goalTextCodename}>Operation Falcon</Text>
            </View>
          </View>
        </View>

        <Text style={styles.hint}>
          Toggle privacy mode in Settings
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  illustrationContainer: {
    width: '100%',
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  cardLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalTextNormal: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  lockIcon: {
    marginRight: spacing.sm,
  },
  goalTextCodename: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.accent,
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
