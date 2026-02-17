import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { NecromancerBonus, NecromancerMalus } from './TheNecromancer';
import { ChessGame } from '../../ChessGame';
import { Move } from '../../models/Move';

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

    describe('NecromancerBonus (Reclaimer)', () => {
        it('should resurrect a captured pawn to its starting square', () => {
            const pawn = board.getSquare(new Coordinate(0, 1))!.piece!; // white-pawn-0
            game.history.push(new Move(
                new Coordinate(0, 1),
                new Coordinate(0, 2),
                pawn,
                pawn // Simulate capture of itself for simplicity
            ));

            board.removePiece(new Coordinate(0, 1));

            const success = bonus.activeAbility.execute({ game, playerId: 'white', pactId: 'reclaimer' }, {});

            expect(success).toBe(true);
            expect(board.getSquare(new Coordinate(0, 1))?.piece?.id).toBe('white-pawn-0');
        });

        it('should resurrect a captured rook to its starting square', () => {
            const rook = board.getSquare(new Coordinate(0, 0))!.piece!; // white-rook-0
            game.history.push(new Move(
                new Coordinate(0, 0),
                new Coordinate(0, 1),
                rook,
                rook
            ));

            board.removePiece(new Coordinate(0, 0));

            const success = bonus.activeAbility.execute({ game, playerId: 'white', pactId: 'reclaimer' }, {});

            expect(success).toBe(true);
            expect(board.getSquare(new Coordinate(0, 0))?.piece?.id).toBe('white-rook-0');
        });

        it('should resurrect the second captured rook to its correct starting square', () => {
            const rook7 = board.getSquare(new Coordinate(7, 0))!.piece!; // white-rook-7
            game.history.push(new Move(
                new Coordinate(7, 0),
                new Coordinate(7, 1),
                rook7,
                rook7
            ));

            board.removePiece(new Coordinate(7, 0));

            const success = bonus.activeAbility.execute({ game, playerId: 'white', pactId: 'reclaimer' }, {});

            expect(success).toBe(true);
            expect(board.getSquare(new Coordinate(7, 0))?.piece?.id).toBe('white-rook-7');
        });
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
