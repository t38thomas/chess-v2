
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconProps {
    name: IconName | (string & {});
    size?: number;
    color?: string;
    style?: any;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color, style }) => {
    const { colors } = useTheme();
    return (
        <MaterialCommunityIcons
            name={name as IconName}
            size={size}
            color={color || colors.text}
            style={style}
        />
    );
};
