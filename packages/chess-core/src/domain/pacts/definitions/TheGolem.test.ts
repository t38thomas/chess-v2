import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { TheGolem } from './TheGolem';
import { ChessGame } from '../../ChessGame';

describe('The Golem Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheGolem.bonus;
    const malus = TheGolem.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('Stone Skin Bonus', () => {
        it('should prevent King capture from > 3 squares away', () => {
            board.clear();
            const whiteKing = new Piece('king', 'white', 'w-king');
            const blackQueen = new Piece('queen', 'black', 'b-queen');

            const kingPos = new Coordinate(4, 0);
            const queenPos = new Coordinate(4, 5); // Distance is 5

            board.placePiece(kingPos, whiteKing);
            board.placePiece(queenPos, blackQueen);

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.canBeCaptured) {
                const canCapture = modifiers.canBeCaptured({
                    game, board, attacker: blackQueen, victim: whiteKing, from: queenPos, to: kingPos
                }, { game, playerId: 'white', pactId: bonus.id } as any);
                expect(canCapture).toBe(false);
            } else {
                expect(true).toBe(false); // Hook should be defined
            }
        });

        it('should allow King capture from <= 3 squares away', () => {
            board.clear();
            const whiteKing = new Piece('king', 'white', 'w-king');
            const blackQueen = new Piece('queen', 'black', 'b-queen');

            const kingPos = new Coordinate(4, 0);
            const queenPos = new Coordinate(4, 3); // Distance is 3

            board.placePiece(kingPos, whiteKing);
            board.placePiece(queenPos, blackQueen);

            const modifiers = bonus.getRuleModifiers();
            if (modifiers.canBeCaptured) {
                const canCapture = modifiers.canBeCaptured({
                    game, board, attacker: blackQueen, victim: whiteKing, from: queenPos, to: kingPos
                }, { game, playerId: 'white', pactId: bonus.id } as any);
                expect(canCapture).toBe(true);
            } else {
                expect(true).toBe(false);
            }
        });
    });

    describe('Lead Feet Malus', () => {
        it('should remove diagonal moves for the King', () => {
            board.clear();
            const whiteKing = new Piece('king', 'white', 'w-king');
            const kingPos = new Coordinate(4, 4);
            board.placePiece(kingPos, whiteKing);

            const moves: any[] = [
                { to: new Coordinate(4, 5) }, // Up
                { to: new Coordinate(5, 5) }, // Up-Right (Diagonal)
                { to: new Coordinate(5, 4) }, // Right
                { to: new Coordinate(5, 3) }, // Down-Right (Diagonal)
                { to: new Coordinate(4, 3) }, // Down
                { to: new Coordinate(3, 3) }, // Down-Left (Diagonal)
                { to: new Coordinate(3, 4) }, // Left
                { to: new Coordinate(3, 5) }, // Up-Left (Diagonal)
            ];

            const modifiers = malus.getRuleModifiers();
            if (modifiers.onModifyMoves) {
                let movesAfter = modifiers.onModifyMoves(moves, { board, piece: whiteKing, from: kingPos } as any, { game, playerId: 'white', pactId: malus.id } as any);

                // Should only have 4 moves left (the non-diagonals)
                expect(movesAfter.length).toBe(4);
                expect(movesAfter.every(m => {
                    const dx = Math.abs(m.to.x - kingPos.x);
                    const dy = Math.abs(m.to.y - kingPos.y);
                    return !(dx > 0 && dy > 0 && dx === dy);
                })).toBe(true);
            } else {
                expect(true).toBe(false);
            }
        });

        it('should not affect non-king pieces', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'w-queen');
            const queenPos = new Coordinate(4, 4);
            board.placePiece(queenPos, whiteQueen);

            const moves: any[] = [
                { to: new Coordinate(5, 5) }, // Diagonal
            ];

            const modifiers = malus.getRuleModifiers();
            if (modifiers.onModifyMoves) {
                let movesAfter = modifiers.onModifyMoves(moves, { board, piece: whiteQueen, from: queenPos } as any, { game, playerId: 'white', pactId: malus.id } as any);
                expect(movesAfter.length).toBe(1); // Should still be there
            }
        });
    });
});
