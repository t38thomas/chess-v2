import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { SniperBonus, SniperMalus } from './TheSniper';
import { ChessGame } from '../../ChessGame';

describe('The Sniper Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: SniperBonus;
    let malus: SniperMalus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new SniperBonus();
        malus = new SniperMalus();
    });

    describe('SniperBonus (Long Sight)', () => {
        it('should allow Rook to see through one obstacle', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-1');
            const start = new Coordinate(0, 0);
            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(0, 1), whitePawn);

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            // Should be able to move to (0,2), (0,3), etc.
            expect(moves.some(m => m.to.toString() === '0,2')).toBe(true);
            expect(moves.some(m => m.to.toString() === '0,7')).toBe(true);
        });

        it('should allow Rook to capture behind one obstacle', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-1');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-1');

            const start = new Coordinate(4, 4);
            board.placePiece(start, whiteRook);
            board.placePiece(new Coordinate(4, 5), whitePawn); // Friendly obstacle
            board.placePiece(new Coordinate(4, 7), blackPawn); // Target

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: start,
                moves
            });

            const captureMove = moves.find(m => m.to.toString() === '4,7');
            expect(captureMove).toBeDefined();
            expect(captureMove?.capturedPiece).toBeDefined();
        });

        it('should be blocked by two obstacles', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            board.placePiece(new Coordinate(0, 1), new Piece('pawn', 'white', 'p1'));
            board.placePiece(new Coordinate(0, 2), new Piece('pawn', 'white', 'p2'));

            const moves: Move[] = [];
            bonus.getRuleModifiers().onGetPseudoMoves!({
                board,
                piece: whiteRook,
                from: new Coordinate(0, 0),
                moves
            });

            // Should NOT be able to move to (0,3)
            expect(moves.some(m => m.to.toString() === '0,3')).toBe(false);
        });
    });

    describe('SniperMalus (Reload)', () => {
        it('should set cooldown after a Rook capture', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-1');
            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 5), whiteRook, blackPawn);

            malus.getRuleModifiers().onExecuteMove!(game, move);

            expect(game.pieceCooldowns.get(whiteRook.id)).toBe(2);
        });

        it('should block move if cooldown is active', () => {
            const whiteRook = new Piece('rook', 'white', 'white-rook-1');
            board.placePiece(new Coordinate(0, 0), whiteRook);
            game.pieceCooldowns.set(whiteRook.id, 1);

            const canMove = malus.getRuleModifiers().canMovePiece!(game, new Coordinate(0, 0));
            expect(canMove).toBe(false);
        });

        it('should decrement cooldown on turn start', () => {
            const whiteRook = new Piece('rook', 'white', 'white-p1'); // Oops, used wrong prefix in impl?
            // Ah, impl uses id.startsWith(playerId)
            const whiteRookReal = new Piece('rook', 'white', 'white-rook-1');
            game.pieceCooldowns.set(whiteRookReal.id, 2);

            malus.onEvent('turn_start', 'white', { game, playerId: 'white', pactId: 'reload' });

            expect(game.pieceCooldowns.get(whiteRookReal.id)).toBe(1);
        });
    });
});
