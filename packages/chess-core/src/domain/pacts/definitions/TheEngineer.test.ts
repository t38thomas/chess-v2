import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheEngineer } from './TheEngineer';
import { ChessGame } from '../../ChessGame';

describe('The Engineer Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheEngineer.bonus;
    const malus = TheEngineer.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('TurretBonus', () => {
        it('should allow rooks to move 1 square diagonally to an empty square', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteRook);

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            const diagMove = moves.find(m => m.to.x === 5 && m.to.y === 5);
            expect(diagMove).toBeDefined();
            expect(diagMove?.capturedPiece).toBeUndefined();
        });

        it('should allow rooks to capture 1 square diagonally', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-0');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(5, 5);

            board.placePiece(start, whiteRook);
            board.placePiece(target, blackPawn);

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            const captureMove = moves.find(m => m.to.equals(target));
            expect(captureMove).toBeDefined();
            expect(captureMove?.capturedPiece?.id).toBe(blackPawn.id);
        });

        it('should not allow rooks to move diagonally to a square occupied by a friendly piece', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(4, 4);
            const target = new Coordinate(5, 5);

            board.placePiece(start, whiteRook);
            board.placePiece(target, whitePawn);

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            const invalidMove = moves.find(m => m.to.equals(target));
            expect(invalidMove).toBeUndefined();
        });
    });

    describe('DesignFlawMalus', () => {
        it('should block horizontal moves for rooks', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteRook);

            const moves: Move[] = [
                new Move(start, new Coordinate(4, 6), whiteRook), // Vertical
                new Move(start, new Coordinate(6, 4), whiteRook), // Horizontal
                new Move(start, new Coordinate(4, 2), whiteRook), // Vertical
                new Move(start, new Coordinate(2, 4), whiteRook), // Horizontal
            ];

            malus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            expect(moves.length).toBe(2);
            expect(moves.every(m => m.to.x === start.x)).toBe(true);
        });

        it('should not block moves for other pieces', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'white-queen-0');
            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteQueen);

            const moves: Move[] = [
                new Move(start, new Coordinate(6, 4), whiteQueen), // Horizontal
            ];

            malus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteQueen,
                from: start,
                moves
            });

            expect(moves.length).toBe(1);
        });
    });
});
