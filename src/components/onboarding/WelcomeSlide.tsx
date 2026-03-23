import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

interface PillarCardProps {
  color: string;
  name: string;
  description: string;
}

function PillarCard({ color, name, description }: PillarCardProps) {
  return (
    <View style={styles.pillarCard}>
      <View style={[styles.pillarCircle, { backgroundColor: color }]} />
      <View style={styles.pillarText}>
        <Text style={styles.pillarName}>{name}</Text>
        <Text style={styles.pillarDescription}>{description}</Text>
      </View>
    </View>
  );
}

export function WelcomeSlide() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Hayat</Text>
        <Text style={styles.subtitle}>
          Track your life balance across three pillars
        </Text>

        <View style={styles.pillarsContainer}>
          <PillarCard
            color={colors.afterlifePositive}
            name="Afterlife"
            description="Your spiritual growth"
          />
          <PillarCard
            color={colors.selfPositive}
            name="Self"
            description="Personal development"
          />
          <PillarCard
            color={colors.othersPositive}
            name="Others"
            description="Relationships & community"
          />
        </View>
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
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.hero,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pillarsContainer: {
    width: '100%',
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  pillarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pillarText: {
    flex: 1,
  },
  pillarName: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  pillarDescription: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
