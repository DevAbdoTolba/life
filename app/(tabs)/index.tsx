import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, pillars, typography, spacing } from '../../src/constants';
import { Joystick } from '../../src/components/joystick';
import { useLogStore } from '../../src/stores/logStore';
import { LogHistoryItem } from '../../src/components/ui';
import type { Log } from '../../src/database/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function ListHeader() {
  const todayLogs = useLogStore((state) => state.todayLogs);
  const handleSwipe = () => {};

  return (
    <View style={styles.headerSection}>
      {/* Compact header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hayat</Text>
        <Text style={styles.actionCount}>
          {todayLogs.length} action{todayLogs.length !== 1 ? 's' : ''} today
        </Text>
      </View>

      {/* Joystick triangle — tighter grouping for more fan space */}
      <View style={styles.triangleContainer}>
        <View style={styles.topRow}>
          <Joystick pillarId={pillars[0].id} onSwipe={handleSwipe} />
        </View>
        <View style={styles.bottomRow}>
          <Joystick pillarId={pillars[1].id} onSwipe={handleSwipe} />
          <Joystick pillarId={pillars[2].id} onSwipe={handleSwipe} />
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const getTodayLogs = useLogStore((state) => state.getTodayLogs);
  const todayLogs = useLogStore((state) => state.todayLogs);

  useEffect(() => {
    getTodayLogs();
  }, [getTodayLogs]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={todayLogs}
        keyExtractor={(item: Log) => item.id}
        renderItem={({ item }: { item: Log }) => <LogHistoryItem log={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  headerSection: {
    minHeight: SCREEN_HEIGHT * 0.92,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.hero,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  actionCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  triangleContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.lg,
  },
  topRow: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '65%',
  },
  emptyState: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
