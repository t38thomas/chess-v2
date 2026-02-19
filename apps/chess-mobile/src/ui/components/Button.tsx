
import React, { useCallback } from 'react';
import { Pressable, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Icon, IconName } from './Icon';
import { Text } from './Text';
import { useSoundContext } from '../context/SoundContext';
import { Motion } from '../constants/Motion';

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
    style?: any;
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

    const scale = useSharedValue(1);

    const handlePressIn = useCallback(() => {
        scale.value = withSpring(0.96, Motion.spring.snappy);
    }, []);

    const handlePressOut = useCallback(() => {
        scale.value = withSpring(1, Motion.spring.snappy);
    }, []);

    const animatedScale = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Variant-based styles
    const getBackgroundColor = () => {
        if (disabled) return colors.surfaceActive;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'destructive': return colors.errorStrong;
            case 'secondary': return 'transparent';
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textMuted;
        switch (variant) {
            case 'primary': return colors.primaryForeground;
            case 'destructive': return '#FFFFFF';
            case 'secondary': return colors.primary;
            case 'ghost': return colors.primary;
            default: return colors.primaryForeground;
        }
    };

    const getBorderStyle = (): ViewStyle => {
        if (variant === 'secondary') {
            return {
                borderWidth: 1,
                borderColor: disabled ? colors.borderStrong : 'rgba(108,92,231,0.3)',
            };
        }
        return {};
    };

    const getPadding = (): ViewStyle => {
        switch (size) {
            case 'sm': return { paddingVertical: spacing[1], paddingHorizontal: spacing[3] };
            case 'lg': return { paddingVertical: spacing[4], paddingHorizontal: spacing[8] };
            default: return { paddingVertical: spacing[3], paddingHorizontal: spacing[5] };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return 12;
            case 'lg': return 16;
            default: return 15;
        }
    };

    const getRadius = () => {
        switch (size) {
            case 'sm': return radii.sm;
            case 'lg': return radii.lg;
            default: return radii.md;
        }
    };

    const getShadow = () => {
        if (variant === 'primary' || variant === 'destructive') return shadows.sm;
        return {};
    };

    return (
        <Animated.View style={[animatedScale, fullWidth && { width: '100%' }, style]}>
            <Pressable
                onPress={() => {
                    if (!disabled && !loading) {
                        playSound('button-click');
                        onPress?.();
                    }
                }}
                disabled={disabled || loading}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.base,
                    {
                        backgroundColor: getBackgroundColor(),
                        borderRadius: getRadius(),
                        opacity: disabled ? 0.55 : 1,
                        ...getPadding(),
                        ...getBorderStyle(),
                        ...getShadow(),
                        width: fullWidth ? '100%' : undefined,
                        flex: 1,
                    },
                ]}
            >
                {loading ? (
                    <ActivityIndicator size="small" color={getTextColor()} />
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
                                fontWeight: '600',
                            }}
                        >
                            {label}
                        </Text>
                    </>
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
