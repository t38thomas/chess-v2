
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece, PieceColor } from '../../models/Piece';
import { Move } from '../../models/Move';
import { BerserkerBonus, BerserkerMalus } from './TheBerserker';
import { ChessGame } from '../../ChessGame';

describe('The Berserker Pact — BerserkerBonus (Pawn Hunter)', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: BerserkerBonus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new BerserkerBonus();
    });

    it('should trigger frenzy when capturing an enemy PAWN', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const blackPawn = new Piece('pawn', 'black', 'b-pawn');
        const start = new Coordinate(0, 0);
        const captureTarget = new Coordinate(0, 5);

        board.placePiece(start, whiteRook);
        board.placePiece(captureTarget, blackPawn);

        const move = new Move(start, captureTarget, whiteRook, blackPawn);

        const events: any[] = [];
        game.subscribe((event, payload) => {
            if (event === 'pact_effect') events.push(payload);
        });

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.onExecuteMove) {
            modifiers.onExecuteMove(game, move);
        }

        expect(game.pactState['frenzy_white'].isFrenzyActive).toBe(true);
        expect(game.pactState['frenzy_white'].frenzyPieceId).toBe(whiteRook.id);
        expect(events.length).toBe(1);
        expect(events[0].title).toBe('pact.toasts.berserker.frenzy.title');
    });

    it('should NOT trigger frenzy when capturing a non-pawn piece', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const blackKnight = new Piece('knight', 'black', 'b-knight');
        const start = new Coordinate(0, 0);
        const captureTarget = new Coordinate(0, 5);

        board.placePiece(start, whiteRook);
        board.placePiece(captureTarget, blackKnight);

        const move = new Move(start, captureTarget, whiteRook, blackKnight);

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.onExecuteMove) {
            modifiers.onExecuteMove(game, move);
        }

        // Frenzy should NOT be active because we captured a knight, not a pawn
        const state = game.pactState['frenzy_white'];
        expect(!state || state.isFrenzyActive === false).toBe(true);
    });

    it('should prevent capture during frenzy extra move', () => {
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
            expect(true).toBe(false);
        }
    });

    it('should restrict movement to the frenzy piece during extra turn', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const whiteQueen = new Piece('queen', 'white', 'w-queen');
        const start = new Coordinate(0, 0);
        const queenPos = new Coordinate(3, 3);
        board.placePiece(start, whiteRook);
        board.placePiece(queenPos, whiteQueen);

        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: whiteRook.id };
        game.turn = 'white';

        const modifiers = bonus.getRuleModifiers();

        if (modifiers.canMovePiece) {
            // The frenzy piece can move
            expect(modifiers.canMovePiece(game, start)).toBe(true);
            // Other pieces cannot move
            expect(modifiers.canMovePiece(game, queenPos)).toBe(false);
        }
    });

    it('should keep turn with current player during frenzy', () => {
        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: 'w-rook' };

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.modifyNextTurn) {
            expect(modifiers.modifyNextTurn(game, 'white', 'move')).toBe('white');
        }
    });

    it('should clear frenzy state after the extra move', () => {
        board.clear();
        const whiteRook = new Piece('rook', 'white', 'w-rook');
        const start = new Coordinate(0, 0);
        const end = new Coordinate(0, 3);
        board.placePiece(start, whiteRook);

        game.pactState['frenzy_white'] = { isFrenzyActive: true, frenzyPieceId: whiteRook.id };

        const move = new Move(start, end, whiteRook); // Non-capture extra move

        const modifiers = bonus.getRuleModifiers();
        if (modifiers.onExecuteMove) {
            modifiers.onExecuteMove(game, move);
        }

        expect(game.pactState['frenzy_white'].isFrenzyActive).toBe(false);
        expect(game.pactState['frenzy_white'].frenzyPieceId).toBe(null);
    });
});

describe('The Berserker Pact — BerserkerMalus (One-Handed)', () => {
    let game: ChessGame;
    let malus: BerserkerMalus;

    beforeEach(() => {
        game = new ChessGame();
        game.board.setupStandardGame();
        malus = new BerserkerMalus();
    });

    it('should remove one knight on pact_assigned', () => {
        const knightsBefore = game.board.getAllSquares()
            .filter(s => s.piece?.type === 'knight' && s.piece?.color === 'white')
            .length;

        malus.onEvent('pact_assigned', null, { game, playerId: 'white', pactId: 'berserker' });

        const knightsAfter = game.board.getAllSquares()
            .filter(s => s.piece?.type === 'knight' && s.piece?.color === 'white')
            .length;

        expect(knightsBefore).toBe(2);
        expect(knightsAfter).toBe(1);
    });

    it('should not affect the opponent knights', () => {
        malus.onEvent('pact_assigned', null, { game, playerId: 'white', pactId: 'berserker' });

        const blackKnights = game.board.getAllSquares()
            .filter(s => s.piece?.type === 'knight' && s.piece?.color === 'black')
            .length;

        expect(blackKnights).toBe(2);
    });

    it('should not crash if called when no knights remain', () => {
        // Remove all knights first
        game.board.getAllSquares()
            .filter(s => s.piece?.type === 'knight' && s.piece?.color === 'white')
            .forEach(s => game.board.removePiece(s.coordinate));

        // Should not throw
        expect(() => {
            malus.onEvent('pact_assigned', null, { game, playerId: 'white', pactId: 'berserker' });
        }).not.toThrow();
    });
});
