import { ColorSchemeName } from 'react-native';

export const theme = {
  light: {
    background: '#F7F1E8',
    card: '#FFF8F0',
    text: '#1E1A16',
    muted: '#6C5F55',
    accent: '#B45B3E',
    accentSoft: '#E6B6A3',
    border: '#E5D8C8',
    highlight: '#F9E1B5',
    danger: '#B33A3A',
  },
  dark: {
    background: '#16130F',
    card: '#221D18',
    text: '#F4EDE4',
    muted: '#C1B4A6',
    accent: '#D07C5A',
    accentSoft: '#8B4B34',
    border: '#3A3129',
    highlight: '#473627',
    danger: '#E07A7A',
  },
};

export type Theme = typeof theme.light;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
};

export function getTheme(scheme: ColorSchemeName): Theme {
  return theme[scheme ?? 'light'];
}
