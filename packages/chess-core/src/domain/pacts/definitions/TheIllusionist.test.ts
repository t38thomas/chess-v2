import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChessGame } from '../../ChessGame';
import { TheIllusionist } from './TheIllusionist';
import { PactFactory } from '../PactFactory';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

describe('The Illusionist Pact', () => {
    let game: ChessGame;
    const bonus = TheIllusionist.bonus;
    const malus = TheIllusionist.malus;

    beforeEach(() => {
        game = new ChessGame();
        PactFactory.initialize();
    });

    describe('IllusionistBonus (Displace)', () => {
        it('should move a piece to an adjacent empty square', () => {
            game.assignPact('white', TheIllusionist);
            game.assignPact('black', {
                id: 'dummy',
                bonus: { id: 'dummy_b', category: 'Action' },
                malus: { id: 'dummy_m', category: 'Passive' }
            } as any);

            const pawns = PactUtils.findPieces(game, 'white', 'pawn');
            expect(pawns.length).toBeGreaterThan(0);
            const targetPos = pawns[0].coord;
            const originalPiece = pawns[0].piece;

            // Act: Use Displace on the pawn
            // Find an adjacent empty square
            let targetAdjacent: Coordinate | null = null;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = targetPos.x + dx;
                    const ny = targetPos.y + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        const sq = game.board.getSquare(new Coordinate(nx, ny));
                        if (sq && !sq.piece) {
                            targetAdjacent = new Coordinate(nx, ny);
                            break;
                        }
                    }
                }
                if (targetAdjacent) break;
            }
            expect(targetAdjacent).not.toBeNull();

            const result = game.useAbility('displace', { from: targetPos, to: targetAdjacent! });
            expect(result).toBe(true);

            // Verify piece is gone from old pos
            expect(game.board.getSquare(targetPos)!.piece).toBeNull();
            // Verify piece is at new pos
            expect(game.board.getSquare(targetAdjacent!)!.piece?.id).toBe(originalPiece.id);

            // Verify turn consumed
            expect(game.turn).toBe('black');
        });

        it('should fail if no adjacent empty squares exist', () => {
            game.assignPact('white', TheIllusionist);
            game.assignPact('black', {
                id: 'dummy',
                bonus: { id: 'dummy_b', category: 'Action' },
                malus: { id: 'dummy_m', category: 'Passive' }
            } as any);

            // Place a piece and surround it with other pieces
            const pos = new Coordinate(4, 4); // e5
            const blocker = new Piece('pawn', 'white', 'blocker');
            game.board.placePiece(pos, new Piece('knight', 'white', 'target'));

            // Surround e5
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    game.board.placePiece(new Coordinate(pos.x + dx, pos.y + dy), blocker);
                }
            }

            const result = game.useAbility('displace', { from: pos, to: new Coordinate(4, 5) });
            expect(result).toBe(false);
        });

        it('should respect cooldown', () => {
            game.assignPact('white', TheIllusionist);
            game.assignPact('black', { id: 'dummy', bonus: { id: 'dummy_b' }, malus: { id: 'dummy_m' } } as any);

            const pawns = PactUtils.findPieces(game, 'white', 'pawn');
            expect(pawns.length).toBeGreaterThan(0);
            const targetPos = pawns[0].coord;

            let targetAdjacent: Coordinate | null = null;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = targetPos.x + dx;
                    const ny = targetPos.y + dy;
                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        const sq = game.board.getSquare(new Coordinate(nx, ny));
                        if (sq && !sq.piece) {
                            targetAdjacent = new Coordinate(nx, ny);
                            break;
                        }
                    }
                }
                if (targetAdjacent) break;
            }

            expect(game.useAbility('displace', { from: targetPos, to: targetAdjacent! })).toBe(true);

            // Try again immediately (on next turn or same turn if repeatable=false)
            // Default repeatable is false.
            expect(game.useAbility('displace', { from: targetPos, to: targetAdjacent! })).toBe(false);
        });
    });

    describe('IllusionistMalus (Vanished Illusion)', () => {
        it('should remove a pawn for both players if both have the pact', () => {
            game.assignPact('white', TheIllusionist);
            game.assignPact('black', TheIllusionist);

            expect(game.phase).toBe('playing');

            const whitePawns = PactUtils.findPieces(game, 'white', 'pawn');
            const blackPawns = PactUtils.findPieces(game, 'black', 'pawn');

            expect(whitePawns.length).toBe(7);
            expect(blackPawns.length).toBe(7);
        });
    });
});

// Import Piece for testing blockers
import { Piece } from '../../models/Piece';
