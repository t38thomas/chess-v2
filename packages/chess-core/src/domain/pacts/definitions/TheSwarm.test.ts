import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { TheSwarm } from './TheSwarm';
import { ChessGame } from '../../ChessGame';

describe('The Swarm Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    const bonus = TheSwarm.bonus;
    const malus = TheSwarm.malus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
    });

    describe('SwarmBonus (Hydra)', () => {
        it('should emit a toast when a new pawn is spawned', () => {
            board.clear();
            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            board.placePiece(new Coordinate(0, 0), whitePawn);

            const events: any[] = [];
            game.subscribe((event, payload) => {
                if (event === 'pact_effect') events.push(payload);
            });

            // Simulate capture of our own pawn (e.g. by sniper or something)
            const rawContext = { game, playerId: 'white' as any, pactId: 'swarm' };
            const context = bonus.createContextWithState(rawContext);
            const captureMove = new Move(new Coordinate(0, 0), new Coordinate(0, 0), new Piece('rook', 'black', 'b-rook'), whitePawn);
            bonus.onEvent('capture', captureMove, context);


            expect(events.length).toBe(1);
            expect(events[0].title).toBe('pact.toasts.swarm.hydra.title');

        });
    });

    describe('SwarmMalus (Hive Queen)', () => {
        it('should emit a toast when the queen is lost', () => {
            const events: any[] = [];
            game.subscribe((event, payload) => {
                if (event === 'pact_effect') events.push(payload);
            });

            const blackQueen = new Piece('queen', 'black', 'black-queen');
            game.board.placePiece(new Coordinate(0, 0), blackQueen);

            // Assign Swarm pact to black
            game.pacts.black = [{ id: TheSwarm.id, title: 'Swarm', bonus: { id: 'hydra', name: 'hydra', icon: '', description: '', ranking: 5, category: 'Other' }, malus: { id: 'hive_queen', name: 'hive_queen', icon: '', description: '', ranking: -5, category: 'Other' }, description: '' }];

            // Simulate loss of queen
            const captureMove = new Move(new Coordinate(0, 0), new Coordinate(0, 0), new Piece('pawn', 'white', 'white-pawn'), blackQueen);
            const rawContext = { game, playerId: 'black' as const, pactId: 'swarm' };
            const context = malus.createContextWithState(rawContext);

            malus.onEvent('capture', captureMove, context);

            expect(events.length).toBe(1);
            expect(events[0].title).toBe('pact.toasts.swarm.death.title');
            expect(game.status).toBe('checkmate');

        });
    });
});
