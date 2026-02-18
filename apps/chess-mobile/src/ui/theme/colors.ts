// ---------------------------------------------------------------------------
// PRIMITIVES
// ---------------------------------------------------------------------------
const primitives = {
    white: '#FFFFFF',
    black: '#000000',

    // Neutral (Dark Theme base)
    neutral950: '#0C0D10',
    neutral900: '#141519',
    neutral850: '#1C1D24',
    neutral800: '#252630',
    neutral750: '#2E303C',
    neutral700: '#3A3C4A',

    // Neutral (Text / Light Theme base)
    neutral400: '#5A6175',
    neutral300: '#8B92A5',
    neutral200: '#B0B7C9',
    neutral100: '#D4D9E6',
    neutral50: '#EAEDF3',

    // Light theme backgrounds
    light50: '#F5F6FA',
    light100: '#ECEEF4',

    // Indigo (Primary)
    indigo600: '#5B4BD5',
    indigo500: '#6C5CE7',
    indigo400: '#8B7CF0',

    // Teal (Secondary)
    teal500: '#00CEC9',

    // Semantic
    green500: '#00B894',
    yellow400: '#FDCB6E',
    orange500: '#E17055',
    red500: '#D63031',

    // Board
    boardLight: '#B8C0D0',
    boardDark: '#4A5068',

    // Light theme board
    boardLightThemeLight: '#DDE1EC',
    boardLightThemeDark: '#8892AB',
};

// ---------------------------------------------------------------------------
// SEMANTIC COLORS — DARK THEME (primary)
// ---------------------------------------------------------------------------
export const darkColors = {
    // Backgrounds
    bg0: primitives.neutral950,
    bg1: primitives.neutral900,
    bg2: primitives.neutral850,
    bgOverlay: 'rgba(0,0,0,0.75)',

    // Surfaces
    surface: primitives.neutral850,
    surfaceHover: primitives.neutral800,
    surfaceActive: primitives.neutral750,

    // Legacy aliases (for backwards compat during migration)
    background: primitives.neutral950,
    surfaceHighlight: primitives.neutral800,

    // Text
    text: primitives.neutral50,
    textPrimary: primitives.neutral50,
    textSecondary: primitives.neutral300,
    textMuted: primitives.neutral400,
    textInverse: primitives.neutral950,

    // Borders
    border: primitives.neutral850,
    borderStrong: primitives.neutral700,

    // Primary
    primary: primitives.indigo500,
    primaryLight: primitives.indigo400,
    primaryMuted: 'rgba(108,92,231,0.15)',
    primaryForeground: primitives.white,

    // Secondary
    secondary: primitives.teal500,
    secondaryMuted: 'rgba(0,206,201,0.15)',

    // Semantic
    success: primitives.green500,
    warning: primitives.yellow400,
    danger: primitives.orange500,
    error: primitives.orange500,
    errorStrong: primitives.red500,

    // Board
    boardLight: primitives.boardLight,
    boardDark: primitives.boardDark,

    // Board Highlights
    hlSelected: 'rgba(108,92,231,0.45)',
    hlLegalMove: 'rgba(108,92,231,0.25)',
    hlCapture: 'rgba(225,112,85,0.45)',
    hlLastMove: 'rgba(108,92,231,0.18)',
    hlCheck: 'rgba(214,48,49,0.50)',
    hlTarget: 'rgba(0,206,201,0.50)',

    // Legacy aliases
    boardHighlight: 'rgba(108,92,231,0.40)',
    moveHint: 'rgba(255,255,255,0.1)',
};

// ---------------------------------------------------------------------------
// SEMANTIC COLORS — LIGHT THEME
// ---------------------------------------------------------------------------
export const lightColors: typeof darkColors = {
    bg0: primitives.light50,
    bg1: primitives.white,
    bg2: primitives.light100,
    bgOverlay: 'rgba(0,0,0,0.50)',

    surface: primitives.white,
    surfaceHover: primitives.light100,
    surfaceActive: primitives.neutral100,

    background: primitives.light50,
    surfaceHighlight: primitives.light100,

    text: '#1A1C26',
    textPrimary: '#1A1C26',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    textInverse: primitives.white,

    border: primitives.neutral100,
    borderStrong: primitives.neutral200,

    primary: primitives.indigo600,
    primaryLight: primitives.indigo500,
    primaryMuted: 'rgba(91,75,213,0.12)',
    primaryForeground: primitives.white,

    secondary: primitives.teal500,
    secondaryMuted: 'rgba(0,206,201,0.12)',

    success: primitives.green500,
    warning: primitives.yellow400,
    danger: primitives.orange500,
    error: primitives.orange500,
    errorStrong: primitives.red500,

    boardLight: primitives.boardLightThemeLight,
    boardDark: primitives.boardLightThemeDark,

    hlSelected: 'rgba(91,75,213,0.40)',
    hlLegalMove: 'rgba(91,75,213,0.20)',
    hlCapture: 'rgba(225,112,85,0.40)',
    hlLastMove: 'rgba(91,75,213,0.15)',
    hlCheck: 'rgba(214,48,49,0.45)',
    hlTarget: 'rgba(0,206,201,0.45)',

    boardHighlight: 'rgba(91,75,213,0.35)',
    moveHint: 'rgba(0,0,0,0.08)',
};
