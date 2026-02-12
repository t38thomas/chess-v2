
import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme';

export type TextVariant = 'title' | 'subtitle' | 'body' | 'caption' | 'mono';
export type TextColor = 'default' | 'secondary' | 'inverse' | 'primary' | 'danger' | 'warning';

interface TextProps extends RNTextProps {
    variant?: TextVariant;
    color?: TextColor;
    align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    bold?: boolean;
    children?: React.ReactNode;
    style?: any; // TextStyle
}

export const Text: React.FC<TextProps> = ({
    variant = 'body',
    color = 'default',
    align = 'left',
    bold = false,
    style,
    children,
    ...props
}) => {
    const { colors, typography } = useTheme();

    const getVariantStyle = (): TextStyle => {
        switch (variant) {
            case 'title':
                return {
                    fontSize: typography.sizes.xxl,
                    fontWeight: typography.weights.bold,
                    lineHeight: typography.sizes.xxl * 1.2,
                };
            case 'subtitle':
                return {
                    fontSize: typography.sizes.lg,
                    fontWeight: typography.weights.medium,
                    lineHeight: typography.sizes.lg * 1.3,
                };
            case 'body':
                return {
                    fontSize: typography.sizes.base,
                    fontWeight: typography.weights.regular,
                    lineHeight: typography.sizes.base * 1.4,
                };
            case 'caption':
                return {
                    fontSize: typography.sizes.sm,
                    fontWeight: typography.weights.regular,
                    lineHeight: typography.sizes.sm * 1.4,
                };
            case 'mono':
                return {
                    fontSize: typography.sizes.sm,
                    fontFamily: typography.fontFamily.monospace,
                    lineHeight: typography.sizes.sm * 1.4,
                };
            default:
                return {};
        }
    };

    const getColor = (): string => {
        switch (color) {
            case 'secondary': return colors.textSecondary;
            case 'inverse': return colors.textInverse;
            case 'primary': return colors.primary;
            case 'danger': return colors.danger;
            case 'warning': return colors.warning;
            case 'default':
            default: return colors.text;
        }
    };

    return (
        <RNText
            style={[
                getVariantStyle(),
                {
                    color: getColor(),
                    textAlign: align,
                    fontWeight: bold ? typography.weights.bold : undefined,
                },
                style,
            ]}
            {...props}
        >
            {children}
        </RNText>
    );
};
