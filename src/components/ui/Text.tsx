import React from 'react';
import {
  Text as RNText,
  TextStyle,
  TextProps as RNTextProps,
} from 'react-native';
import { colors, typography } from '../../constants';

type TextVariant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: keyof typeof typography.fontFamily;
}

const variantStyles: Record<TextVariant, TextStyle> = {
  hero: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.hero,
    lineHeight: typography.lineHeights.hero,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.xxl,
    lineHeight: typography.lineHeights.xxl,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xl,
    lineHeight: typography.lineHeights.xl,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.lineHeights.md,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    lineHeight: typography.lineHeights.sm,
    color: colors.textSecondary,
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.xs,
    lineHeight: typography.lineHeights.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
};

export function Text({
  variant = 'body',
  color,
  align,
  weight,
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[
        variantStyles[variant],
        color ? { color } : undefined,
        align ? { textAlign: align } : undefined,
        weight ? { fontFamily: typography.fontFamily[weight] } : undefined,
        style,
      ]}
      {...props}
    />
  );
}
