import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { ToastData, useToast } from '../../context/ToastContext';
import { Icon } from './Icon';
import { Text } from './Text';
import { useTheme } from '../theme';

interface ToastProps {
    data: ToastData;
    index: number;
}

export const Toast: React.FC<ToastProps> = ({ data, index }) => {
    const { colors, spacing, shadows, radii } = useTheme();
    const { dismissToast } = useToast();
    const { width } = useWindowDimensions();

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < -50) {
                    Animated.timing(translateY, {
                        toValue: -100,
                        duration: 200,
                        useNativeDriver: true,
                    }).start(() => dismissToast(data.id));
                } else {
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    ...shadows.md,
                    marginTop: index === 0 ? 0 : spacing[2],
                },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={styles.content}>
                {data.icon && (
                    <View style={[styles.iconContainer, { backgroundColor: getIconBgColor(data.type, colors) }]}>
                        <Icon name={data.icon} size={20} color={getIconColor(data.type, colors)} />
                    </View>
                )}
                <View style={styles.textContainer}>
                    <Text variant="body" bold>{data.title}</Text>
                    {data.description && (
                        <Text variant="caption" color="secondary" numberOfLines={2}>
                            {data.description}
                        </Text>
                    )}
                </View>
                <TouchableOpacity onPress={() => dismissToast(data.id)} style={styles.closeButton}>
                    <Icon name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const getIconColor = (type: ToastData['type'], colors: any) => {
    switch (type) {
        case 'error': return colors.danger;
        case 'warning': return colors.warning;
        case 'success': return colors.primary;
        case 'malus': return colors.danger; // Using danger for malus
        case 'bonus': return colors.primary;
        default: return colors.primary;
    }
};

const getIconBgColor = (type: ToastData['type'], colors: any) => {
    switch (type) {
        case 'error': return colors.dangerMuted || 'rgba(214,48,49,0.15)';
        case 'warning': return colors.warningMuted || 'rgba(253,203,110,0.15)';
        case 'success': return colors.primaryMuted;
        case 'malus': return colors.dangerMuted || 'rgba(214,48,49,0.15)';
        case 'bonus': return colors.primaryMuted;
        default: return colors.primaryMuted;
    }
};

const styles = StyleSheet.create({
    container: {
        width: '90%',
        alignSelf: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
});
