import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import type { Target } from '../../database/types';
import { TargetCard } from './TargetCard';
import { pillars } from '../../constants/pillars';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

interface TargetListProps {
  targets: Target[];
  onTargetPress?: (target: Target) => void;
}

export function TargetList({ targets, onTargetPress }: TargetListProps) {
  const sections = useMemo(() => {
    return pillars.map(pillar => {
      const pillarTargets = targets.filter(t => t.pillarId === pillar.id);
      return {
        title: `${pillar.emoji} ${pillar.name}`,
        data: pillarTargets,
        color: pillar.positiveColor,
      };
    }).filter(section => section.data.length > 0);
  }, [targets]);

  if (targets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No goals yet. Create one!</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TargetCard target={item} onPress={onTargetPress} />
      )}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.sectionHeader, { color: section.color }]}>
          {section.title}
        </Text>
      )}
      contentContainerStyle={styles.listContent}
      stickySectionHeadersEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100, // accommodate FAB
  },
  sectionHeader: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
