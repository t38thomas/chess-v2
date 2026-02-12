
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../theme';

interface CardProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'flat';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    padding = 'md',
    style,
}) => {
    const { colors, radii, spacing, shadows } = useTheme();

    const getBackgroundColor = () => {
        switch (variant) {
            case 'elevated': return colors.surface;
            case 'outlined': return 'transparent'; // Or surface if outlined needs bg
            case 'flat': return colors.surfaceHighlight; // Slightly distinct from bg
            default: return colors.surface;
        }
    };

    const getBorder = () => {
        if (variant === 'outlined') {
            return {
                borderWidth: 1,
                borderColor: colors.border,
            };
        }
        return {};
    };

    const getShadow = () => {
        if (variant === 'elevated') {
            return shadows.sm;
        }
        return {};
    };

    const getPadding = () => {
        switch (padding) {
            case 'none': return 0;
            case 'sm': return spacing[3];
            case 'lg': return spacing[6];
            case 'md':
            default: return spacing[4];
        }
    };

    return (
        <View
            style={[
                {
                    backgroundColor: getBackgroundColor(),
                    borderRadius: radii.lg,
                    padding: getPadding(),
                    ...getBorder(),
                    ...getShadow(),
                },
                style,
            ]}
        >
            {children}
        </View>
    );
};
