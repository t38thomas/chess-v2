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

            const targetPos = new Coordinate(4, 1); // White Pawn at e2
            const originalPiece = game.board.getSquare(targetPos)!.piece;
            expect(originalPiece).not.toBeNull();

            // Act: Use Displace on the pawn
            // Mock random to pick a specific adjacent square if needed, but here we just check it moved.
            const targetAdjacent = new Coordinate(4, 2); // e3
            const result = game.useAbility('displace', { from: targetPos, to: targetAdjacent });
            expect(result).toBe(true);

            // Verify piece is gone from e2
            expect(game.board.getSquare(targetPos)!.piece).toBeNull();

            // Verify piece is in one of the adjacent squares (d1, d2, d3, e1, e3, f1, f2, f3)
            // But some are occupied or invalid. Empty adjacent ones for e2: d3, e3, f3 (Wait, white pawns are at 1. d1 is backrank, e1 is king?)
            // Standard setup: e2 is surrounded by pieces at rank 0, and pawns at rank 1. 
            // Neighbors: (3,0) (4,0) (5,0) (3,1) (5,1) (3,2) (4,2) (5,2)
            // Empty ones: (3,2), (4,2), (5,2)
            const neighbors = [
                new Coordinate(3, 2), new Coordinate(4, 2), new Coordinate(5, 2)
            ];

            let found = false;
            for (const n of neighbors) {
                const p = game.board.getSquare(n)!.piece;
                if (p && p.id === originalPiece!.id) {
                    found = true;
                    break;
                }
            }
            expect(found).toBe(true);
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

            const targetPos = new Coordinate(4, 1);
            const targetAdjacent = new Coordinate(4, 2);
            expect(game.useAbility('displace', { from: targetPos, to: targetAdjacent })).toBe(true);

            // Try again immediately (on next turn or same turn if repeatable=false)
            // Default repeatable is false.
            expect(game.useAbility('displace', { from: targetPos, to: targetAdjacent })).toBe(false);
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
