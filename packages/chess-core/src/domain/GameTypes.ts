import { BoardModel } from './models/BoardModel';
import { Piece, PieceColor, PieceType } from './models/Piece';
import { Move } from './models/Move';
import { Pact } from './models/Pact';
import { Coordinate } from './models/Coordinate';
import { MatchConfig } from './models/MatchConfig';

export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw' | 'resignation';
export type GamePhase = 'setup' | 'playing' | 'game_over';
export type GameEvent = 'move' | 'capture' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'castle' | 'promotion' | 'phase_change' | 'pact_assigned' | 'ability_activated' | 'turn_start' | 'pact_effect' | 'board_rotated';

/**
 * Payload emesso dai patti per notifiche UI e audio.
 */
export interface PactEffectNotification {
    pactId: string;
    title: string;
    description: string;
    icon: string;
    type: 'bonus' | 'malus';
    payload?: unknown;
}

/**
 * Strongly typed payloads for game events.
 * Matches actual usage in ChessGame.ts
 */
export interface GameEventPayloads {
    'move': Move;
    'capture': Move;
    'check': Move;
    'checkmate': Move | { winner?: PieceColor } | undefined;
    'stalemate': Move | undefined;
    'draw': Move | { reason: string } | undefined;
    'castle': Move;
    'promotion': Move;
    'phase_change': undefined;
    'pact_assigned': undefined;
    'ability_activated': { abilityId: string; playerId: PieceColor };
    'turn_start': PieceColor;
    'pact_effect': PactEffectNotification;
    'board_rotated': undefined;
}

export interface IChessGame {
    matchConfig: MatchConfig;
    board: BoardModel;
    turn: PieceColor;
    history: Move[];
    status: GameStatus;
    phase: GamePhase;
    pacts: Record<PieceColor, Pact[]>;
    perkUsage: Record<PieceColor, Set<string>>;
    pieceCooldowns: Map<string, number>;
    pactState: Record<string, unknown>;
    capturedPieces: Record<PieceColor, Piece[]>;
    totalTurns: number;
    extraTurns: Record<PieceColor, number>;
    kingMoves: Record<PieceColor, number>;
    enPassantTarget: Coordinate | null;
    orientation: number; // 0, 1, 2, 3 (clockwise rotations)

    emit<E extends keyof GameEventPayloads>(event: E, payload: GameEventPayloads[E]): void;
    emit(event: GameEvent, payload?: unknown): void;
    undo(): boolean;
    rotateBoard(): boolean;

    // Domain command methods — preferred over direct property mutation in pact logic.
    // Optional for backward compatibility with test mocks.
    endMatch?(winner: PieceColor | null, reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation'): void;
    applyCooldown?(pieceId: string, turns: number): void;
    grantExtraTurn?(color: PieceColor, count?: number): void;
}
