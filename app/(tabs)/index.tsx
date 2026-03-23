import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, pillars, typography, spacing } from '../../src/constants';

export default function HomeScreen() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hayat</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* Triangle layout preview for joysticks */}
      <View style={styles.triangleContainer}>
        {/* Afterlife — top center */}
        <View style={styles.topRow}>
          <View style={[styles.joystickPlaceholder, { backgroundColor: pillars[0].positiveColor }]}>
            <Text style={styles.pillarEmoji}>{pillars[0].emoji}</Text>
          </View>
          <Text style={styles.pillarLabel}>{pillars[0].name}</Text>
        </View>

        {/* Self & Others — bottom row */}
        <View style={styles.bottomRow}>
          <View style={styles.pillarGroup}>
            <View style={[styles.joystickPlaceholder, { backgroundColor: pillars[1].positiveColor }]}>
              <Text style={styles.pillarEmoji}>{pillars[1].emoji}</Text>
            </View>
            <Text style={styles.pillarLabel}>{pillars[1].name}</Text>
          </View>

          <View style={styles.pillarGroup}>
            <View style={[styles.joystickPlaceholder, { backgroundColor: pillars[2].positiveColor }]}>
              <Text style={styles.pillarEmoji}>{pillars[2].emoji}</Text>
            </View>
            <Text style={styles.pillarLabel}>{pillars[2].name}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.placeholder}>Joystick interactions coming in Phase 2</Text>
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
    marginTop: spacing.xs,
  },
  triangleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxxl,
  },
  topRow: {
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  pillarGroup: {
    alignItems: 'center',
  },
  joystickPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  pillarEmoji: {
    fontSize: 28,
  },
  pillarLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  placeholder: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingBottom: spacing.xxl,
  },
});
