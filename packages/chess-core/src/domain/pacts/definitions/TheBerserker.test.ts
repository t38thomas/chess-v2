
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { Move } from '../../models/Move';
import { BerserkerBonus } from './TheBerserker';
import { ChessGame } from '../../ChessGame';

describe('The Berserker Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: BerserkerBonus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new BerserkerBonus();
    });

    it('should trigger frenzy state on capture', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const blackPawn = new Piece('pawn', 'black', 'b-pawn');
        const start = new Coordinate(0, 0);
        const captureTarget = new Coordinate(0, 5);

        board.placePiece(start, whiteRook);
        board.placePiece(captureTarget, blackPawn);

        const move = new Move(start, captureTarget, whiteRook, blackPawn);

        // Execute capture
        const modifiers = bonus.getRuleModifiers();
        if (modifiers.onExecuteMove) {
            modifiers.onExecuteMove(game, move);
        }

        // Check state
        expect(game.pactState['frenzy_white'].isFrenzyActive).toBe(true);
        expect(game.pactState['frenzy_white'].frenzyPieceId).toBe(whiteRook.id);
    });

    it('should prevent capture during frenzy', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const blackPawn = new Piece('pawn', 'black', 'b-pawn');
        const start = new Coordinate(0, 0);
        const captureTarget = new Coordinate(0, 5);
        board.placePiece(start, whiteRook);
        board.placePiece(captureTarget, blackPawn);

        // Simulate frenzy active
        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: whiteRook.id };

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.canCapture) {
            const canCapture = modifiers.canCapture(game, whiteRook, blackPawn, captureTarget, start);
            expect(canCapture).toBe(false);
        } else {
            // If canCapture is not defined, test fails (but we know it is defined)
            expect(true).toBe(false);
        }
    });

    it('should allow non-capture move during frenzy', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const start = new Coordinate(0, 0);
        const moveTarget = new Coordinate(0, 3);
        board.placePiece(start, whiteRook);

        // Simulate frenzy active
        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: whiteRook.id };
        game.turn = 'white';

        const modifiers = bonus.getRuleModifiers();

        // Verify canMovePiece restrictions (only frenzy piece can move)
        if (modifiers.canMovePiece) {
            expect(modifiers.canMovePiece(game, start)).toBe(true);
        }

        // Verify next turn stays with player
        if (modifiers.modifyNextTurn) {
            expect(modifiers.modifyNextTurn(game, 'white', 'move')).toBe('white');
        }
    });

    it('should clear frenzy state after extra move', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const start = new Coordinate(0, 0);
        const end = new Coordinate(0, 3);
        board.placePiece(start, whiteRook);

        // Simulate frenzy active
        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: whiteRook.id };

        const move = new Move(start, end, whiteRook); // Non-capture move

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.onExecuteMove) {
            modifiers.onExecuteMove(game, move);
        }

        expect(game.pactState['frenzy_white'].isFrenzyActive).toBe(false);
        expect(game.pactState['frenzy_white'].frenzyPieceId).toBe(null);
    });
});
