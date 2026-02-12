import { Dimensions } from 'react-native';

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const Breakpoints = {
    xs: 0,    // Mobile portrait
    sm: 576,  // Mobile landscape
    md: 768,  // Tablet portrait
    lg: 992,  // Tablet landscape
    xl: 1200, // Desktop
} as const;

/**
 * Get the current screen size based on window width
 */
export const getScreenSize = (width: number): ScreenSize => {
    if (width >= Breakpoints.xl) return 'xl';
    if (width >= Breakpoints.lg) return 'lg';
    if (width >= Breakpoints.md) return 'md';
    if (width >= Breakpoints.sm) return 'sm';
    return 'xs';
};
