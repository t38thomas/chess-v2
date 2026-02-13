import { ChessGame, GameEvent } from '../ChessGame';
import { PieceColor, Piece, PieceType } from '../models/Piece';
import { Move } from '../models/Move';
import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';

export interface PactContext {
    game: ChessGame;
    playerId: PieceColor;
    pactId: string;
}

export interface ActiveAbilityConfig {
    id: string;
    name: string; // Internal name or key for translation
    description: string; // Internal desc or key
    icon: string;
    cooldown?: number; // Turns
    maxUses?: number; // per game
    targetType: 'none' | 'square' | 'piece';
    consumesTurn?: boolean;
    execute: (context: PactContext, target?: any) => boolean;
}

export interface MoveParams {
    board: BoardModel;
    piece: Piece;
    from: Coordinate;
    moves: Move[];
    game?: ChessGame;
}

export interface RuleModifiers {
    // Movement Hooks
    onGetPseudoMoves?: (params: MoveParams) => void;

    // Movement overrides
    getMaxRange?: (piece: Piece) => number;
    getFixedDistances?: (piece: Piece) => number[] | null;
    canDoubleMove?: (piece: Piece, y: number, startY: number) => boolean;
    canDiagonalDash?: (piece: Piece) => boolean;
    canSidewaysMove?: (piece: Piece) => boolean;
    canMoveThroughFriendlies?: (mover: Piece, obstacle: Piece) => boolean;
    canMoveLikeKnight?: (pieceType: PieceType) => boolean;
    canMovePiece?: (game: ChessGame, from: Coordinate) => boolean;

    // Promotion overrides
    getAllowedPromotionTypes?: (piece: Piece) => PieceType[];



    // Capture overrides
    canCapture?: (game: ChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece) => boolean;
    canCastle?: (piece: Piece) => boolean;
    mustMoveKingInCheck?: (color: PieceColor) => boolean;

    // Turn Economy & Special Rules
    modifyNextTurn?: (game: ChessGame, currentTurn: PieceColor, eventType: GameEvent) => PieceColor | null;
    onExecuteMove?: (game: ChessGame, move: Move) => void;

    // Attack/Defense modifiers
    isImmuneToCheckmate?: (game: ChessGame) => boolean;
}

export abstract class PactLogic {
    abstract id: string;

    // Hooks primarily for RuleEngine integration
    getRuleModifiers(): RuleModifiers {
        return {};
    }

    // Generic Event Handling
    onEvent(event: GameEvent, context: any, pactContext: PactContext): void { }

    // Turn Hooks
    onTurnStart(pactContext: PactContext): void { }
    onTurnEnd(pactContext: PactContext): void { }

    // Ability configuration
    readonly activeAbility?: ActiveAbilityConfig;

    // UI Helpers
    getTurnCounters(context: PactContext): TurnCounter[] {
        return [];
    }
}

export interface TurnCounter {
    id: string;
    label: string; // Internal name or key for translation
    value: number;
    pactId: string; // The pact ID to get the icon from registry
    type: 'cooldown' | 'counter';
    maxValue?: number; // Optional for progress bars
    subLabel?: string; // Optional sub-label (e.g. "turns left")
}
