import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { spacing } from '../../constants';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.container}>
      <Text variant="label" style={styles.header}>{title}</Text>
      <Card>{children}</Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
});
