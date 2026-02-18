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
}

export const CapturedPiecesRow: React.FC<CapturedPiecesRowProps> = ({
    pieces,
    advantage,
    pieceColor,
    label,
    style,
}) => {
    const { colors, spacing, radii } = useTheme();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: colors.bg1,
                borderColor: colors.bg2,
                borderRadius: radii.sm,
            },
            style,
        ]}>
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
                {pieces.length === 0 && (
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>—</Text>
                )}
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
                <View style={[styles.advantageBadge, { backgroundColor: colors.primaryMuted }]}>
                    <Text style={[styles.advantageText, { color: colors.primary }]}>
                        +{advantage}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        borderWidth: 1,
        overflow: 'hidden',
        minHeight: 32,
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
        paddingVertical: 6,
        gap: 2,
    },
    advantageBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    advantageText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
