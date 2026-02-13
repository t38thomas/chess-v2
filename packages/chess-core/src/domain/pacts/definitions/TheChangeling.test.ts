import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { Move } from '../../models/Move';
import { ChangelingBonus, ChangelingMalus } from './TheChangeling';
import { ChessGame } from '../../ChessGame';
import { MoveGenerator } from '../../rules/MoveGenerator';

describe('The Changeling Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: ChangelingBonus;
    let malus: ChangelingMalus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new ChangelingBonus();
        malus = new ChangelingMalus();
    });

    describe('ChangelingBonus (Mimicry)', () => {
        it('should trigger mimicry on pawn capture', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const blackPawn = new Piece('pawn', 'black', 'black-pawn-0');
            const start = new Coordinate(3, 3);
            const captureTarget = new Coordinate(4, 4);

            board.placePiece(start, whitePawn);
            board.placePiece(captureTarget, blackPawn);

            const move = new Move(start, captureTarget, whitePawn, blackPawn);

            // Execute capture
            game.turn = 'white';
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onExecuteMove) {
                modifiers.onExecuteMove(game, move);
            }

            // Check if activeMimics has entry
            // We can't access private property easily, but we can check behavior
            const mimics = (bonus as any).activeMimics;
            expect(mimics.has(whitePawn.id)).toBe(true);
        });

        it('should allow pawn to move like the mimicked piece (e.g. Rook)', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const start = new Coordinate(3, 3);
            board.placePiece(start, whitePawn);

            // Force set mimicry to Rook
            (bonus as any).activeMimics.set(whitePawn.id, {
                type: 'rook',
                expiresAtTurn: 100
            });

            const modifiers = bonus.getRuleModifiers();
            const moves: Move[] = [];

            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({
                    board,
                    piece: whitePawn,
                    from: start,
                    moves,
                    game
                });
            }

            // Should have rook moves (horizontal/vertical)
            // e.g. (3, 5) which is 2 squares up
            const rookMove = moves.find(m => m.to.x === 3 && m.to.y === 5);
            expect(rookMove).toBeDefined();
        });
    });

    describe('ChangelingMalus (Unstable Identity)', () => {
        it('should increment turns counter on turn start', () => {
            const context = { game, playerId: 'white' as PieceColor, pactId: 'unstable_identity' };
            malus.onEvent('turn_start', 'white', context);
            expect((malus as any).turnsSinceLastCapture).toBe(1);
        });

        it('should reset turns counter on capture', () => {
            const context = { game, playerId: 'white' as PieceColor, pactId: 'unstable_identity' };
            (malus as any).turnsSinceLastCapture = 3;

            const move = new Move(new Coordinate(0, 0), new Coordinate(0, 1), new Piece('pawn', 'white', 'p1'), new Piece('pawn', 'black', 'p2'));
            malus.onEvent('capture', move, context);

            expect((malus as any).turnsSinceLastCapture).toBe(0);
        });

        it('should demote a piece after 5 turns without capture', () => {
            board.clear();
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            board.placePiece(new Coordinate(0, 0), whiteRook);

            const context = { game, playerId: 'white' as PieceColor, pactId: 'unstable_identity' };
            (malus as any).turnsSinceLastCapture = 4;

            // Trigger the 5th turn
            malus.onEvent('turn_start', 'white', context);

            const piece = board.getSquare(new Coordinate(0, 0))?.piece;
            expect(piece?.type).toBe('pawn');
            expect((malus as any).turnsSinceLastCapture).toBe(0); // Should reset
        });

        it('should not demote King or Pawn', () => {
            board.clear();
            const whiteKing = new Piece('king', 'white', 'white-king-0');
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            board.placePiece(new Coordinate(0, 0), whiteKing);
            board.placePiece(new Coordinate(1, 1), whitePawn);

            const context = { game, playerId: 'white' as PieceColor, pactId: 'unstable_identity' };
            (malus as any).turnsSinceLastCapture = 4;

            malus.onEvent('turn_start', 'white', context);

            expect(board.getSquare(new Coordinate(0, 0))?.piece?.type).toBe('king');
            expect(board.getSquare(new Coordinate(1, 1))?.piece?.type).toBe('pawn');
        });
    });
});
