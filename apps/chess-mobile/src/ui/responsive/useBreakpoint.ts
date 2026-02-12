import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Breakpoints, getScreenSize, ScreenSize } from './breakpoints';

/**
 * Hook to get current breakpoint and screen size
 */
export const useBreakpoint = () => {
    const { width, height } = useWindowDimensions();
    const bp = getScreenSize(width);

    return {
        bp,
        width,
        height,
        isXs: bp === 'xs',
        isSm: bp === 'sm',
        isMd: bp === 'md',
        isLg: bp === 'lg',
        isXl: bp === 'xl',
        isMobile: bp === 'xs' || bp === 'sm',
        isTablet: bp === 'md' || bp === 'lg',
        isDesktop: bp === 'xl',
    };
};
