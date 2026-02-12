import { PieceType, PieceColor } from '../domain/models/Piece';
import { GameStatus, GamePhase } from '../domain/ChessGame';
import { Pact } from '../domain/models/Pact';

// Simplified view models for UI - pure data, no methods
export interface SquareViewModel {
    x: number;
    y: number;
    color: 'light' | 'dark';
    piece?: {
        type: PieceType;
        color: PieceColor;
        id: string;
    } | null;
    isSelected: boolean;
    isValidTarget: boolean;
    isLastMove: boolean;
    isCheck: boolean; // King in check
}

export interface MoveViewModel {
    from: { x: number; y: number };
    to: { x: number; y: number };
    piece: { type: PieceType; color: PieceColor };
    san?: string; // Optional for now
}

export interface BoardViewModel {
    squares: SquareViewModel[];
    turn: PieceColor;
    status: GameStatus;
    history: MoveViewModel[];
    phase: GamePhase;
    pacts: Record<PieceColor, Pact[]>;
    pendingPromotion?: { x: number; y: number; color: PieceColor } | null;
    winner?: PieceColor;
}
