import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PhoenixBonus, PhoenixMalus } from './ThePhoenix';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { PactContext } from '../PactLogic';

describe('The Phoenix', () => {
    let game: ChessGame;
    let phoenixBonus: PhoenixBonus;
    let phoenixMalus: PhoenixMalus;

    beforeEach(() => {
        game = new ChessGame();
        phoenixBonus = new PhoenixBonus();
        phoenixMalus = new PhoenixMalus();
    });

    describe('Wingless (Malus)', () => {
        it('should remove all rooks when pact is assigned', () => {
            // Setup standard game (has Rooks)
            game.reset(); // Standard setup

            // Verify white has rooks
            const whiteRooksBefore = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'rook');
            expect(whiteRooksBefore.length).toBe(2);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'wingless'
            };

            // Trigger the event
            phoenixMalus.onEvent('pact_assigned', null, context);

            // Verify white rooks are gone
            const whiteRooksAfter = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'rook');
            expect(whiteRooksAfter.length).toBe(0);

            // Verify black rooks are still there
            const blackRooks = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'black' && s.piece.type === 'rook');
            expect(blackRooks.length).toBe(2);
        });
    });

    describe('Rebirth (Bonus)', () => {
        it('should promote a random pawn to Queen when Queen is captured', () => {
            // Setup: Queen and 2 Pawns for White
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const pawn1 = new Piece('pawn', 'white', 'white-pawn-1');
            const pawn2 = new Piece('pawn', 'white', 'white-pawn-2');

            const queenPos = new Coordinate(3, 7);
            const pawn1Pos = new Coordinate(0, 6);
            const pawn2Pos = new Coordinate(1, 6);

            game.board.placePiece(queenPos, queen);
            game.board.placePiece(pawn1Pos, pawn1);
            game.board.placePiece(pawn2Pos, pawn2);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'rebirth'
            };

            // Mock emit to check for toast
            const emitSpy = vi.spyOn(game, 'emit');

            // Simulate capture of the Queen: Remove it from board first (as game would)
            game.board.removePiece(queenPos);

            const payload = {
                capturedPiece: queen,
                attacker: new Piece('rook', 'black', 'black-rook')
            };

            phoenixBonus.onEvent('capture', payload, context);

            // Verify one of the pawns became a Queen
            const queens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');

            // Should be 1 Queen (the promoted pawn)
            expect(queens.length).toBe(1);

            // Verify it was one of the pawns
            const promotedPawnPos = queens[0].coordinate;
            expect(promotedPawnPos).toBeDefined();
            // It should be at (0,6) or (1,6)
            const isPawnPos = (promotedPawnPos.x === 0 && promotedPawnPos.y === 6) ||
                (promotedPawnPos.x === 1 && promotedPawnPos.y === 6);
            expect(isPawnPos).toBe(true);

            // Verify toast emission
            expect(emitSpy).toHaveBeenCalledWith('pact_effect', expect.objectContaining({
                pactId: 'rebirth',
                type: 'bonus'
            }));
        });

        it('should do nothing if Queen is captured but no pawns exist', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const queenPos = new Coordinate(3, 7);
            game.board.placePiece(queenPos, queen);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'rebirth'
            };

            // Simulate capture
            game.board.removePiece(queenPos);

            const payload = {
                capturedPiece: queen
            };

            phoenixBonus.onEvent('capture', payload, context);

            // Should be 0 Queens
            const queens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');
            expect(queens.length).toBe(0);
        });

        it('should only trigger once per game', () => {
            game.board.clear();
            const queen = new Piece('queen', 'white', 'white-queen');
            const pawn1 = new Piece('pawn', 'white', 'white-pawn-1');
            const pawn2 = new Piece('pawn', 'white', 'white-pawn-2'); // Extra pawn for second potential promotion

            const queenPos = new Coordinate(3, 7);
            game.board.placePiece(queenPos, queen);
            game.board.placePiece(new Coordinate(0, 6), pawn1);
            game.board.placePiece(new Coordinate(1, 6), pawn2);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'rebirth'
            };

            // 1st Capture
            game.board.removePiece(queenPos);
            phoenixBonus.onEvent('capture', { capturedPiece: queen }, context);

            // Verify one pawn is now Queen
            let queens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');
            expect(queens.length).toBe(1);

            // Identify the NEW queen
            const newQueen = queens[0].piece!;
            const newQueenPos = queens[0].coordinate;

            // 2nd Capture (Capture the NEW queen)
            game.board.removePiece(newQueenPos);
            phoenixBonus.onEvent('capture', { capturedPiece: newQueen }, context);

            // Verify NO new promotion happened
            // Should be 0 queens now
            queens = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'queen');
            expect(queens.length).toBe(0);

            // One pawn should remain as pawn
            const pawns = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'pawn');
            expect(pawns.length).toBe(1);
        });

        it('should do nothing if a non-Queen piece is captured', () => {
            game.board.clear();
            const rook = new Piece('rook', 'white', 'white-rook');
            const pawn = new Piece('pawn', 'white', 'white-pawn');
            const rookPos = new Coordinate(0, 0);
            game.board.placePiece(rookPos, rook);
            game.board.placePiece(new Coordinate(0, 1), pawn);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'rebirth'
            };

            // Simulate capture
            game.board.removePiece(rookPos);

            const payload = {
                capturedPiece: rook
            };

            phoenixBonus.onEvent('capture', payload, context);

            // Pawn should still be a pawn
            expect(pawn.type).toBe('pawn');
        });
    });
});
