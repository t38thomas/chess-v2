import { describe, it, expect, beforeEach } from 'vitest';
import { StealthBonus, BlindLightMalus } from './TheShadow';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';

describe('The Shadow', () => {
    let game: ChessGame;
    let stealthBonus: StealthBonus;
    let blindLightMalus: BlindLightMalus;

    beforeEach(() => {
        game = new ChessGame();
        stealthBonus = new StealthBonus();
        blindLightMalus = new BlindLightMalus();
    });

    describe('Stealth (Bonus)', () => {
        it('should prevent capture of a lateral pawn that has not moved', () => {
            const modifiers = stealthBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('rook', 'black', 'b-r');

            // White Pawn at A2 (0, 1), hasn't moved
            const victim = new Piece('pawn', 'white', 'w-p1');
            victim.hasMoved = false;
            const pos = new Coordinate(0, 1);

            const result = canBeCaptured(game, attacker, victim, pos, new Coordinate(0, 5));
            expect(result).toBe(false);
        });

        it('should allow capture of a lateral pawn that has moved', () => {
            const modifiers = stealthBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('rook', 'black', 'b-r');

            // White Pawn at A3 (0, 2), has moved
            const victim = new Piece('pawn', 'white', 'w-p1');
            victim.hasMoved = true;
            const pos = new Coordinate(0, 2);

            const result = canBeCaptured(game, attacker, victim, pos, new Coordinate(0, 5));
            expect(result).toBe(true);
        });

        it('should allow capture of a non-lateral pawn that has not moved', () => {
            const modifiers = stealthBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('rook', 'black', 'b-r');

            // White Pawn at D2 (3, 1), hasn't moved
            const victim = new Piece('pawn', 'white', 'w-p1');
            victim.hasMoved = false;
            const pos = new Coordinate(3, 1);

            const result = canBeCaptured(game, attacker, victim, pos, new Coordinate(3, 5));
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
