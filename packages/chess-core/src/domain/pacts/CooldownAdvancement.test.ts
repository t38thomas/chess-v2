import { describe, it, expect } from 'vitest';
import { ChessGame } from '../ChessGame';
import { TheAlchemist } from './definitions/TheAlchemist';
import { Coordinate } from '../models/Coordinate';

describe('Cooldown Advancement', () => {
    it('should decrement ability cooldowns when using an ability that consumes a turn', () => {
        const game = new ChessGame({
            activePactsMax: 1,
            pactChoicesAtStart: 3,
        });

        // Setup: Give Alchemist to white
        game.assignPact('white', TheAlchemist);
        game.assignPact('black', TheAlchemist); // Dummy

        // White turn. 
        // We use a valid perk ID from Alchemist (malus is 'volatile_reagents')
        game.abilityCooldowns.white['volatile_reagents'] = 2;

        // Use an ability that consumes a turn (Transmutation)
        const p1Coord = new Coordinate(0, 1);
        const p2Coord = new Coordinate(1, 1);
        const p1 = game.board.getSquare(p1Coord)?.piece!;
        const p2 = game.board.getSquare(p2Coord)?.piece!;

        const success = game.useAbility('transmutation', {
            from: p1Coord,
            to: p2Coord
        });

        expect(success).toBe(true);
        expect(game.turn).toBe('black');

        // Cooldown of 'volatile_reagents' for white should NOT have decremented yet, 
        // because it only decrements when it becomes white's turn again.
        expect(game.abilityCooldowns.white['volatile_reagents']).toBe(2);

        // Now black makes a move
        game.makeMove(new Coordinate(0, 6), new Coordinate(0, 5));

        // Now it is white's turn again.
        expect(game.turn).toBe('white');

        // Cooldown of 'volatile_reagents' should be 1
        expect(game.abilityCooldowns.white['volatile_reagents']).toBe(1);

        // Cooldown of 'transmutation' (which was 2 from useAbility) should be 1
        expect(game.abilityCooldowns.white['transmutation']).toBe(1);
    });

    it('should decrement piece cooldowns correctly', () => {
        const game = new ChessGame();
        game.phase = 'playing';

        const rook = game.board.getSquare(new Coordinate(0, 0))?.piece!;
        game.pieceCooldowns.set(rook.id, 2);

        // White moves another piece
        game.makeMove(new Coordinate(1, 1), new Coordinate(1, 2));

        // Turn is black
        expect(game.pieceCooldowns.get(rook.id)).toBe(2);

        // Black moves
        game.makeMove(new Coordinate(1, 6), new Coordinate(1, 5));

        // Turn is white again
        expect(game.pieceCooldowns.get(rook.id)).toBe(1);
    });
});
