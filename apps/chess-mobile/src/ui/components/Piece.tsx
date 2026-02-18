
import React from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieceType, PieceColor } from 'chess-core';

// Piece colors — slightly off pure white/black for elegance
const PIECE_COLORS = {
    white: '#F0F0F0',  // Soft white — less aggressive on light squares
    black: '#1A1A2E',  // Deep blue-black — more elegant than pure black
} as const;

interface PieceProps {
    type: PieceType;
    color: PieceColor;
    size: number;
    reversed?: boolean;
    boardRotation?: Readonly<SharedValue<number>>;
}

export const Piece: React.FC<PieceProps> = ({ type, color, size, reversed = false, boardRotation }) => {
    const getIconName = (): keyof typeof MaterialCommunityIcons.glyphMap => {
        switch (type) {
            case 'king': return 'chess-king';
            case 'queen': return 'chess-queen';
            case 'rook': return 'chess-rook';
            case 'bishop': return 'chess-bishop';
            case 'knight': return 'chess-knight';
            case 'pawn': return 'chess-pawn';
            default: return 'help-circle';
        }
    };

    const getPieceColor = () => PIECE_COLORS[color];

    const getStyle = (): TextStyle => {
        if (color === 'white') {
            // Dark shadow for white pieces — visible on both light and dark squares
            return {
                textShadowColor: 'rgba(0, 0, 0, 0.85)',
                textShadowOffset: { width: 0, height: 1.5 },
                textShadowRadius: 4,
            };
        }
        // Light shadow for dark pieces — pops on both square colors
        return {
            textShadowColor: 'rgba(255, 255, 255, 0.55)',
            textShadowOffset: { width: 0, height: 1.5 },
            textShadowRadius: 3,
        };
    };

    const animatedPieceStyle = useAnimatedStyle(() => {
        const baseRotation = boardRotation ? -boardRotation.value : 0;
        const extraFlip = reversed ? 180 : 0;
        return {
            transform: [{ rotate: `${baseRotation + extraFlip}deg` }]
        };
    });

    return (
        <Animated.View style={animatedPieceStyle}>
            <MaterialCommunityIcons
                name={getIconName()}
                size={size * 0.75}  // 75% of square — slightly smaller for more breathing room
                color={getPieceColor()}
                style={getStyle()}
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    reversed: {
        transform: [{ rotate: '180deg' }],
    },
});
