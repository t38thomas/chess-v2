
// ---------------------------------------------------------------------------
// PRIMITIVES (Tailwind-ish reference)
// ---------------------------------------------------------------------------
const primitives = {
    white: '#FFFFFF',
    black: '#000000',

    // Slate / Zinc (Neutral)
    slate50: '#F8F9FA',
    slate100: '#F1F5F9',
    slate200: '#E2E8F0',
    slate300: '#CBD5E1',
    slate400: '#94A3B8',
    slate500: '#64748B',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1E293B',
    slate900: '#0F172A',

    // Zinc (Darker neutrals for Dark Mode)
    zinc800: '#27272A',
    zinc900: '#18181B',
    zinc950: '#09090B',

    // Emerald (Primary Action)
    emerald400: '#34D399',
    emerald500: '#10B981',
    emerald600: '#059669',

    // Rose (Danger / Error)
    rose500: '#F43F5E',

    // Amber (Warning / Highlight)
    amber400: '#FBBF24',
};

// ---------------------------------------------------------------------------
// SEMANTIC COLORS
// ---------------------------------------------------------------------------

export const lightColors = {
    background: primitives.slate50,
    surface: primitives.white,
    surfaceHighlight: primitives.slate100,

    text: primitives.slate900,
    textSecondary: primitives.slate500,
    textInverse: primitives.white,

    border: primitives.slate200,
    borderStrong: primitives.slate300,

    primary: primitives.emerald500,
    primaryForeground: primitives.white,

    danger: primitives.rose500,
    warning: primitives.amber400,

    // Specific to Board
    boardLight: '#E2E8F0', // slate-200
    boardDark: '#64748B',  // slate-500
    boardHighlight: 'rgba(16, 185, 129, 0.4)', // emerald with opacity
    moveHint: 'rgba(0,0,0,0.1)',
};

export const darkColors: typeof lightColors = {
    background: primitives.zinc950,
    surface: primitives.zinc900,
    surfaceHighlight: primitives.zinc800,

    text: primitives.slate100,
    textSecondary: primitives.slate400,
    textInverse: primitives.zinc900,

    border: primitives.zinc800,
    borderStrong: primitives.slate700,

    primary: primitives.emerald500,
    primaryForeground: primitives.white,

    danger: primitives.rose500,
    warning: primitives.amber400,

    // Specific to Board
    boardLight: '#CBD5E1', // slate-300
    boardDark: '#475569',  // slate-600
    boardHighlight: 'rgba(16, 185, 129, 0.4)',
    moveHint: 'rgba(255,255,255,0.1)',
};

// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------
export const typography = {
    fontFamily: {
        // Rely on system fonts for zero deps
        regular: 'System',
        medium: 'System',
        bold: 'System',
        monospace: 'Courier New', // Fallback
    },
    sizes: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        display: 32,
    },
    weights: {
        regular: '400',
        medium: '500',
        bold: '700',
        heavy: '800',
    } as const,
};

// ---------------------------------------------------------------------------
// SPACING & LAYOUT
// ---------------------------------------------------------------------------
export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
};

export const radii = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

// ---------------------------------------------------------------------------
// SHADOWS & MOTION
// ---------------------------------------------------------------------------
export const shadows = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
};

export const motion = {
    duration: {
        fast: 150,
        base: 250,
        slow: 350,
    },
};
