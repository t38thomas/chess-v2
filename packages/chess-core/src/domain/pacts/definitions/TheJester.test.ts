import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { ChaosBonus, JesterMalus } from './TheJester';
import { ChessGame } from '../../ChessGame';

describe('The Jester Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: ChaosBonus;
    let malus: JesterMalus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new ChaosBonus();
        malus = new JesterMalus();
    });

    describe('Chaos Bonus', () => {
        it('should allow Bishops to move like Knights', () => {
            board.clear();
            const whiteBishop = new Piece('bishop', 'white', 'w-bishop');
            const bishopPos = new Coordinate(4, 4);
            board.placePiece(bishopPos, whiteBishop);

            const moves: any[] = [];
            const modifiers = bonus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({ board, piece: whiteBishop, from: bishopPos, moves });

                // Should find Knight moves
                const knightSquares = [
                    [5, 6], [6, 5], [6, 3], [5, 2],
                    [3, 2], [2, 3], [2, 5], [3, 6]
                ].map(([x, y]) => new Coordinate(x, y));

                knightSquares.forEach(sq => {
                    expect(moves.some(m => m.to.equals(sq))).toBe(true);
                });

                // Should NOT have Bishop moves (e.g., 5,5)
                const diagonalSq = new Coordinate(5, 5);
                expect(moves.some(m => m.to.equals(diagonalSq))).toBe(false);
            } else {
                expect(true).toBe(false);
            }
        });
    });

    describe('Jester Malus', () => {
        it('should make Knights move like Bishops and NOT like Knights', () => {
            board.clear();
            const whiteKnight = new Piece('knight', 'white', 'w-knight');
            const knightPos = new Coordinate(4, 4);
            board.placePiece(knightPos, whiteKnight);

            // Default Knight moves (should be cleared)
            const moves: any[] = [{ to: new Coordinate(5, 6) }];

            const modifiers = malus.getRuleModifiers();
            if (modifiers.onGetPseudoMoves) {
                modifiers.onGetPseudoMoves({ board, piece: whiteKnight, from: knightPos, moves, game, perks: [] });

                // Should NOT have the original Knight move
                expect(moves.some(m => m.to.equals(new Coordinate(5, 6)))).toBe(false);

                // Should have Bishop moves
                expect(moves.some(m => m.to.equals(new Coordinate(5, 5)))).toBe(true);
                expect(moves.some(m => m.to.equals(new Coordinate(7, 7)))).toBe(true);
                expect(moves.some(m => m.to.equals(new Coordinate(3, 3)))).toBe(true);
            } else {
                expect(true).toBe(false);
            }
        });
    });
});
