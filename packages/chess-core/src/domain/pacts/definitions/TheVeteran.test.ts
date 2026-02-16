import { describe, it, expect, beforeEach } from 'vitest';
import { VeteranBonus, VeteranMalus } from './TheVeteran';
import { ChessGame } from '../../ChessGame';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { PactFactory } from '../PactFactory';

describe('The Veteran Pact', () => {
    let game: ChessGame;
    let bonus: VeteranBonus;
    let malus: VeteranMalus;

    beforeEach(() => {
        game = new ChessGame();
        bonus = new VeteranBonus();
        malus = new VeteranMalus();
        PactFactory.initialize();
    });

    describe('Bonus: Bayonet', () => {
        it('should allow Pawns to capture forward', () => {
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            const enemy = new Piece('pawn', 'black', 'b-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 4), pawn);
            game.board.placePiece(new Coordinate(4, 5), enemy);
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'veteran',
                title: 'Veteran',
                bonus: { id: bonus.id, name: 'bayonet', icon: '', description: '', ranking: 1, category: 'Capture' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const moves = game.getLegalMoves(new Coordinate(4, 4));

            // Forward capture: (4, 5)
            const hasForwardCapture = moves.some(m => m.to.x === 4 && m.to.y === 5 && !!m.capturedPiece);
            expect(hasForwardCapture).toBe(true);
        });

        it('should forbid Pawns from capturing diagonally', () => {
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            const enemy = new Piece('pawn', 'black', 'b-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 4), pawn);
            game.board.placePiece(new Coordinate(5, 5), enemy); // Diagonal enemy
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'veteran',
                title: 'Veteran',
                bonus: { id: bonus.id, name: 'bayonet', icon: '', description: '', ranking: 1, category: 'Capture' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const moves = game.getLegalMoves(new Coordinate(4, 4));

            // Diagonal capture: (5, 5) - should be blocked
            const hasDiagonalCapture = moves.some(m => m.to.x === 5 && m.to.y === 5 && !!m.capturedPiece);
            expect(hasDiagonalCapture).toBe(false);
        });
    });

    describe('Malus: Old Guard', () => {
        it('should forbid Pawns from double moving', () => {
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 1), pawn); // Starting position
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'veteran',
                title: 'Veteran',
                bonus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' },
                malus: { id: malus.id, name: 'old_guard', icon: '', description: '', ranking: -1, category: 'Restriction' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const moves = game.getLegalMoves(new Coordinate(4, 1));

            // Single forward: (4, 2)
            // Double forward: (4, 3) - should be blocked
            const hasDoubleMove = moves.some(m => m.to.y === 3);
            expect(hasDoubleMove).toBe(false);
        });
    });
});
