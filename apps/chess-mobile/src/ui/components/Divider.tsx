
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface DividerProps {
    orientation?: 'horizontal' | 'vertical';
    style?: ViewStyle;
    spacing?: 'none' | 'sm' | 'md';
}

export const Divider: React.FC<DividerProps> = ({
    orientation = 'horizontal',
    spacing: space = 'none',
    style,
}) => {
    const { colors, spacing } = useTheme();

    const getMargin = () => {
        if (space === 'none') return 0;
        const margin = space === 'sm' ? spacing[2] : spacing[4];
        return orientation === 'horizontal' ? { marginVertical: margin } : { marginHorizontal: margin };
    };

    return (
        <View
            style={[
                {
                    backgroundColor: colors.border,
                    ...(orientation === 'horizontal' ? { height: 1, width: '100%' } : { width: 1, height: '100%' }),
                    ...getMargin(),
                },
                style,
            ]}
        />
    );
};
