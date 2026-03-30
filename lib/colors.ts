// Re-export Tailwind design tokens for use in style props (where className isn't available)
export const colors = {
  primary: '#3B8EAD',
  primaryDark: '#2A6F8A',
  primaryLight: '#E6F2F7',
  coral: '#D46B5A',
  accent: '#C4983B',
  accentLight: '#F5EDD6',
  offwhite: '#F8F8F8',
  charcoal: '#2C2C2C',
  white: '#FFFFFF',
  gray100: '#F2F2F2',
  gray200: '#E0E0E0',
  gray400: '#A0A0A0',
  gray600: '#6B6B6B',
  success: '#2D7A4F',
  warning: '#D4922A',
  error: '#C0392B',
} as const;
