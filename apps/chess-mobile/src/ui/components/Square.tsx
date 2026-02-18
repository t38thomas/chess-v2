import React, { useEffect } from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { SquareViewModel } from 'chess-core';
import { useTheme } from '../theme';
import { Text } from './Text';

interface SquareProps {
    viewModel: SquareViewModel;
    size: number;
    onPress: () => void;
    children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({
    viewModel, size, onPress, children
}) => {
    const { colors } = useTheme();

    // Use theme tokens instead of hardcoded colors
    const backgroundColor = viewModel.color === 'dark' ? colors.boardDark : colors.boardLight;

    // --- Check pulse glow animation ---
    const checkPulse = useSharedValue(0);

    useEffect(() => {
        if (viewModel.isAttacked) {
            checkPulse.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 600 }),
                    withTiming(0.4, { duration: 600 }),
                ),
                -1, // infinite
                true
            );
        } else {
            checkPulse.value = withTiming(0, { duration: 200 });
        }
    }, [viewModel.isAttacked]);

    const checkGlowStyle = useAnimatedStyle(() => ({
        opacity: checkPulse.value,
    }));

    // Priority-based highlight (only show the most important one)
    const getHighlightStyle = (): ViewStyle | null => {
        if (viewModel.isAttacked) return null; // Handled by animated glow
        if (viewModel.isSelected) return { backgroundColor: colors.hlSelected };
        if (viewModel.isLastMove) return { backgroundColor: colors.hlLastMove };
        if (viewModel.targetIndex) return { backgroundColor: colors.hlTarget };
        return null;
    };

    const highlightStyle = getHighlightStyle();

    // Legal move indicator scales with square size
    const dotSize = size * 0.28;

    return (
        <Pressable
            style={[
                styles.container,
                { width: size, height: size, backgroundColor },
            ]}
            onPress={onPress}
        >
            {/* Animated check glow overlay */}
            {viewModel.isAttacked && (
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: colors.hlCheck },
                        checkGlowStyle,
                    ]}
                />
            )}

            {/* Static highlight overlay */}
            {highlightStyle && <View style={[StyleSheet.absoluteFill, highlightStyle]} />}

            {/* Legal move dot (or capture ring if piece is present) */}
            {viewModel.isValidTarget && (
                <View style={[
                    styles.legalMoveDot,
                    {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                    },
                    viewModel.piece
                        ? {
                            // Ring style for capture targets
                            backgroundColor: 'transparent',
                            borderWidth: 2.5,
                            borderColor: colors.hlCapture,
                            width: size * 0.85,
                            height: size * 0.85,
                            borderRadius: size * 0.425,
                        }
                        : { backgroundColor: colors.hlLegalMove },
                ]} />
            )}

            {/* Target index badge (spectral abilities) */}
            {viewModel.targetIndex != null && viewModel.targetIndex > 0 && (
                <View style={[styles.targetBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={styles.targetText}>{viewModel.targetIndex}</Text>
                </View>
            )}

            {children}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    legalMoveDot: {
        position: 'absolute',
        zIndex: 1,
    },
    targetBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    targetText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
});
