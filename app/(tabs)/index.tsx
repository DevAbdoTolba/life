import React, { useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, pillars, typography, spacing } from '../../src/constants';
import { Joystick } from '../../src/components/joystick';
import { useLogStore } from '../../src/stores/logStore';
import { LogHistoryItem } from '../../src/components/ui';
import type { Log } from '../../src/database/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ENTRY_ROW_HEIGHT = 48;

function ListHeader() {
  const insets = useSafeAreaInsets();
  const todayLogs = useLogStore((state) => state.todayLogs);
  const handleSwipe = () => {};

  // Fill screen minus safe areas minus 1 entry height so exactly 1 entry peeks
  const headerHeight = SCREEN_HEIGHT - insets.top - insets.bottom - ENTRY_ROW_HEIGHT;

  return (
    <View style={[styles.headerSection, { minHeight: headerHeight }]}>
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

function SwipeableRow({ log, onDelete }: { log: Log; onDelete: (id: string) => void }) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(log.id);
  }, [log.id, onDelete]);

  const renderRightActions = useCallback(() => (
    <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  ), [handleDelete]);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
    >
      <LogHistoryItem log={log} />
    </Swipeable>
  );
}

export default function HomeScreen() {
  const getTodayLogs = useLogStore((state) => state.getTodayLogs);
  const loadMoreLogs = useLogStore((state) => state.loadMoreLogs);
  const todayLogs = useLogStore((state) => state.todayLogs);
  const hasMoreLogs = useLogStore((state) => state.hasMoreLogs);
  const isLoading = useLogStore((state) => state.isLoading);
  const deleteLog = useLogStore((state) => state.deleteLog);

  useEffect(() => {
    getTodayLogs();
  }, [getTodayLogs]);

  const handleDelete = useCallback((id: string) => {
    deleteLog(id);
  }, [deleteLog]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={todayLogs}
        keyExtractor={(item: Log) => item.id}
        renderItem={({ item }: { item: Log }) => (
          <SwipeableRow log={item} onDelete={handleDelete} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No activity yet</Text>
          </View>
        }
        ListFooterComponent={
          hasMoreLogs && todayLogs.length > 0 ? (
            <View style={styles.loadingFooter}>
              {isLoading ? <ActivityIndicator size="small" color={colors.textMuted} /> : null}
            </View>
          ) : null
        }
        onEndReached={loadMoreLogs}
        onEndReachedThreshold={0.3}
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
  loadingFooter: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    width: 100,
  },
  deleteText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: '#fff',
  },
});
