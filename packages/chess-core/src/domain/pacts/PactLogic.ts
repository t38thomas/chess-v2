import { IChessGame, GameEvent } from '../GameTypes';
import { PieceColor, Piece, PieceType } from '../models/Piece';
import { Move } from '../models/Move';
import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Perk } from '../models/Pact';

export interface PactContext {
    game: IChessGame;
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
    repeatable?: boolean;
    maxTargets?: number;
    execute: (context: PactContext, params: any) => boolean;
}

export interface MoveParams {
    board: BoardModel;
    piece: Piece;
    from: Coordinate;
    moves: Move[];
    game?: IChessGame;
    perks?: Perk[];
    orientation?: number; // 0-3 (clockwise 90° steps), matches game.orientation
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
    hasEcholocation?: (piece: Piece) => boolean;
    canMovePiece?: (game: IChessGame, from: Coordinate, board?: BoardModel) => boolean;

    // Promotion overrides
    getAllowedPromotionTypes?: (piece: Piece) => PieceType[];



    // Capture overrides
    canCapture?: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board?: BoardModel) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece) => boolean;
    canCastle?: (piece: Piece) => boolean;
    mustMoveKingInCheck?: (color: PieceColor) => boolean;

    // Turn Economy & Special Rules
    modifyNextTurn?: (game: IChessGame, currentTurn: PieceColor, eventType: GameEvent) => PieceColor | null;
    onExecuteMove?: (game: IChessGame, move: Move) => void;

    // Attack/Defense modifiers
    canBeCaptured?: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board?: BoardModel) => boolean;
    isImmuneToCheckmate?: (game: IChessGame) => boolean;
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
