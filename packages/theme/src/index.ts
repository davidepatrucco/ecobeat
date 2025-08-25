export * from './colors';
export * from './typography';
export * from './spacing';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, borderWidth, shadow, opacity, zIndex, duration, timingFunction } from './spacing';

// Main theme object
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  borderWidth,
  shadow,
  opacity,
  zIndex,
  animation: {
    duration,
    timingFunction,
  },
} as const;

export type Theme = typeof theme;
