
import React from 'react';
import { StyleSheet, TextStyle, Platform, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieceType, PieceColor } from 'chess-core';
import { useTheme } from '../theme';

interface PieceProps {
    type: PieceType;
    color: PieceColor;
    size: number;
    reversed?: boolean;
}

export const Piece: React.FC<PieceProps> = ({ type, color, size, reversed = false }) => {
    const { colors, shadows } = useTheme();

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

    const getPieceColor = () => {
        return color === 'white' ? '#FFFFFF' : '#171717';
    };

    const getStyle = (): TextStyle => {
        // Strong shadow for better visibility on the new gray board
        if (color === 'white') {
            return {
                textShadowColor: 'rgba(0, 0, 0, 0.8)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
            };
        }
        // Strong light shadow for black pieces to pop on dark squares
        return {
            textShadowColor: 'rgba(255, 255, 255, 0.5)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 3,
        }
    };

    return (
        <View style={reversed ? styles.reversed : undefined}>
            <MaterialCommunityIcons
                name={getIconName()}
                size={size * 0.8} // Occupy 80% of the square
                color={getPieceColor()}
                style={getStyle()}
            />
        </View>
    );
};


const styles = StyleSheet.create({
    reversed: {
        transform: [{ rotate: '180deg' }],
    },
});
