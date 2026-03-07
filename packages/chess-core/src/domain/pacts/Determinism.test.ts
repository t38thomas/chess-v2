import { describe, it, expect } from 'vitest';
import { ChessGame } from '../ChessGame';
import { TheOracle } from './definitions/TheOracle';
import { Coordinate } from '../models/Coordinate';

describe('Pact Determinism', () => {
    // Simple seedable RNG for testing
    const createSeededRng = (seed: number) => {
        return () => {
            seed = (seed * 16807) % 2147483647;
            return (seed - 1) / 2147483646;
        };
    };

    it('should produce identical outcomes with the same seed (TheOracle)', () => {
        const seed = 12345;

        const createAndRunGame = () => {
            const game = new ChessGame({
                activePactsMax: 1,
                pactChoicesAtStart: 3,
            });
            game.rng = createSeededRng(seed);

            // Setup phase - assigning Oracle to white
            game.assignPact('white', TheOracle);
            game.assignPact('black', TheOracle); // Dummy to move to playing phase

            // Setup a situation where white has a capture opportunity
            // We'll use coords that are valid and available
            const whitePawnPos = new Coordinate(3, 3);
            const blackKnightPos = new Coordinate(4, 4);
            const anotherWhitePawnPos = new Coordinate(2, 1);
            const targetPos = new Coordinate(2, 2);

            const whitePawn = game.board.getSquare(new Coordinate(3, 1))?.piece!;
            const blackKnight = game.board.getSquare(new Coordinate(4, 6))?.piece!;
            const anotherWhitePawn = game.board.getSquare(anotherWhitePawnPos)?.piece!;

            // Force move pieces to specific positions for testing
            game.board.removePiece(new Coordinate(3, 1));
            game.board.removePiece(new Coordinate(4, 6));
            game.board.placePiece(whitePawnPos, whitePawn);
            game.board.placePiece(blackKnightPos, blackKnight); // White pawn can capture knight diagonally

            // Trigger turn start to calculate opportunities
            game.emit('turn_start', 'white');

            // Move another piece to trigger the malus sacrifice
            // We use makeMove directly
            game.makeMove(anotherWhitePawnPos, targetPos);

            // Return pieces remaining for white (one should have been sacrificed randomly)
            return game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white')
                .map(s => `${s.piece!.type}@${s.coordinate.toString()}`);
        };

        const result1 = createAndRunGame();
        const result2 = createAndRunGame();

        // If rng is deterministic, the same piece should be sacrificed in both games
        expect(result1).toEqual(result2);
    });
});
