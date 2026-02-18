
// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------
export const typography = {
    fontFamily: {
        // Rely on system fonts for zero deps
        regular: 'System',
        medium: 'System',
        bold: 'System',
        monospace: 'Courier New',
    },
    scale: {
        display: { size: 36, lineHeight: 44, weight: '800' as const },
        h1: { size: 28, lineHeight: 36, weight: '700' as const },
        h2: { size: 22, lineHeight: 30, weight: '700' as const },
        title: { size: 18, lineHeight: 26, weight: '600' as const },
        body: { size: 15, lineHeight: 22, weight: '400' as const },
        bodyBold: { size: 15, lineHeight: 22, weight: '600' as const },
        caption: { size: 12, lineHeight: 18, weight: '500' as const },
        micro: { size: 10, lineHeight: 14, weight: '500' as const },
        mono: { size: 13, lineHeight: 20, weight: '400' as const },
    },
    // Legacy compat
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
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
};

// ---------------------------------------------------------------------------
// SHADOWS
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
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
};

/** Create a glow shadow for a given color */
export const glowShadow = (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
});

// ---------------------------------------------------------------------------
// MOTION (legacy — use Motion.ts for new code)
// ---------------------------------------------------------------------------
export const motion = {
    duration: {
        fast: 150,
        base: 250,
        slow: 350,
    },
};
