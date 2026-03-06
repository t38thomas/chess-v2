import React, { useEffect, useCallback } from 'react';
import { View, Modal, StyleSheet, Pressable, useWindowDimensions, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../theme';
import { Motion } from '../constants/Motion';

interface BaseModalProps {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    /** Modal width preset */
    size?: 'sm' | 'md' | 'lg' | 'full';
    /** Close when tapping the backdrop */
    dismissOnBackdrop?: boolean;
    /** Custom content style override */
    contentStyle?: ViewStyle;
}

export const BaseModal: React.FC<BaseModalProps> = ({
    visible,
    onClose,
    children,
    size = 'md',
    dismissOnBackdrop = true,
    contentStyle,
}) => {
    const { colors, radii, shadows } = useTheme();

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.92);
    const translateY = useSharedValue(24);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, Motion.timing.modal);
            scale.value = withSpring(1, Motion.spring.soft);
            translateY.value = withSpring(0, Motion.spring.soft);
        }
    }, [visible]);

    const handleClose = useCallback(() => {
        opacity.value = withTiming(0, Motion.timing.fast);
        scale.value = withTiming(0.95, Motion.timing.fast);
        translateY.value = withTiming(16, Motion.timing.fast, () => {
            runOnJS(onClose)();
        });
    }, [onClose]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const contentAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
        opacity: opacity.value,
    }));

    const maxWidth = size === 'sm' ? 340 : size === 'lg' ? 560 : size === 'full' ? '95%' : 420;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
            <Animated.View style={[styles.overlay, overlayStyle, { backgroundColor: colors.bgOverlay }]}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={dismissOnBackdrop ? handleClose : undefined}
                />
                <Animated.View style={[
                    styles.content,
                    contentAnimStyle,
                    shadows.lg,
                    {
                        backgroundColor: colors.bg2,
                        borderRadius: radii.xl,
                        maxWidth: maxWidth,
                        width: '90%',
                        borderWidth: 1,
                        borderColor: colors.borderStrong,
                    },
                    contentStyle,
                ]}>
                    {children}
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        overflow: 'hidden',
    },
});
