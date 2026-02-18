import { useWindowDimensions, Platform } from 'react-native';
import { getScreenSize, ScreenSize } from './breakpoints';

interface ResponsiveValues {
    bp: ScreenSize;
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isWeb: boolean;
    /** Scale a base value according to current breakpoint */
    scale: (base: number, factor?: Partial<Record<ScreenSize, number>>) => number;
    /** Optimal board size for current screen */
    boardSize: number;
    /** Whether to show the sidebar panel alongside the board */
    showSidebar: boolean;
}

const DEFAULT_SCALE_FACTORS: Record<ScreenSize, number> = {
    xs: 0.85,
    sm: 0.9,
    md: 1,
    lg: 1.05,
    xl: 1.1,
};

/**
 * Unified responsive hook — combines breakpoint detection, board sizing,
 * sidebar visibility, and value scaling into one call.
 *
 * Replaces: useBreakpoint + useBoardSize + Responsive.spacing/fontSize
 */
export const useResponsive = (): ResponsiveValues => {
    const { width, height } = useWindowDimensions();
    const bp = getScreenSize(width);

    const isMobile = bp === 'xs' || bp === 'sm';
    const isTablet = bp === 'md' || bp === 'lg';
    const isDesktop = bp === 'xl';
    const isWeb = Platform.OS === 'web';

    const scale = (base: number, factor?: Partial<Record<ScreenSize, number>>): number => {
        const multiplier = factor?.[bp] ?? DEFAULT_SCALE_FACTORS[bp];
        return Math.round(base * multiplier);
    };

    const minDimension = Math.min(width, height);
    const boardSize = isMobile
        ? Math.min(minDimension * 0.92, 420)
        : isTablet
            ? Math.min(minDimension * 0.85, 600)
            : Math.min(minDimension * 0.7, 700);

    const showSidebar = !isMobile;

    return {
        bp, width, height,
        isMobile, isTablet, isDesktop, isWeb,
        scale, boardSize, showSidebar,
    };
};
