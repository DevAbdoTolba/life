import { useState, useEffect } from 'react';
import { Switch, Alert, Modal, View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { ScreenContainer } from '../../src/components/ui/ScreenContainer';
import { Text } from '../../src/components/ui/Text';
import { Button } from '../../src/components/ui/Button';
import { SettingsSection } from '../../src/components/settings/SettingsSection';
import { SettingsRow } from '../../src/components/settings/SettingsRow';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useLogStore } from '../../src/stores/logStore';
import { useTargetStore } from '../../src/stores/targetStore';
import { exportAllData } from '../../src/services/exportService';
import { pickBackupFile, restoreFromBackup } from '../../src/services/importService';
import { syncNotificationSchedule, requestNotificationPermission } from '../../src/services/notifications';
import { getDatabase } from '../../src/database/db';
import { colors, spacing, borderRadius } from '../../src/constants';

const DAY_NAMES = ['', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsScreen() {
  const {
    reminderEnabled,
    reminderTime,
    weeklyReviewDay,
    isPrivacyMode,
    toggleReminder,
    setReminderTime,
    setWeeklyReviewDay,
    togglePrivacyMode,
  } = useSettingsStore();

  const { setPin } = useAuthStore();

  // Local state
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [logCount, setLogCount] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeInput, setTimeInput] = useState(reminderTime);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');

  // Load log count on mount
  useEffect(() => {
    (async () => {
      try {
        const db = getDatabase();
        const result = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM logs'
        );
        setLogCount(result?.count ?? 0);
      } catch {
        setLogCount(0);
      }
    })();
  }, []);

  // Reminders
  const handleReminderToggle = async (value: boolean) => {
    if (value) {
      // Enabling: request permission first
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device Settings to use reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    toggleReminder();
    await syncNotificationSchedule(!reminderEnabled, reminderTime, weeklyReviewDay);
  };

  const handleSaveTime = async () => {
    const trimmed = timeInput.trim();
    // Validate HH:mm format
    if (!/^\d{2}:\d{2}$/.test(trimmed)) {
      Alert.alert('Invalid format', 'Please enter time in HH:mm format (e.g. 21:00)');
      return;
    }
    setReminderTime(trimmed);
    setShowTimePicker(false);
    if (reminderEnabled) {
      await syncNotificationSchedule(reminderEnabled, trimmed, weeklyReviewDay);
    }
  };

  const handleCycleDay = async () => {
    const nextDay = weeklyReviewDay >= 7 ? 1 : weeklyReviewDay + 1;
    setWeeklyReviewDay(nextDay);
    if (reminderEnabled) {
      await syncNotificationSchedule(reminderEnabled, reminderTime, nextDay);
    }
  };

  // Privacy
  const handleSavePin = () => {
    if (pinInput.length < 4) {
      Alert.alert('PIN too short', 'PIN must be at least 4 digits.');
      return;
    }
    setPin(pinInput);
    setPinInput('');
    setShowPinModal(false);
    Alert.alert('PIN updated', 'Your PIN has been saved.');
  };

  // Data
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAllData();
    } catch (err: any) {
      Alert.alert('Export failed', err?.message ?? 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const summary = await pickBackupFile();
      if (!summary) {
        setIsImporting(false);
        return;
      }

      const oldestStr = summary.oldestLog
        ? new Date(summary.oldestLog).toLocaleDateString()
        : 'N/A';
      const newestStr = summary.newestLog
        ? new Date(summary.newestLog).toLocaleDateString()
        : 'N/A';

      Alert.alert(
        'Restore Backup?',
        `Import ${summary.logCount} logs and ${summary.targetCount} targets from ${oldestStr} to ${newestStr}?\n\nThis will replace all existing data and cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreFromBackup(summary.rawData);
                // Refresh stores
                await useLogStore.getState().getTodayLogs();
                await useTargetStore.getState().loadTargets();
                // Refresh log count
                const db = getDatabase();
                const result = await db.getFirstAsync<{ count: number }>(
                  'SELECT COUNT(*) as count FROM logs'
                );
                setLogCount(result?.count ?? 0);
                Alert.alert('Import complete', 'Your data has been restored successfully.');
              } catch (err: any) {
                Alert.alert('Import failed', err?.message ?? 'Unknown error during restore');
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import failed', err?.message ?? 'Could not read backup file');
      setIsImporting(false);
    }
  };

  return (
    <ScreenContainer scrollable padded>
      {/* Reminders Section */}
      <SettingsSection title="Reminders">
        <SettingsRow
          label="Daily Check-in"
          rightElement={
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          }
        />
        <SettingsRow
          label="Reminder Time"
          value={reminderTime}
          onPress={() => {
            setTimeInput(reminderTime);
            setShowTimePicker(true);
          }}
          showChevron
        />
        <SettingsRow
          label="Weekly Review Day"
          value={DAY_NAMES[weeklyReviewDay]}
          onPress={handleCycleDay}
          showChevron
          isLast
        />
      </SettingsSection>

      {/* Privacy Section */}
      <SettingsSection title="Privacy">
        <SettingsRow
          label="Privacy Mode"
          rightElement={
            <Switch
              value={isPrivacyMode}
              onValueChange={togglePrivacyMode}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          }
        />
        <SettingsRow
          label="Change PIN"
          onPress={() => {
            setPinInput('');
            setShowPinModal(true);
          }}
          showChevron
          isLast
        />
      </SettingsSection>

      {/* Data Section */}
      <SettingsSection title="Data">
        <SettingsRow
          label="Total Logs"
          value={logCount !== null ? String(logCount) : '...'}
        />
        <SettingsRow
          label="Export Backup"
          onPress={isExporting ? undefined : handleExport}
          rightElement={
            isExporting
              ? <ActivityIndicator size="small" color={colors.accent} />
              : undefined
          }
          showChevron={!isExporting}
        />
        <SettingsRow
          label="Import Backup"
          onPress={handleImport}
          showChevron
          isLast
        />
      </SettingsSection>

      {/* About Section */}
      <SettingsSection title="About">
        <SettingsRow
          label="Version"
          value={Constants.expoConfig?.version ?? '1.0.0'}
        />
        <SettingsRow
          label="Hayat"
          value="Life Balance Tracker"
          isLast
        />
      </SettingsSection>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text variant="subtitle" style={styles.modalTitle}>Reminder Time</Text>
            <Text variant="caption" style={styles.modalHint}>Enter time in HH:mm format</Text>
            <TextInput
              style={styles.input}
              value={timeInput}
              onChangeText={setTimeInput}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              placeholder="HH:mm"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                onPress={() => setShowTimePicker(false)}
                variant="ghost"
                size="md"
                style={styles.modalButton}
              />
              <Button
                label="Save"
                onPress={handleSaveTime}
                variant="primary"
                size="md"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text variant="subtitle" style={styles.modalTitle}>Change PIN</Text>
            <Text variant="caption" style={styles.modalHint}>Enter a new 4-6 digit PIN</Text>
            <TextInput
              style={styles.input}
              value={pinInput}
              onChangeText={setPinInput}
              secureTextEntry
              maxLength={6}
              keyboardType="number-pad"
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                onPress={() => setShowPinModal(false)}
                variant="ghost"
                size="md"
                style={styles.modalButton}
              />
              <Button
                label="Save"
                onPress={handleSavePin}
                variant="primary"
                size="md"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    marginBottom: spacing.xs,
  },
  modalHint: {
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    color: colors.textPrimary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  modalButton: {
    flex: 1,
  },
});
