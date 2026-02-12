import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BoardViewModel, SquareViewModel } from 'chess-core';
import { Square } from './Square';

const BOARD_SIZE = 8;

interface BoardViewProps {
    viewModel: BoardViewModel;
    onSquarePress: (x: number, y: number) => void;
    renderPiece: (square: SquareViewModel) => React.ReactNode;
}

export const BoardView: React.FC<BoardViewProps> = ({
    viewModel, onSquarePress, renderPiece
}) => {
    const screenWidth = Dimensions.get('window').width;
    const squareSize = Math.floor(screenWidth / BOARD_SIZE);

    // Group squares into rows
    // ViewModel squares are ordered by y then x: (0,0), (1,0)... (7,0), (0,1)...
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
                        {renderPiece(squareVM)}
                    </Square>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.board}>
            {rows}
        </View>
    );
};

const styles = StyleSheet.create({
    board: {
        flexDirection: 'column-reverse', // To have y=0 at bottom if using standard Cartesian
        // BUT Wait, BoardModel iterates y=0 to y=7. 
        // If y=0 is "Rank 1" (bottom for White), column-reverse puts y=0 (row 0) at bottom.
        // Assuming BoardModel setup: y=0 (White Pieces), y=7 (Black Pieces).
        // If column-reverse: y=0 is at bottom. Correct.
    },
    row: {
        flexDirection: 'row',
    },
});
