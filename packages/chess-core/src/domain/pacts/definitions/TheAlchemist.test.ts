import { describe, it, expect, beforeEach } from 'vitest';
import { ChessGame } from '../../ChessGame';
import { TheAlchemist } from './TheAlchemist';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';

describe('The Alchemist', () => {
    let game: ChessGame;
    const bonus = TheAlchemist.bonus;
    const malus = TheAlchemist.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Alchemist Bonus: Transmutation', () => {
        it('should swap two friendly pieces', () => {
            const whitePawn1 = game.board.getSquare(new Coordinate(0, 1))?.piece!;
            const whitePawn2 = game.board.getSquare(new Coordinate(1, 1))?.piece!;

            const context = { game, playerId: 'white', pactId: 'transmutation' };
            const result = bonus.activeAbility?.execute(
                bonus.createContextWithState(context as any),
                { from: { x: 0, y: 1 }, to: { x: 1, y: 1 } }
            );

            expect(result).toBe(true);
            expect(game.board.getSquare(new Coordinate(0, 1))?.piece).toBe(whitePawn2);
            expect(game.board.getSquare(new Coordinate(1, 1))?.piece).toBe(whitePawn1);
        });

        it('should not swap enemy pieces', () => {
            const context = { game, playerId: 'white', pactId: 'transmutation' };
            const result = bonus.activeAbility?.execute(
                bonus.createContextWithState(context as any),
                { from: { x: 0, y: 1 }, to: { x: 0, y: 6 } } // White pawn and black pawn
            );

            expect(result).toBe(false);
        });

        it('should not swap the King', () => {
            const context = { game, playerId: 'white', pactId: 'transmutation' };
            const result = bonus.activeAbility?.execute(
                bonus.createContextWithState(context as any),
                { from: { x: 4, y: 0 }, to: { x: 0, y: 1 } } // King and pawn
            );

            expect(result).toBe(false);
        });

        it('should respect maxUses: 2', () => {
            game.phase = 'setup';
            game.assignPact('white', TheAlchemist);
            game.phase = 'playing';

            // First use
            game.turn = 'white';
            let success = game.useAbility('transmutation', { from: { x: 0, y: 1 }, to: { x: 1, y: 1 } });
            expect(success).toBe(true);

            // Cooldown and turn reset for testing
            game.pactState['transmutation_white_cooldown'] = 0;
            game.turn = 'white';

            // Second use
            success = game.useAbility('transmutation', { from: { x: 0, y: 0 }, to: { x: 1, y: 0 } });
            expect(success).toBe(true);

            // Cooldown and turn reset
            game.pactState['transmutation_white_cooldown'] = 0;
            game.turn = 'white';

            // Third use - should fail
            success = game.useAbility('transmutation', { from: { x: 2, y: 0 }, to: { x: 3, y: 0 } });
            expect(success).toBe(false);

            // Check if it's in available abilities
            expect(game.getAvailableAbilities()).not.toContain('transmutation');
        });
    });

    describe('Alchemist Malus: Volatile Reagents', () => {
        it('should stun a piece after a capture', () => {
            const attacker = game.board.getSquare(new Coordinate(0, 1))?.piece!;
            const victim = game.board.getSquare(new Coordinate(0, 6))?.piece!;

            // Minimal mock movement payload
            const movePayload = {
                piece: attacker,
                from: new Coordinate(0, 1),
                to: new Coordinate(0, 6),
                capturedPiece: victim
            };

            malus.onEvent('move', movePayload as any, { game, playerId: 'white', pactId: 'volatile_reagents' } as any);

            expect(game.pieceCooldowns.get(attacker.id)).toBe(2);
        });

        it('should stun a piece after a promotion', () => {
            const attacker = game.board.getSquare(new Coordinate(0, 1))?.piece!;

            const movePayload = {
                piece: attacker,
                from: new Coordinate(0, 1),
                to: new Coordinate(0, 7),
                promotion: 'queen'
            };

            malus.onEvent('move', movePayload as any, { game, playerId: 'white', pactId: 'volatile_reagents' } as any);

            expect(game.pieceCooldowns.get(attacker.id)).toBe(2);
        });
    });
});
