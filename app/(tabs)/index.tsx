import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, pillars, typography, spacing } from '../../src/constants';
import { Joystick } from '../../src/components/joystick';
import { useLogStore } from '../../src/stores/logStore';
import { LogHistoryItem } from '../../src/components/ui';
import type { Log } from '../../src/database/types';

export default function HomeScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const getTodayLogs = useLogStore((state) => state.getTodayLogs);
  const todayLogs = useLogStore((state) => state.todayLogs);

  useEffect(() => {
    getTodayLogs();
  }, [getTodayLogs]);

  // Using empty callback since Joystick internally uses useSwipeLog
  const handleSwipe = () => {};

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={todayLogs}
        keyExtractor={(item: Log) => item.id}
        renderItem={({ item }: { item: Log }) => <LogHistoryItem log={item} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Hayat</Text>
              <Text style={styles.date}>{today}</Text>
              <Text style={styles.actionCount}>
                {todayLogs.length} action{todayLogs.length !== 1 ? 's' : ''} today
              </Text>
            </View>

            <View style={styles.triangleContainer}>
              {/* Afterlife — top center */}
              <View style={styles.topRow}>
                <Joystick pillarId={pillars[0].id} onSwipe={handleSwipe} />
              </View>

              {/* Self & Others — bottom row */}
              <View style={styles.bottomRow}>
                <Joystick pillarId={pillars[1].id} onSwipe={handleSwipe} />
                <Joystick pillarId={pillars[2].id} onSwipe={handleSwipe} />
              </View>
            </View>

            {todayLogs.length > 0 && (
              <Text style={styles.logListTitle}>Today's Activity</Text>
            )}
          </>
        }
        ListEmptyComponent={null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.hero,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  date: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  actionCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  triangleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxxl,
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  topRow: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
  },
  logListTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
});
