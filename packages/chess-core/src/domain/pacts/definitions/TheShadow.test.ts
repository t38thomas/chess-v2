import { describe, it, expect, beforeEach } from 'vitest';
import { ShadowCloakBonus, BlindLightMalus } from './TheShadow';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';

describe('The Shadow', () => {
    let game: ChessGame;
    let shadowCloakBonus: ShadowCloakBonus;
    let blindLightMalus: BlindLightMalus;

    beforeEach(() => {
        game = new ChessGame();
        shadowCloakBonus = new ShadowCloakBonus();
        blindLightMalus = new BlindLightMalus();
    });

    describe('Shadow Cloak (Bonus)', () => {
        it('should prevent capture of a perimeter piece by a remote attacker', () => {
            const modifiers = shadowCloakBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            // Attacker at H8 (7, 7) - Remote
            const attacker = new Piece('queen', 'black', 'b-q');
            const from = new Coordinate(7, 7);

            // Victim at A1 (0, 0) - Perimeter
            const victim = new Piece('rook', 'white', 'w-r');
            const pos = new Coordinate(0, 0);

            const result = canBeCaptured(game, attacker, victim, pos, from);
            expect(result).toBe(false);
        });

        it('should allow capture of a perimeter piece by an adjacent attacker', () => {
            const modifiers = shadowCloakBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            // Attacker at B2 (1, 1) - Adjacent to A1 (0, 0)
            const attacker = new Piece('pawn', 'black', 'b-p');
            const from = new Coordinate(1, 1);

            // Victim at A1 (0, 0) - Perimeter
            const victim = new Piece('rook', 'white', 'w-r');
            const pos = new Coordinate(0, 0);

            const result = canBeCaptured(game, attacker, victim, pos, from);
            expect(result).toBe(true);
        });

        it('should allow capture of a non-perimeter piece by a remote attacker', () => {
            const modifiers = shadowCloakBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            // Attacker at C8 (2, 7) - Remote
            const attacker = new Piece('rook', 'black', 'b-r');
            const from = new Coordinate(2, 7);

            // Victim at C3 (2, 2) - Not Perimeter
            const victim = new Piece('pawn', 'white', 'w-p');
            const pos = new Coordinate(2, 2);

            const result = canBeCaptured(game, attacker, victim, pos, from);
            expect(result).toBe(true);
        });
    });

    describe('Blind Light (Malus)', () => {
        it('should prevent capture by a piece in the center', () => {
            const modifiers = blindLightMalus.getRuleModifiers();
            const canCapture = modifiers.canCapture!;

            // Attacker at E4 (4, 3) - Central
            const attacker = new Piece('bishop', 'white', 'w-b');
            const from = new Coordinate(4, 3);
            const victim = new Piece('pawn', 'black', 'b-p');
            const to = new Coordinate(6, 5);

            const result = canCapture(game, attacker, victim, to, from);
            expect(result).toBe(false);
        });

        it('should allow capture by a piece not in the center', () => {
            const modifiers = blindLightMalus.getRuleModifiers();
            const canCapture = modifiers.canCapture!;

            // Attacker at H3 (7, 2) - Not Central
            const attacker = new Piece('bishop', 'white', 'w-b');
            const from = new Coordinate(7, 2);
            const victim = new Piece('pawn', 'black', 'b-p');
            const to = new Coordinate(4, 5);

            const result = canCapture(game, attacker, victim, to, from);
            expect(result).toBe(true);
        });
    });
});
