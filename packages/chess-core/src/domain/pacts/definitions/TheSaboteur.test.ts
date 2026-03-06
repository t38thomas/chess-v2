import { describe, it, expect, beforeEach } from 'vitest';
import { TheSaboteur } from './TheSaboteur';
import { ChessGame } from '../../ChessGame';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { PactFactory } from '../PactFactory';

describe('The Saboteur Pact', () => {
    let game: ChessGame;
    const bonus = TheSaboteur.bonus;
    const malus = TheSaboteur.malus;

    beforeEach(() => {
        game = new ChessGame();
        PactFactory.initialize();
    });

    describe('Bonus: Diagonal Dash', () => {
        it('should allow Pawns to move diagonally to empty squares', () => {
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 4), pawn);
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'saboteur',
                title: 'Saboteur',
                bonus: { id: bonus.id, name: 'diagonal_dash', icon: '', description: '', ranking: 1, category: 'Movement' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const moves = game.getLegalMoves(new Coordinate(4, 4));

            // Standard forward: (4, 5)
            // Diagonal dash: (3, 5) and (5, 5)
            const hasDiagonalL = moves.some(m => m.to.x === 3 && m.to.y === 5);
            const hasDiagonalR = moves.some(m => m.to.x === 5 && m.to.y === 5);

            expect(hasDiagonalL).toBe(true);
            expect(hasDiagonalR).toBe(true);
        });

        it('should not allow non-pawns to diagonal dash', () => {
            const rook = new Piece('rook', 'white', 'w-rook');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 4), rook);
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'saboteur',
                title: 'Saboteur',
                bonus: { id: bonus.id, name: 'diagonal_dash', icon: '', description: '', ranking: 1, category: 'Movement' },
                malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const moves = game.getLegalMoves(new Coordinate(4, 4));
            const hasDiagonal = moves.some(m => Math.abs(m.to.x - 4) === 1 && Math.abs(m.to.y - 4) === 1);
            expect(hasDiagonal).toBe(false);
        });
    });

    describe('Malus: Cut Supplies', () => {
        it('should not allow promotion to Queen', () => {
            const pawn = new Piece('pawn', 'white', 'w-pawn');
            game.board.clear();
            game.board.placePiece(new Coordinate(4, 6), pawn);
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'wk'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'bk'));

            const pact = {
                id: 'saboteur',
                title: 'Saboteur',
                bonus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' },
                malus: { id: malus.id, name: 'cut_supplies', icon: '', description: '', ranking: -1, category: 'Restriction' }
            };
            game.pacts.white.push(pact as any);
            game.phase = 'playing';

            const result = game.makeMove(new Coordinate(4, 6), new Coordinate(4, 7), 'queen');
            expect(result).toBe(true);

            const promotedPiece = game.board.getSquare(new Coordinate(4, 7))?.piece;
            expect(promotedPiece?.type).toBe('rook');
            expect(promotedPiece?.type).not.toBe('queen');
            expect(promotedPiece?.type).not.toBe('queen');
        });
    });
});
