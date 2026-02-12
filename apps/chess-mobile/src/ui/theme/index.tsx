
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, typography, spacing, radii, shadows, motion } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    colors: typeof lightColors;
    isDark: boolean;
    typography: typeof typography;
    spacing: typeof spacing;
    radii: typeof radii;
    shadows: typeof shadows;
    motion: typeof motion;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('system');

    const isDark = useMemo(() => {
        if (mode === 'system') {
            return systemScheme === 'dark';
        }
        return mode === 'dark';
    }, [mode, systemScheme]);

    const colors = isDark ? darkColors : lightColors;

    const value = useMemo(() => ({
        mode,
        setMode,
        colors,
        isDark,
        typography,
        spacing,
        radii,
        shadows,
        motion,
    }), [mode, isDark, colors]);

    return (
        <ThemeContext.Provider value= { value } >
        { children }
        </ThemeContext.Provider>
  );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// Helper for type-safe styles that need theme access
export type Theme = ThemeContextType;
