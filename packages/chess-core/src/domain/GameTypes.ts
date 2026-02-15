import { BoardModel } from './models/BoardModel';
import { PieceColor, PieceType } from './models/Piece';
import { Move } from './models/Move';
import { Pact } from './models/Pact';
import { Coordinate } from './models/Coordinate';

export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw';
export type GamePhase = 'setup' | 'playing' | 'game_over';
export type GameEvent = 'move' | 'capture' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'castle' | 'promotion' | 'phase_change' | 'pact_assigned' | 'ability_activated' | 'turn_start' | 'pact_effect';

export interface IChessGame {
    board: BoardModel;
    turn: PieceColor;
    history: Move[];
    status: GameStatus;
    phase: GamePhase;
    pacts: Record<PieceColor, Pact[]>;
    perkUsage: Record<PieceColor, Set<string>>;
    pieceCooldowns: Map<string, number>;
    pactState: Record<string, any>;
    totalTurns: number;
    extraTurns: Record<PieceColor, number>;
    kingMoves: Record<PieceColor, number>;
    enPassantTarget: Coordinate | null;

    emit(event: GameEvent, payload?: any): void;
    undo(): boolean;
    // Methods used by rules/pacts could also be added here if necessary
}
