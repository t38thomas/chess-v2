import React, { useRef } from 'react';
import { Pressable, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { useTheme } from '../theme';
import { useSoundContext } from '../context/SoundContext';

interface IconButtonProps {
    icon: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onPress,
    variant = 'ghost',
    size = 'md',
    style,
    disabled = false,
}) => {
    const { colors, spacing } = useTheme();
    const { playSound } = useSoundContext();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const sizes = {
        sm: { container: 32, icon: 16 },
        md: { container: 40, icon: 20 },
        lg: { container: 48, icon: 24 },
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.9,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary,
                };
            case 'secondary':
                return {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            case 'ghost':
            default:
                return {
                    backgroundColor: 'transparent',
                };
        }
    };

    const iconColor = variant === 'primary' ? colors.textInverse : colors.text;

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
                onPress={() => {
                    playSound('button-click');
                    onPress();
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[
                    styles.container,
                    {
                        width: sizes[size].container,
                        height: sizes[size].container,
                        borderRadius: sizes[size].container / 2,
                        opacity: disabled ? 0.5 : 1,
                    },
                    getVariantStyles(),
                    style,
                ]}
            >
                <Icon name={icon} size={sizes[size].icon} color={iconColor} />
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
