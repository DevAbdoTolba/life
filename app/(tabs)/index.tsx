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

  const handleSwipe = () => {};

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hayat</Text>
        <Text style={styles.actionCount}>
          {todayLogs.length} action{todayLogs.length !== 1 ? 's' : ''} today
        </Text>
      </View>

      {/* Joystick triangle — pushed to bottom of available space */}
      <View style={styles.triangleContainer}>
        <View style={styles.topRow}>
          <Joystick pillarId={pillars[0].id} onSwipe={handleSwipe} />
        </View>
        <View style={styles.bottomRow}>
          <Joystick pillarId={pillars[1].id} onSwipe={handleSwipe} />
          <Joystick pillarId={pillars[2].id} onSwipe={handleSwipe} />
        </View>
      </View>

      {/* Activity peek — one entry visible, scroll for more */}
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
    paddingBottom: spacing.xxl,
  },
  topRow: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
  },
  peekContainer: {
    maxHeight: 60,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  emptyPeek: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPeekText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
