import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import { WelcomeSlide } from './WelcomeSlide';
import { GestureSlide } from './GestureSlide';
import { PrivacySlide } from './PrivacySlide';
import { Button } from '../ui/Button';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

type SlideComponent = React.ComponentType;

const SLIDES: SlideComponent[] = [WelcomeSlide, GestureSlide, PrivacySlide];

export function OnboardingCarousel({ onComplete }: OnboardingCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideComponent>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setActiveIndex(index);
  };

  const renderItem = ({ item: SlideComponent }: ListRenderItemInfo<SlideComponent>) => (
    <View style={{ width }}>
      <SlideComponent />
    </View>
  );

  const isLastSlide = activeIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        keyExtractor={(_, index) => String(index)}
      />

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Pagination dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Get Started button on last slide */}
        {isLastSlide && (
          <Button
            label="Get Started"
            onPress={onComplete}
            variant="primary"
            style={styles.getStartedButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.xxxl,
    right: spacing.xl,
    zIndex: 10,
  },
  skipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.accent,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.textMuted,
  },
  bottomControls: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
    alignItems: 'center',
  },
  getStartedButton: {
    width: '100%',
  },
});
