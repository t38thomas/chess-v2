import { describe, it, expect, beforeAll } from 'vitest';
import { ChessGame } from './ChessGame';
import { PactFactory } from './pacts/PactFactory';

describe('ChessGame Resignation', () => {
    beforeAll(() => {
        PactFactory.initialize();
    });

    it('should allow a player to resign', () => {
        const game = new ChessGame();

        // Setup phase -> Playing phase
        // Assign dummy pacts to start game
        // Assuming default config needs 1 pact per player? 
        // Let's check DEFAULT_MATCH_CONFIG or just force phase.

        // Force phase for testing purpose to avoid complex setup
        game.phase = 'playing';
        game.status = 'active';

        // White resigns
        game.resign('white');

        expect(game.status).toBe('resignation');
        expect(game.winner).toBe('black');
        expect(game.phase).toBe('game_over');
    });

    it('should not allow resignation if game is not active', () => {
        const game = new ChessGame();
        game.phase = 'setup';

        game.resign('white');

        expect(game.status).toBe('active');
        expect(game.winner).toBeUndefined();
    });
});
