import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BoardViewModel } from 'chess-core';
import { Square } from './Square';
import { Piece } from './Piece';

const BOARD_SIZE = 8;

interface BoardViewProps {
    viewModel: BoardViewModel;
    onSquarePress: (x: number, y: number) => void;
    reversed?: boolean;
    size?: number;
}

export const BoardView: React.FC<BoardViewProps> = ({
    viewModel,
    onSquarePress,
    reversed = false,
    size
}) => {
    // Calculate square size
    const squareSize = size ? size / BOARD_SIZE : 50;

    // Group squares into rows
    const rows = [];
    for (let y = 0; y < BOARD_SIZE; y++) {
        const rowSquares = viewModel.squares.slice(y * BOARD_SIZE, (y + 1) * BOARD_SIZE);

        rows.push(
            <View key={y} style={styles.row}>
                {rowSquares.map(squareVM => (
                    <Square
                        key={`${squareVM.x},${squareVM.y}`}
                        viewModel={squareVM}
                        size={squareSize}
                        onPress={() => onSquarePress(squareVM.x, squareVM.y)}
                    >
                        {squareVM.piece && (
                            <Piece
                                type={squareVM.piece.type}
                                color={squareVM.piece.color}
                                size={squareSize * 0.8}
                                reversed={reversed}
                            />
                        )}
                    </Square>
                ))}
            </View>
        );
    }

    return (
        <View
            style={[
                styles.board,
                size ? { width: size, height: size } : undefined,
                reversed && styles.reversed
            ]}
        >
            {rows}
        </View>
    );
};

const styles = StyleSheet.create({
    board: {
        flexDirection: 'column-reverse',
    },
    reversed: {
        transform: [{ rotate: '180deg' }],
    },
    row: {
        flexDirection: 'row',
    },
});
