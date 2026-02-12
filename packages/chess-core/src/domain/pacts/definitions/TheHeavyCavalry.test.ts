import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Piece } from '../models/Piece';
import { Move } from '../models/Move';
import { HeavyCavalryBonus, HeavyCavalryMalus } from './TheHeavyCavalry';
import { ChessGame } from '../../ChessGame';

describe('Heavy Cavalry Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: HeavyCavalryBonus;
    let malus: HeavyCavalryMalus;

    beforeEach(() => {
        board = new BoardModel();
        game = new ChessGame();
        game.board = board;
        bonus = new HeavyCavalryBonus();
        malus = new HeavyCavalryMalus();
    });

    describe('HeavyCavalryMalus (Heavy Armor)', () => {
        it('should block knight moves if a friendly pawn is in the way (Mao-style)', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteKnight);

            // Place a pawn that blocks (4,4) -> (3,6) and (5,6)
            board.placePiece(new Coordinate(4, 5), whitePawn);

            const moves = [
                new Move(start, new Coordinate(3, 6), whiteKnight), // Should be blocked
                new Move(start, new Coordinate(5, 6), whiteKnight), // Should be blocked
                new Move(start, new Coordinate(6, 5), whiteKnight), // Should be free
            ];

            malus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteKnight,
                from: start,
                moves
            });

            expect(moves.length).toBe(1);
            expect(moves[0].to.toString()).toBe('(6,5)');
        });

        it('should not block moves if the blocking piece is not a friendly pawn', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-0'); // Enemy
            const whiteRook = new Piece('rook', 'white', 'white-rook-0'); // Not a pawn

            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteKnight);

            board.placePiece(new Coordinate(4, 5), blackPawn);
            board.placePiece(new Coordinate(5, 4), whiteRook);

            const moves = [
                new Move(start, new Coordinate(3, 6), whiteKnight), // Path (4,5) occupied by enemy
                new Move(start, new Coordinate(6, 5), whiteKnight), // Path (5,4) occupied by rook
            ];

            malus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteKnight,
                from: start,
                moves
            });

            expect(moves.length).toBe(2);
        });
    });

    describe('HeavyCavalryBonus (Trample)', () => {
        it('should remove adjacent enemy pawns after a knight move', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'white-knight-0');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-0');
            const start = new Coordinate(0, 0);
            const target = new Coordinate(4, 4);

            board.placePiece(target, whiteKnight);
            board.placePiece(new Coordinate(4, 5), blackPawn);
            board.placePiece(new Coordinate(5, 4), new Piece('pawn', 'black', 'black-pawn-1'));
            board.placePiece(new Coordinate(3, 3), new Piece('rook', 'black', 'black-rook-0')); // Not a pawn

            const move = new Move(start, target, whiteKnight);
            bonus.getRuleModifiers().onExecuteMove!(game, move);

            expect(board.getSquare(new Coordinate(4, 5))?.piece).toBeNull();
            expect(board.getSquare(new Coordinate(5, 4))?.piece).toBeNull();
            expect(board.getSquare(new Coordinate(3, 3))?.piece).not.toBeNull();
        });
    });
});
