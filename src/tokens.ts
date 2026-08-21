// Design tokens from the handoff. Single source of truth for color, so
// components reference names rather than raw hex.

export const C = {
  ink: '#1A3260',
  ink2: '#5B6B85',
  muted: '#6B7686',
  paper: '#FFFDF8',
  surface: '#ffffff',
  workspace: '#EFEAE1',
  borderLight: '#EDEAE0',
  borderCard: '#E3DDCE',
  track: '#F1EFE7',
  trackHover: '#E7E3D6',
  teal: '#3FA6A0',
  tealDeep: '#2C7873',
  tealTint: '#E1F3F1',
  tealInk: '#215E5A',
  orange: '#E4572E',
  green: '#72C93A',
  greenHover: '#5CAF2A',
  greenShadow: '#4F8F22',
  greenDashed: '#C7D9C3',
  greenSurface: '#F6FBF3',
  amber: '#FDEFD9',
  amberBorder: '#F0AC3D',
  amberInk: '#7A4E14',
  amberInk2: '#8A5A19',
  danger: '#C25450',
  dotted: '#C9C3B4',
  placeholderInk: '#8C8676',
  cutGuide: '#A9A292',
  blankSurface: '#FBF9F4',
  blankBorder: '#E2DDCE',
  sheetBg: '#FBF7ED',
} as const;

/** The 8-color category / word-wall palette. */
export const RAINBOW = [
  '#E4572E',
  '#F0AC3D',
  '#72C93A',
  '#3FA6A0',
  '#4C6FD6',
  '#8B5FBF',
  '#D6488F',
  '#2FA8D5',
];

export const DISPLAY = "'Baloo 2', sans-serif";
export const BODY = "'Nunito', sans-serif";
