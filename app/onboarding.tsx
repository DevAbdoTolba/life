import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { OnboardingCarousel } from '../src/components/onboarding/OnboardingCarousel';
import { useSettingsStore } from '../src/stores/settingsStore';
import { colors } from '../src/constants';

export default function OnboardingScreen() {
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const handleComplete = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <OnboardingCarousel onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
