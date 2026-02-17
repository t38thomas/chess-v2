import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { BoardViewModel } from 'chess-core';
import { Square } from './Square';
import { Piece } from './Piece';

const BOARD_SIZE = 8;

interface BoardViewProps {
    viewModel: BoardViewModel;
    onSquarePress: (x: number, y: number) => void;
    reversed?: boolean;
    invertPieces?: boolean;
    size?: number;
    orientation?: number;
}

export const BoardView: React.FC<BoardViewProps> = ({
    viewModel,
    onSquarePress,
    reversed = false,
    invertPieces = false,
    size,
    orientation = 0
}) => {
    // Rotation Animation
    const rotation = useSharedValue(0);

    useEffect(() => {
        // Base rotation from 'reversed' (standard black view) is 180.
        // 'orientation' adds 90deg steps.
        // If reversed is true, we start at 180.
        // Orientation adds to that?
        // Let's keep them separate.
        // Actually 'reversed' rotates 180.
        // 'orientation' rotates 90 * orientation.
        // Total rotation = (reversed ? 180 : 0) + (orientation * 90).
        // OR: orientation overrides reversed?
        // Usually 'reversed' is for "I am Black".
        // If I am Black, I see Board rotated 180.
        // If I use "Turn Rotate", I rotate +90.
        // So 180 + 90 = 270.
        // So they sum up.
        // BUT 'reversed' uses style transform directly in existing code!
        // I should disable the static style transform and use animated one.

        // INVERTED LOGIC: User requested orientation 1 and 3 inverted.
        // Orientation 1 (90 CW Logic) should be displayed as -90 (CCW) rotation 
        // to maintain "Forward is Up" perception.
        let targetRotation = (reversed ? 180 : 0) - (orientation * 90);
        rotation.value = withSpring(targetRotation, { damping: 15, stiffness: 100 });
    }, [reversed, orientation, rotation]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }]
        };
    });

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
                                reversed={invertPieces ? !reversed : reversed}
                            />
                        )}
                    </Square>
                ))}
            </View>
        );
    }

    return (
        <Animated.View
            style={[
                styles.board,
                size ? { width: size, height: size } : undefined,
                animatedStyle
            ]}
        >
            {rows}
        </Animated.View>
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
