import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, pillars, typography, spacing } from '../../src/constants';
import { Joystick } from '../../src/components/joystick';
import { useLogStore } from '../../src/stores/logStore';
import { LogHistoryItem } from '../../src/components/ui';
import type { Log } from '../../src/database/types';

export default function HomeScreen() {
  const getTodayLogs = useLogStore((state) => state.getTodayLogs);
  const todayLogs = useLogStore((state) => state.todayLogs);

  useEffect(() => {
    getTodayLogs();
  }, [getTodayLogs]);

  // Using empty callback since Joystick internally uses useSwipeLog
  const handleSwipe = () => {};

  const lastLog = todayLogs.length > 0 ? todayLogs[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact header */}
        <View style={styles.header}>
          <Text style={styles.title}>Hayat</Text>
          <Text style={styles.actionCount}>
            {todayLogs.length} action{todayLogs.length !== 1 ? 's' : ''} today
          </Text>
        </View>

        {/* Joystick triangle — pushed lower */}
        <View style={styles.triangleContainer}>
          <View style={styles.topRow}>
            <Joystick pillarId={pillars[0].id} onSwipe={handleSwipe} />
          </View>
          <View style={styles.bottomRow}>
            <Joystick pillarId={pillars[1].id} onSwipe={handleSwipe} />
            <Joystick pillarId={pillars[2].id} onSwipe={handleSwipe} />
          </View>
        </View>

        {/* Last activity entry */}
        <View style={styles.activitySection}>
          {lastLog ? (
            <LogHistoryItem log={lastLog} />
          ) : (
            <View style={styles.emptyPeek}>
              <Text style={styles.emptyPeekText}>No activity yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
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
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xxxl,
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
  activitySection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  emptyPeek: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPeekText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
