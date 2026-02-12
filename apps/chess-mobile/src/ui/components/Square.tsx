import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { SquareViewModel } from 'chess-core';
import { useTheme } from '../theme';
import { Text } from './Text';

interface SquareProps {
    viewModel: SquareViewModel;
    size: number;
    onPress: () => void;
    children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({
    viewModel, size, onPress, children
}) => {
    const { colors } = useTheme();

    // Use slate700 (#334155) for dark squares and a light neutral for light squares
    const backgroundColor = viewModel.color === 'dark' ? '#334155' : '#E2E8F0';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { width: size, height: size, backgroundColor },
                viewModel.isSelected && styles.selected,
                viewModel.isLastMove && styles.lastMove,
                !!viewModel.targetIndex && styles.targetSquare,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {viewModel.isValidTarget && <View style={styles.validTargetMarker} />}
            {viewModel.targetIndex && (
                <View style={styles.targetBadge}>
                    <Text variant="caption" bold color="inverse">{viewModel.targetIndex}</Text>
                </View>
            )}
            {children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    selected: {
        backgroundColor: 'rgba(16, 185, 129, 0.4)', // emerald-500 with opacity
    },
    lastMove: {
        backgroundColor: 'rgba(16, 185, 129, 0.25)', // lighter emerald for last move
    },
    validTargetMarker: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.6)', // emerald dot for valid moves
        zIndex: 1,
    },
    targetSquare: {
        backgroundColor: 'rgba(59, 130, 246, 0.5)', // blue for targeting
    },
    targetBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: '#3B82F6',
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    }
});
