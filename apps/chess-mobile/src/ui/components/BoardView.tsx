import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, useDerivedValue, withSequence, withTiming } from 'react-native-reanimated';
import { BoardViewModel } from 'chess-core';
import { BOARD_ROTATION_SPRING_CONFIG, BOARD_SCALE_SPRING_CONFIG } from '../constants/Animations';
import { Square } from './Square';
import { Piece } from './Piece';
import { useTheme } from '../theme';

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
    const { colors } = useTheme();
    const prevOrientation = React.useRef(orientation);
    const rotationOffset = useSharedValue(0);

    useEffect(() => {
        // Calculate the difference between orientations to maintain continuity
        // Domain logic is (current + 1) % 4
        let diff = orientation - prevOrientation.current;

        // Handle the wrap-around (3 -> 0 should be +1, 0 -> 3 should be -1)
        if (diff === -3) diff = 1;
        if (diff === 3) diff = -1;

        rotationOffset.value += diff * 90;
        prevOrientation.current = orientation;
    }, [orientation]);

    // Reactive Rotation Animation
    const rotation = useDerivedValue(() => {
        const baseRotation = (reversed ? 180 : 0);
        // orientation-driven rotation is now cumulative via rotationOffset
        const targetRotation = baseRotation - rotationOffset.value;
        return withSpring(targetRotation, BOARD_ROTATION_SPRING_CONFIG);
    });

    const boardScale = useSharedValue(1);

    useEffect(() => {
        // Pulse scale down whenever board rotates
        boardScale.value = withSequence(
            withTiming(0.7),
            withTiming(1)
        );
    }, [orientation, reversed]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${rotation.value}deg` },
                { scale: boardScale.value }
            ]
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
                                reversed={invertPieces ? !reversed : false}
                                boardRotation={rotation}
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
                {
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderRadius: 4,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 8,
                },
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
