
import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { useSoundContext } from '../context/SoundContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    label: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: IconName;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: any; // ViewStyle
}

export const Button: React.FC<ButtonProps> = ({
    label,
    onPress,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
}) => {
    const { colors, spacing, radii, typography, shadows } = useTheme();
    const { playSound } = useSoundContext();

    // Scale animation for press feedback
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 200, // Faster than default
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 200,
        }).start();
    };

    // Styles based on variant
    const getBackgroundColor = () => {
        if (disabled) return colors.surfaceHighlight; // Muted for disabled
        switch (variant) {
            case 'primary': return colors.primary;
            case 'destructive': return colors.danger;
            case 'secondary': return colors.surfaceHighlight; // Or slightly darker background
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        switch (variant) {
            case 'primary': return colors.primaryForeground; // White text on primary
            case 'destructive': return colors.textInverse; // White text on danger
            case 'secondary': return colors.text;
            case 'ghost': return colors.primary;
            default: return colors.textInverse;
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: spacing[1], paddingHorizontal: spacing[3] };
            case 'lg': return { paddingVertical: spacing[4], paddingHorizontal: spacing[8] };
            case 'md':
            default: return { paddingVertical: spacing[3], paddingHorizontal: spacing[5] };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return typography.sizes.xs;
            case 'lg': return typography.sizes.lg;
            case 'md':
            default: return typography.sizes.base;
        }
    };

    return (
        <Pressable
            onPress={() => {
                playSound('button-click');
                onPress?.();
            }}
            disabled={disabled || loading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={({ pressed }) => [
                {
                    backgroundColor: getBackgroundColor(),
                    borderRadius: radii.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: (pressed && variant === 'ghost') ? 0.7 : 1, // Feedback for ghost
                    width: fullWidth ? '100%' : undefined,
                    ...getPadding(),
                    // Add shadow for primary/destructive
                    ...(variant === 'primary' || variant === 'destructive' ? shadows.sm : {}),
                    // Border for secondary
                    borderWidth: variant === 'secondary' ? 1 : 0,
                    borderColor: variant === 'secondary' ? colors.border : 'transparent',
                },
                style,
            ]}
        >
            <Animated.View style={{ transform: [{ scale }], flexDirection: 'row', alignItems: 'center' }}>
                {loading ? (
                    <ActivityIndicator size="small" color={getTextColor()} style={{ marginRight: spacing[2] }} />
                ) : (
                    <>
                        {icon && (
                            <Icon
                                name={icon}
                                size={getFontSize() * 1.2}
                                color={getTextColor()}
                                style={{ marginRight: spacing[2] }}
                            />
                        )}
                        <Text
                            style={{
                                color: getTextColor(),
                                fontSize: getFontSize(),
                                fontWeight: typography.weights.bold as any,
                                // casting as any because rn font weights are strings
                            }}
                        >
                            {label}
                        </Text>
                    </>
                )}
            </Animated.View>
        </Pressable>
    );
};
