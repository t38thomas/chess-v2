import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { Move } from '../../models/Move';
import { SwarmBonus, SwarmMalus } from './TheSwarm';
import { ChessGame } from '../../ChessGame';

describe('The Swarm Pact', () => {
    let board: BoardModel;
    let game: ChessGame;
    let bonus: SwarmBonus;
    let malus: SwarmMalus;

    beforeEach(() => {
        game = new ChessGame();
        board = game.board;
        bonus = new SwarmBonus();
        malus = new SwarmMalus();
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
            const context = { game, playerId: 'white' as any, pactId: 'hydra' };
            const move = { capturedPiece: whitePawn };

            bonus.onEvent('capture', move, context);

            expect(events.length).toBe(1);
            expect(events[0].title).toBe('Hydra Spawn');
        });
    });

    describe('SwarmMalus (Hive Queen)', () => {
        it('should emit a toast when the queen is lost', () => {
            board.clear();
            const whiteQueen = new Piece('queen', 'white', 'white-queen-0');
            board.placePiece(new Coordinate(0, 0), whiteQueen);

            const events: any[] = [];
            game.subscribe((event, payload) => {
                if (event === 'pact_effect') events.push(payload);
            });

            const context = { game, playerId: 'white' as any, pactId: 'hive_queen' };
            const move = { capturedPiece: whiteQueen };

            malus.onEvent('capture', move, context);

            expect(events.length).toBe(1);
            expect(events[0].title).toBe('Hive Queen Fallen');
            expect(game.status).toBe('checkmate');
        });
    });
});
