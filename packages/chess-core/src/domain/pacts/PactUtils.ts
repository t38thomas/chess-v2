import { IChessGame } from '../GameTypes';
import { Coordinate } from '../models/Coordinate';
import { BoardUtils } from './utils/BoardUtils';
import { CombatUtils } from './utils/CombatUtils';
import { PieceUtils } from './utils/PieceUtils';
import { Piece, PieceType, PieceColor } from '../models/Piece';
import { MovementUtils } from './utils/MovementUtils';




export type PactVisualEffect = 'stun' | 'heal' | 'buff' | 'debuff' | 'silence' | 'swap' | 'revive' | 'damage';
export type PactVisualIcon = 'flask' | 'shield' | 'sword' | 'snowflake' | 'swap-horizontal' | 'heart' | 'skull' | 'zap' | 'eye' | 'flame' | 'leaf';
export type PactEffectOrigin = 'bonus' | 'malus';

export class PactUtils {
    // Notifications & Messaging
    public static emitPactEffect(game: IChessGame, config: {
        pactId: string;
        title: string;
        description: string;
        icon: PactVisualIcon | string;
        type: PactEffectOrigin;
        payload?: any;
    }): void {
        game.emit('pact_effect', config);
    }

    public static notifyPactEffect(game: IChessGame, pactId: string, eventKey: PactVisualEffect | string, type: PactEffectOrigin, icon: PactVisualIcon | string): void {
        game.emit('pact_effect', {
            pactId,
            title: `pact.toasts.${pactId}.${eventKey}.title`,
            description: `pact.toasts.${pactId}.${eventKey}.desc`,
            icon,
            type
        });
    }

    // Facades for modularized utils
    public static swapPieces = BoardUtils.swapPieces;
    public static promotePiece = PieceUtils.promotePiece;


    public static findPieces = BoardUtils.findPieces;
    public static findPiecesByTypes = BoardUtils.findPiecesByTypes;
    public static isBlackSquare = BoardUtils.isBlackSquare;
    public static isCentralSquare = BoardUtils.isCentralSquare;
    public static isEdgeSquare = BoardUtils.isEdgeSquare;
    public static isAdjacent = BoardUtils.isAdjacent;
    public static getPiecesAdjacentTo = BoardUtils.getPiecesAdjacentTo;
    public static pushPiece = BoardUtils.pushPiece;

    public static isSquareAttacked = CombatUtils.isSquareAttacked;
    public static getCaptureOpportunities = CombatUtils.getCaptureOpportunities;

    public static removePiece = PieceUtils.removePiece;
    public static resurrectPiece = PieceUtils.resurrectPiece;

    public static sacrificeMostAdvancedPiece = PieceUtils.sacrificeMostAdvancedPiece;
    public static getEmptyStartingSquare = PieceUtils.getEmptyStartingSquare;

    public static addSingleStepMoves = MovementUtils.addSingleStepMoves;
    public static blockHorizontalMoves = MovementUtils.blockHorizontalMoves;
    public static blockVerticalMoves = MovementUtils.blockVerticalMoves;
    public static blockDiagonalMoves = MovementUtils.blockDiagonalMoves;

    // Common helpers
    public static pickRandom<T>(items: T[], count: number, rng: () => number = Math.random): T[] {
        if (items.length === 0) return [];
        // Fisher-Yates shuffle (unbiased, works correctly with seeded rng)
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.slice(0, count);
    }

    static isPawn(piece: Piece): boolean {
        return piece.type === 'pawn';
    }

    static isKnight(piece: Piece): boolean {
        return piece.type === 'knight';
    }

    static isBishop(piece: Piece): boolean {
        return piece.type === 'bishop';
    }

    static isRook(piece: Piece): boolean {
        return piece.type === 'rook';
    }

    static isQueen(piece: Piece): boolean {
        return piece.type === 'queen';
    }

    static isKing(piece: Piece): boolean {
        return piece.type === 'king';
    }

    static isMajorPiece(piece: Piece): boolean {
        return piece.type === 'rook' || piece.type === 'queen';
    }

    static isMinorPiece(piece: Piece): boolean {
        return piece.type === 'bishop' || piece.type === 'knight';
    }

    // High-level presets
    public static stunPiece(game: IChessGame, pieceId: string, turns: number = 2): void {
        // Use domain command instead of direct mutation if available
        game.applyCooldown!(pieceId, turns);
    }

    public static grantExtraTurn(game: IChessGame, playerId: string, count: number = 1): void {
        const color = playerId as any as PieceColor;
        // Use domain command instead of direct mutation if available
        game.grantExtraTurn!(color, count);
    }

    public static removeRandomPieces(game: IChessGame, color: string, type: PieceType, count: number): void {
        const pieces = BoardUtils.findPieces(game, color as any, type);
        const victims = PactUtils.pickRandom(pieces, count);
        victims.forEach(v => PieceUtils.removePiece(game, v.coord));
    }

    public static resurrectRandomPiece = PieceUtils.resurrectRandomPiece;
}

