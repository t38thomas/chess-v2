import { Platform, PressableStateCallbackType, ViewStyle } from 'react-native';

/**
 * Web-specific style utilities
 */

// Extend PressableStateCallbackType to include web-specific hovered property
type WebPressableState = PressableStateCallbackType & {
    hovered?: boolean;
};


// Disable text selection on web (e.g., for chess board)
export const noSelect: ViewStyle = Platform.select({
    web: {
        // @ts-ignore - Web-specific property
        userSelect: 'none',
        // @ts-ignore
        WebkitUserSelect: 'none',
        // @ts-ignore
        MozUserSelect: 'none',
    } as any,
    default: {},
});

// Enable pointer cursor on web for interactive elements
export const pointer: ViewStyle = Platform.select({
    web: {
        // @ts-ignore - Web-specific property
        cursor: 'pointer',
    } as any,
    default: {},
});

// Hover state helper for Pressable components
export const createHoverStyle = (
    baseStyle: ViewStyle,
    hoverStyle: ViewStyle
): ((state: WebPressableState) => ViewStyle) => {
    return ({ pressed, hovered }: WebPressableState) => {
        if (Platform.OS === 'web' && hovered && !pressed) {
            return { ...baseStyle, ...hoverStyle };
        }
        return baseStyle;
    };
};

// Add focus-visible outline for keyboard navigation on web
export const focusVisible: ViewStyle = Platform.select({
    web: {
        // @ts-ignore - Web-specific property
        outlineWidth: 2,
        // @ts-ignore
        outlineStyle: 'solid',
        // @ts-ignore
        outlineColor: '#00BCD4', // Cyan accent
        // @ts-ignore
        outlineOffset: 2,
    } as any,
    default: {},
});
