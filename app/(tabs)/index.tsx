import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Region 1: Compact header (per D-08) */}
      <View style={styles.header}>
        <Text style={styles.title}>Hayat</Text>
        <Text style={styles.actionCount}>
          {todayLogs.length} action{todayLogs.length !== 1 ? 's' : ''} today
        </Text>
      </View>

      {/* Region 2: Joystick triangle — takes remaining space (per D-05) */}
      <View style={styles.triangleContainer}>
        <View style={styles.topRow}>
          <Joystick pillarId={pillars[0].id} onSwipe={handleSwipe} />
        </View>
        <View style={styles.bottomRow}>
          <Joystick pillarId={pillars[1].id} onSwipe={handleSwipe} />
          <Joystick pillarId={pillars[2].id} onSwipe={handleSwipe} />
        </View>
      </View>

      {/* Region 3: Activity list peek strip (per D-06, D-07) */}
      <View style={styles.peekContainer}>
        {todayLogs.length === 0 ? (
          <View style={styles.emptyPeek}>
            <Text style={styles.emptyPeekText}>No activity yet</Text>
          </View>
        ) : (
          <FlatList
            data={todayLogs}
            keyExtractor={(item: Log) => item.id}
            renderItem={({ item }: { item: Log }) => <LogHistoryItem log={item} />}
            scrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  // Region 1: Compact header (per D-08, UI-SPEC)
  header: {
    paddingTop: spacing.lg,       // 16px — reduced from xxl
    paddingBottom: spacing.lg,    // 16px — reduced from xxl (was spacing.xxl = 32)
    alignItems: 'center',
    gap: spacing.xs,              // 4px between title and subtitle
  },
  title: {
    fontFamily: typography.fontFamily.semibold,  // 600 SemiBold per UI-SPEC (not bold/700)
    fontSize: typography.sizes.hero,             // 36px
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  actionCount: {
    fontFamily: typography.fontFamily.regular,   // 400 Regular per UI-SPEC
    fontSize: typography.sizes.xs,               // 10px per UI-SPEC Label role
    color: colors.textMuted,
  },
  // Region 2: Joystick triangle (per D-05)
  triangleContainer: {
    flex: 1,                      // Takes remaining vertical space between header and peek
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxxl,            // 48px between top row and bottom row
  },
  topRow: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
  },
  // Region 3: Peek strip (per D-06, D-07)
  peekContainer: {
    maxHeight: 60,                // One LogHistoryItem row visible (per D-06, UI-SPEC)
    borderTopWidth: 1,
    borderTopColor: colors.border,  // #2A2A3A — visual separator
  },
  emptyPeek: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPeekText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,               // 12px
    color: colors.textMuted,                     // #555570
  },
  listContent: {
    paddingBottom: spacing.xxxl,  // 48px bottom padding for scroll overscroll
  },
});
