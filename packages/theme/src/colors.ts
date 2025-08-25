// Color palette inspired by nature
export const colors = {
  // Primary colors (green theme)
  primary: {
    50: '#f0fdf4',   // lightest green
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',  // main green
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',  // darkest green
  },
  
  // Secondary colors (blue theme - water)
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',  // main blue
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Accent colors (yellow theme - sun)
  accent: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',  // main yellow
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  
  // Neutral colors
  neutral: {
    0: '#ffffff',    // pure white
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',  // near black
  },
  
  // Semantic colors
  success: '#22c55e',    // primary.500
  warning: '#f59e0b',    // amber.500
  error: '#ef4444',      // red.500
  info: '#3b82f6',       // blue.500
  
  // Special colors
  background: {
    light: '#ffffff',
    dark: '#0a0a0a',
  },
  
  text: {
    primary: {
      light: '#171717',  // neutral.900
      dark: '#fafafa',   // neutral.50
    },
    secondary: {
      light: '#525252',  // neutral.600
      dark: '#a3a3a3',   // neutral.400
    },
    tertiary: {
      light: '#737373',  // neutral.500
      dark: '#737373',   // neutral.500
    },
  },
  
  border: {
    light: '#e5e5e5',   // neutral.200
    dark: '#404040',    // neutral.700
  },
} as const;

export type Colors = typeof colors;
