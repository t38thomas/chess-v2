import { PieceColor } from 'chess-core';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PieceCount } from '../viewmodels/CapturedPiecesViewModel';
import { MaterialAdvantageBadge } from './MaterialAdvantageBadge';
import { PieceMini } from './PieceMini';

import { useTheme } from '../theme';
import { Text } from './Text';

interface CapturedPiecesRowProps {
    pieces: PieceCount[];
    advantage?: number;
    pieceColor: PieceColor;
    label?: string;
    style?: any;
    // We assume default LTR layout
}

export const CapturedPiecesRow: React.FC<CapturedPiecesRowProps> = ({
    pieces,
    advantage,
    pieceColor,
    label,
    style,
}) => {
    // Determine min height to prevent layout shift when empty
    const minHeight = 24;
    const { colors, spacing } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.boardDark }, style, { minHeight }]}>
            {label && (
                <Text variant="caption" color="secondary" style={styles.label}>
                    {label}
                </Text>
            )}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollView}
            >
                {pieces.map((p) => (
                    <PieceMini
                        key={p.kind}
                        kind={p.kind}
                        count={p.count}
                        color={pieceColor}
                    />
                ))}
            </ScrollView>
            {advantage !== undefined && advantage > 0 && (
                <MaterialAdvantageBadge value={advantage} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        overflow: 'hidden',
    },
    label: {
        fontSize: 10,
        marginRight: 8,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    scrollView: {
        flexGrow: 1,
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14
    }
});
