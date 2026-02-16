import { describe, it, expect, beforeEach } from 'vitest';
import { ChessGame } from '../../ChessGame';
import { AlchemistBonus, AlchemistMalus } from './TheAlchemist';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';

describe('The Alchemist', () => {
    let game: ChessGame;
    let bonus: AlchemistBonus;
    let malus: AlchemistMalus;

    beforeEach(() => {
        game = new ChessGame();
        bonus = new AlchemistBonus();
        malus = new AlchemistMalus();
    });

    describe('Alchemist Bonus: Transmutation', () => {
        it('should swap two friendly pieces', () => {
            const whitePawn1 = game.board.getSquare(new Coordinate(0, 1))?.piece!;
            const whitePawn2 = game.board.getSquare(new Coordinate(1, 1))?.piece!;

            const result = bonus.activeAbility?.execute(
                { game, playerId: 'white', pactId: 'transmutation' },
                { from: { x: 0, y: 1 }, to: { x: 1, y: 1 } }
            );

            expect(result).toBe(true);
            expect(game.board.getSquare(new Coordinate(0, 1))?.piece).toBe(whitePawn2);
            expect(game.board.getSquare(new Coordinate(1, 1))?.piece).toBe(whitePawn1);
        });

        it('should not swap enemy pieces', () => {
            const result = bonus.activeAbility?.execute(
                { game, playerId: 'white', pactId: 'transmutation' },
                { from: { x: 0, y: 1 }, to: { x: 0, y: 6 } } // White pawn and black pawn
            );

            expect(result).toBe(false);
        });

        it('should not swap the King', () => {
            const result = bonus.activeAbility?.execute(
                { game, playerId: 'white', pactId: 'transmutation' },
                { from: { x: 4, y: 0 }, to: { x: 0, y: 1 } } // King and pawn
            );

            expect(result).toBe(false);
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

            malus.onEvent('capture', movePayload, { game, playerId: 'white', pactId: 'volatile_reagents' });

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

            malus.onEvent('promotion', movePayload, { game, playerId: 'white', pactId: 'volatile_reagents' });

            expect(game.pieceCooldowns.get(attacker.id)).toBe(2);
        });
    });
});
