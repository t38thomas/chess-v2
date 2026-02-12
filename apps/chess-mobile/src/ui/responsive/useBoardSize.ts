import { useWindowDimensions } from 'react-native';
import { useBreakpoint } from './useBreakpoint';

/**
 * Hook to calculate optimal chess board size based on screen dimensions
 */
export const useBoardSize = (): number => {
    const { width, height } = useWindowDimensions();
    const { isMobile, isTablet } = useBreakpoint();

    // Calculate board size based on screen size and orientation
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);

    if (isMobile) {
        // On mobile, use most of the screen width with padding
        return Math.min(minDimension * 0.92, 420);
    } else if (isTablet) {
        // On tablets, use a balanced size
        return Math.min(minDimension * 0.85, 600);
    } else {
        // On desktop, limit the board size
        return Math.min(minDimension * 0.7, 700);
    }
};
