import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../src/constants';
import { BodyFillCanvas } from '../src/components/physics/BodyFillCanvas';
import { useBodyFillPhysics } from '../src/components/physics/useBodyFillPhysics';
import { useLogStore } from '../src/stores';
import { getPeriodDates } from '../src/utils/periodHelpers';
import type { Log } from '../src/database/types';

/**
 * Full-screen modal for the body-fill physics visualization (VIZ-02, D-13).
 *
 * Loads this week's logs (or custom date range from route params), computes
 * canvas dimensions at a 1:2 aspect ratio (matching the 200:400 body viewBox),
 * runs Matter.js physics via useBodyFillPhysics, and renders the Skia canvas
 * with colored balls settling inside the body silhouette.
 */
export default function BodyFillScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loaded, setLoaded] = useState(false);

  const { start, end } = useLocalSearchParams<{ start?: string; end?: string }>();

  const getLogsByPeriod = useLogStore((s) => s.getLogsByPeriod);

  useEffect(() => {
    const range = start && end
      ? { start, end }
      : getPeriodDates('week');
    getLogsByPeriod(range.start, range.end)
      .then((result) => {
        setLogs(result);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  // Compute canvas size respecting the 1:2 aspect ratio of the body silhouette
  const headerHeight = insets.top + spacing.sm + 40 + spacing.lg + 20; // approx header + subtitle
  const footerHeight = insets.bottom + spacing.lg + 24; // approx bottom text
  const availableHeight = screenHeight - headerHeight - footerHeight;
  const availableWidth = screenWidth - spacing.xl * 2;

  let canvasWidth = availableWidth;
  let canvasHeight = availableHeight;

  // Maintain 1:2 aspect ratio (body is 200x400)
  if (canvasHeight > canvasWidth * 2) {
    canvasHeight = canvasWidth * 2;
  } else if (canvasWidth > canvasHeight / 2) {
    canvasWidth = canvasHeight / 2;
  }

  const { ballStates } = useBodyFillPhysics(
    logs,
    canvasWidth > 0 ? canvasWidth : 0,
    canvasHeight > 0 ? canvasHeight : 0,
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>Body Fill</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          accessibilityLabel="Close"
          accessibilityRole="button"
        >
          <Ionicons name="close" size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={styles.subtitle}>
        {start && end ? 'Custom Range Activity' : "This Week's Activity"}
      </Text>

      {/* Canvas area */}
      <View style={styles.canvasArea}>
        {loaded && logs.length > 0 && canvasWidth > 0 && canvasHeight > 0 ? (
          <BodyFillCanvas
            ballStates={ballStates}
            width={canvasWidth}
            height={canvasHeight}
          />
        ) : loaded && logs.length === 0 ? (
          <Text style={styles.emptyText}>No activity this week</Text>
        ) : null}
      </View>

      {/* Footer log count */}
      <Text style={[styles.logCount, { marginBottom: insets.bottom + spacing.lg }]}>
        {loaded
          ? `${logs.length} action${logs.length !== 1 ? 's' : ''} ${
              start && end ? 'in range' : 'this week'
            }`
          : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xs,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  canvasArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  logCount: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
