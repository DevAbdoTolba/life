import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { colors, spacing } from '../../constants';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  label,
  value,
  onPress,
  rightElement,
  showChevron = false,
  destructive = false,
  isLast = false,
}: SettingsRowProps) {
  const content = (
    <View style={[styles.row, !isLast && styles.separator]}>
      <Text
        variant="body"
        weight="medium"
        color={destructive ? colors.error : colors.textPrimary}
      >
        {label}
      </Text>
      <View style={styles.right}>
        {value && (
          <Text variant="body" color={colors.textSecondary}>
            {value}
          </Text>
        )}
        {rightElement}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textMuted}
            style={styles.chevron}
          />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  separator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
});
