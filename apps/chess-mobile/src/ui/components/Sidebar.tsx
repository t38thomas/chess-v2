import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions, useWindowDimensions, PanResponder } from 'react-native';
import { IconButton } from './IconButton';
import { useTheme } from '../theme';

interface SidebarProps {
    visible: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    position?: 'left' | 'right';
}

export const Sidebar: React.FC<SidebarProps> = ({
    visible,
    onToggle,
    children,
    position = 'right',
}) => {
    const { colors, spacing } = useTheme();
    const { width, height } = useWindowDimensions();
    const slideAnim = useRef(new Animated.Value(visible ? 0 : 1)).current;
    const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;

    const isLandscape = width > height;
    const isMobile = !isLandscape; // Portrait = mobile mode

    // Sidebar dimensions
    const DESKTOP_WIDTH_OPEN = 320;
    const DESKTOP_WIDTH_COLLAPSED = 60;
    const MOBILE_WIDTH = width * 0.85; // 85% of screen width on mobile

    useEffect(() => {
        Animated.parallel([
            Animated.spring(slideAnim, {
                toValue: visible ? 0 : 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
                toValue: visible ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible, slideAnim, backdropOpacity]);

    // Desktop mode: collapsed sidebar
    if (!isMobile) {
        const widthAnim = slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [DESKTOP_WIDTH_OPEN, DESKTOP_WIDTH_COLLAPSED],
        });

        return (
            <Animated.View
                style={[
                    styles.desktopSidebar,
                    {
                        width: widthAnim,
                        backgroundColor: colors.surface,
                        borderLeftWidth: position === 'right' ? 1 : 0,
                        borderRightWidth: position === 'left' ? 1 : 0,
                        borderColor: colors.border,
                    },
                    position === 'right' ? { right: 0 } : { left: 0 },
                ]}
            >
                {/* Toggle Button - always visible */}
                <View style={[
                    styles.toggleButton,
                    !visible && { alignItems: 'center', width: '100%', left: 0, right: 0 }
                ]}>
                    <IconButton
                        icon={visible ? (position === 'right' ? 'chevron-right' : 'chevron-left') : (position === 'right' ? 'chevron-left' : 'chevron-right')}
                        onPress={onToggle}
                        variant="secondary"
                        size="sm"
                    />
                </View>

                {/* Content - only show when expanded */}
                {visible && (
                    <View style={styles.contentContainer}>
                        {children}
                    </View>
                )}
            </Animated.View>
        );
    }

    // Mobile mode: drawer overlay
    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, position === 'right' ? MOBILE_WIDTH : -MOBILE_WIDTH],
    });

    // Pan gesture handler for mobile swipe-to-close
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => visible,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to horizontal swipes with some movement
                return visible && Math.abs(gestureState.dx) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                // For right-positioned sidebar, swiping right closes it
                // For left-positioned sidebar, swiping left closes it
                const swipeDirection = position === 'right' ? gestureState.dx : -gestureState.dx;

                if (swipeDirection > 0) {
                    // Calculate progress based on swipe distance
                    const progress = Math.min(swipeDirection / 150, 1);
                    slideAnim.setValue(progress);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                const swipeDirection = position === 'right' ? gestureState.dx : -gestureState.dx;
                const velocity = position === 'right' ? gestureState.vx : -gestureState.vx;

                // If swiped more than 80px or velocity is high enough, close sidebar
                if (swipeDirection > 80 || velocity > 0.5) {
                    onToggle();
                } else {
                    // Otherwise, snap back to open
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        friction: 8,
                        tension: 40,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;


    if (!visible)
        return null;

    return (
        <>
            {/* Backdrop */}

            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        opacity: backdropOpacity,
                        zIndex: 99,
                    },
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                <Pressable style={StyleSheet.absoluteFill} onPress={onToggle} />
            </Animated.View>


            {/* Drawer */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.mobileDrawer,
                    {
                        width: MOBILE_WIDTH,
                        backgroundColor: colors.background,
                        borderLeftWidth: position === 'right' ? 1 : 0,
                        borderRightWidth: position === 'left' ? 1 : 0,
                        borderColor: colors.border,
                        transform: [{ translateX }],
                        zIndex: 100,
                    },
                    position === 'right' ? { right: 0 } : { left: 0 },
                ]}
                pointerEvents={visible ? 'auto' : 'none'}
            >
                {/* Close Button */}
                <View style={[styles.closeButton, { padding: spacing[4] }]}>
                    <IconButton
                        icon="close"
                        onPress={onToggle}
                        variant="ghost"
                        size="md"
                    />
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {children}
                </View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    desktopSidebar: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 10,
    },
    mobileDrawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 100,
    },
    toggleButton: {
        position: 'absolute',
        top: 16,
        zIndex: 1,
    },
    closeButton: {
        alignItems: 'flex-end',
    },
    contentContainer: {
        flex: 1,
        padding: 16,
    },
});
