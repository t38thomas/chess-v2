import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { NecromancerBonus, NecromancerMalus } from './TheNecromancer';
import { ChessGame } from '../../ChessGame';

describe('The Necromancer Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: NecromancerBonus;
    let malus: NecromancerMalus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new NecromancerBonus();
        malus = new NecromancerMalus();
    });

    describe('NecromancerMalus (Ascension Cost)', () => {
        it('should emit a toast when a promotion triggers an extra turn for the opponent', () => {
            const events: any[] = [];
            game.subscribe((event, payload) => {
                if (event === 'pact_effect') events.push(payload);
            });

            // Trigger the malus effect
            const modifiers = malus.getRuleModifiers();
            if (modifiers.modifyNextTurn) {
                modifiers.modifyNextTurn(game, 'white', 'promotion');
            }

            expect(events.length).toBe(1);
            expect(events[0].title).toBe('pact.toasts.necromancer.cost.title');
            expect(game.extraTurns['black']).toBe(1);
        });
    });
});
