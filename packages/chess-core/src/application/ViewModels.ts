import { PieceType, PieceColor } from '../domain/models/Piece';
import { GameStatus, GamePhase } from '../domain/GameTypes';
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
    isAttacked: boolean; // Square is attacked (for Oracle pact)
    targetIndex?: number | null; // For multi-target abilities
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
    activeAbilityId?: string | null;
    pendingTargets?: { x: number; y: number }[];
    turnCounters?: Record<PieceColor, TurnCounter[]>;
    capturedPieces: Record<PieceColor, { type: PieceType; color: PieceColor; id: string }[]>;
}

export interface TurnCounter {
    id: string;
    label: string;
    value: number;
    pactId: string;
    type: 'cooldown' | 'counter';
    maxValue?: number;
    subLabel?: string;
}
