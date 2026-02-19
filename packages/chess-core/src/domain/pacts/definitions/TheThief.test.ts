
import { describe, it, expect, beforeEach } from 'vitest';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { TheThief } from './TheThief';
import { ChessGame } from '../../ChessGame';

describe('The Thief Pact (Balanced)', () => {
    let game: ChessGame;
    const bonus = TheThief.bonus;
    const malus = TheThief.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Pickpocket (Passive Bonus)', () => {
        it('should stun for one turn and then ALLOW movement for one turn (broken perma-lock)', () => {
            game.board.clear();

            // Setup kings
            game.board.placePiece(new Coordinate(0, 0), new Piece('king', 'white', 'white-king'));
            game.board.placePiece(new Coordinate(7, 7), new Piece('king', 'black', 'black-king'));

            const whitePawn = new Piece('pawn', 'white', 'white-pawn-0');
            const blackRook = new Piece('rook', 'black', 'black-rook-0');

            game.board.placePiece(new Coordinate(3, 3), whitePawn);
            game.board.placePiece(new Coordinate(4, 4), blackRook);

            // Assign Thief pact to white
            game.pacts.white = [{
                id: TheThief.id,
                title: 'Thief',
                bonus: { id: 'pickpocket', name: 'pickpocket', icon: '', description: '', ranking: 5, category: 'Movement' },
                malus: { id: 'wanted', name: 'wanted', icon: '', description: '', ranking: -5, category: 'Promotion' },
                description: ''
            }];

            game.phase = 'playing';
            game.turn = 'white';

            // --- TURN 1 (White) ---
            // White moves a piece to trigger Pickpocket for the first time
            const whiteRook = new Piece('rook', 'white', 'white-rook-0');
            game.board.placePiece(new Coordinate(0, 1), whiteRook);
            game.makeMove(new Coordinate(0, 1), new Coordinate(0, 2));

            // Result: Stun triggered at Turn 1. 
            // CD was set to 2. Turn changed to Black -> CD decremented to 1.
            expect(game.totalTurns).toBe(1);
            expect(game.pieceCooldowns.get('black-rook-0')).toBe(1);
            expect(game.turn).toBe('black');

            // --- TURN 2 (Black) ---
            // Black tries to move blocked rook -> SHOULD FAIL
            const canMoveRook = game.makeMove(new Coordinate(4, 4), new Coordinate(4, 5));
            expect(canMoveRook).toBe(false);

            // Black moves King instead
            game.makeMove(new Coordinate(7, 7), new Coordinate(6, 6));

            // Result: totalTurns = 2. Turn change to White.
            // Black pieces CD stay as they were (1) because it's not their turn yet.
            expect(game.totalTurns).toBe(2);
            expect(game.pieceCooldowns.get('black-rook-0')).toBe(1);
            expect(game.turn).toBe('white');

            // --- TURN 3 (White) ---
            // White moves again. Adjacency remains, but history should prevent re-stun.
            // Turn 3 - lastTrigger(1) = 2. Skip stun (require > 2).
            game.makeMove(new Coordinate(0, 2), new Coordinate(0, 3));

            // Result: Stun NOT refreshed. 
            // Turn changed to Black -> Black CD decremented from 1 to 0.
            expect(game.totalTurns).toBe(3);
            expect(game.pieceCooldowns.get('black-rook-0')).toBe(0);
            expect(game.turn).toBe('black');

            // --- TURN 4 (Black) ---
            // Black can finally move the Rook!
            const canFinallyMove = game.makeMove(new Coordinate(4, 4), new Coordinate(4, 5));
            expect(canFinallyMove).toBe(true);
            expect(game.totalTurns).toBe(4);
        });
    });
});
