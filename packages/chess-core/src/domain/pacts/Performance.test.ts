import { describe, it } from 'vitest';
import { ChessGame } from '../ChessGame';
import { TheAlchemist } from './definitions/TheAlchemist';
import { TheSentinel } from './definitions/TheSentinel';
import { TheVoidJumper } from './definitions/TheVoidJumper';
import { TheSniper } from './definitions/TheSniper';
import { MoveGenerator } from '../rules/MoveGenerator';

describe('Pact System Performance', () => {
    it('measures move generation overhead with multiple active pacts', () => {
        const game = new ChessGame({
            activePactsMax: 10,
            pactChoicesAtStart: 10,
        });

        // Assign multiple complex pacts to both players
        const complexPacts = [TheAlchemist, TheSentinel, TheVoidJumper, TheSniper];
        complexPacts.forEach(p => {
            game.assignPact('white', p);
            game.assignPact('black', p);
        });

        game.phase = 'playing';

        const iterations = 100;
        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            // Force full board scan and move generation for all pieces
            const squares = game.board.getAllSquares();
            for (const square of squares) {
                if (square.piece) {
                    const playerPacts = game.pacts[square.piece.color].map(p => [p.bonus, p.malus]).flat();
                    MoveGenerator.getPseudoLegalMoves(
                        game.board,
                        square.piece,
                        square.coordinate,
                        game.enPassantTarget,
                        playerPacts,
                        game.perkUsage[square.piece.color],
                        game
                    );
                }
            }
        }

        const end = performance.now();
        console.log(`[Performance] Generated moves for ${iterations} full board scans in ${(end - start).toFixed(2)}ms`);
        console.log(`[Performance] Average scan time: ${((end - start) / iterations).toFixed(2)}ms`);
    });
});
