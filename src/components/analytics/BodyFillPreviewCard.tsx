import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

interface BodyFillPreviewCardProps {
  logCount: number;
}

export function BodyFillPreviewCard({ logCount }: BodyFillPreviewCardProps) {
  const router = useRouter();

  return (
    <Card onPress={() => router.push('/body-fill')} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <Ionicons name="person-outline" size={40} color={colors.accent} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Body Fill</Text>
          <Text style={styles.subtitle}>{logCount} actions to visualize</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
});
