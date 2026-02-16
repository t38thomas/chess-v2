import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../theme';

interface MaterialAdvantageBadgeProps {
    value?: number;
}

export const MaterialAdvantageBadge: React.FC<MaterialAdvantageBadgeProps> = ({ value }) => {
    const { colors } = useTheme();

    if (!value || value <= 0) return null;

    return (
        <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
            <Text variant="caption" style={styles.text} bold>
                +{value}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
        alignSelf: 'center',
    },
    text: {
        fontSize: 12,
    }
});
