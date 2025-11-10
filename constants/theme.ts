/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Paleta de cores vibrante, elegante e impressionante
const tintColorLight = '#6366F1'; // Índigo vibrante principal
const tintColorDark = '#818CF8'; // Índigo claro para dark mode

export const Colors = {
  light: {
    text: '#1E293B',
    textSecondary: '#64748B',
    background: '#F8FAFF',
    backgroundGradient: ['#F8FAFF', '#F1F5F9'],
    tint: tintColorLight,
    icon: '#94A3B8',
    tabIconDefault: '#CBD5E1',
    tabIconSelected: tintColorLight,
    primary: '#1E6EEB', // Azul principal RachaJunto
    primaryLight: '#56A0FF', // Azul-claro dos gradientes
    primaryGradient: ['#1E6EEB', '#56A0FF'],
    secondary: '#8B5CF6', // Roxo
    accent: '#EC4899', // Rosa
    purple: '#A855F7', // Roxo vibrante
    pink: '#EC4899', // Rosa vibrante
    orange: '#F97316', // Laranja
    teal: '#14B8A6', // Verde-água
    cyan: '#06B6D4', // Ciano
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#10B981', // Verde esmeralda
    successLight: '#34D399',
    error: '#EF4444', // Vermelho
    errorLight: '#F87171',
    warning: '#F59E0B', // Âmbar
    shadow: 'rgba(0, 0, 0, 0.06)',
    shadowStrong: 'rgba(99, 102, 241, 0.15)',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    background: '#111827',
    backgroundGradient: ['#111827', '#1F2937'],
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    primary: '#7BA3F5',
    primaryLight: '#9BB5F8',
    primaryGradient: ['#7BA3F5', '#9BB5F8'],
    secondary: '#9BB5F5',
    accent: '#B8CDF8',
    surface: '#1F2937',
    surfaceElevated: '#374151',
    border: '#374151',
    borderLight: '#4B5563',
    success: '#34D399',
    successLight: '#6EE7B7',
    error: '#F87171',
    errorLight: '#FCA5A5',
    warning: '#FBBF24',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(123, 163, 245, 0.15)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
