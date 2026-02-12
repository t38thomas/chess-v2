import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { SquareViewModel } from 'chess-core';

interface SquareProps {
    viewModel: SquareViewModel;
    size: number;
    onPress: () => void;
    children?: React.ReactNode;
}

export const Square: React.FC<SquareProps> = ({
    viewModel, size, onPress, children
}) => {
    // ViewModel already decides color ('light' | 'dark')
    // But we map it to actual colors here (View logic)
    const backgroundColor = viewModel.color === 'dark' ? '#533981ff' : '#eeeed2';

    return (
        <TouchableOpacity
            style={[
                styles.container,
                { width: size, height: size, backgroundColor },
                viewModel.isSelected && styles.selected,
                viewModel.isLastMove && styles.lastMove,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            {viewModel.isValidTarget && <View style={styles.validTargetMarker} />}
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
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    lastMove: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    validTargetMarker: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        zIndex: 1,
    },
});
