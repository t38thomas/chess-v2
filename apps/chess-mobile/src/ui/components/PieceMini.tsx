import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PieceType } from 'chess-core';
import { Piece } from './Piece';
import { Text } from './Text';
import { useTheme } from '../theme';

interface PieceMiniProps {
    kind: PieceType;
    count: number;
    color: 'white' | 'black'; // Captured pieces have a color
    size?: number;
}

export const PieceMini: React.FC<PieceMiniProps> = ({ kind, count, color, size = 30 }) => {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            <Piece type={kind} color={color} size={size} />
            {count > 1 && (
                <View style={[styles.badge, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text variant="caption" style={styles.countText}>
                        {count}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginRight: 6,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        bottom: -4,
        right: -6,
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 4,
        minWidth: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 10,
        lineHeight: 12,
        fontWeight: 'bold',
    }
});
