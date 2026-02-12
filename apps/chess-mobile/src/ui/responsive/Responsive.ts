import { ViewStyle } from 'react-native';
import { ScreenSize } from './breakpoints';

/**
 * Responsive style helper for conditional styles based on screen size
 */
export class Responsive {
    /**
     * Get style based on current breakpoint
     */
    static select<T>(
        bp: ScreenSize,
        styles: Partial<Record<ScreenSize, T>>
    ): T | undefined {
        // Try exact match first
        if (styles[bp]) return styles[bp];

        // Fallback to smaller breakpoints
        const fallbackOrder: ScreenSize[] = ['xl', 'lg', 'md', 'sm', 'xs'];
        const currentIndex = fallbackOrder.indexOf(bp);

        for (let i = currentIndex + 1; i < fallbackOrder.length; i++) {
            const fallback = fallbackOrder[i];
            if (styles[fallback]) return styles[fallback];
        }

        return undefined;
    }

    /**
     * Get spacing value based on screen size
     */
    static spacing(bp: ScreenSize, base: number): number {
        const multipliers: Record<ScreenSize, number> = {
            xs: 0.8,
            sm: 0.9,
            md: 1.0,
            lg: 1.1,
            xl: 1.2,
        };
        return base * multipliers[bp];
    }

    /**
     * Get font size based on screen size
     */
    static fontSize(bp: ScreenSize, base: number): number {
        const multipliers: Record<ScreenSize, number> = {
            xs: 0.9,
            sm: 0.95,
            md: 1.0,
            lg: 1.05,
            xl: 1.1,
        };
        return base * multipliers[bp];
    }
}
