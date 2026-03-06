import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TheGladiator } from './TheGladiator';
import { ChessGame } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { PactContext } from '../PactLogic';
import { createGameMock } from '../__test-utils__/pactTestHelpers';
import { IChessGame } from '../../GameTypes';

describe('The Gladiator', () => {
    let game: ChessGame;
    const arenaBonus = TheGladiator.bonus;
    const disarmedMalus = TheGladiator.malus;

    beforeEach(() => {
        game = new ChessGame();
    });

    describe('Disarmed (Malus)', () => {
        it('should remove all bishops when pact is assigned', () => {
            game.reset(); // Standard setup

            // Verify white has bishops
            const whiteBishopsBefore = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'bishop');
            expect(whiteBishopsBefore.length).toBe(2);

            const context: PactContext = {
                game: game,
                playerId: 'white',
                pactId: 'disarmed'
            };

            // Trigger the event
            disarmedMalus.onEvent('pact_assigned', null, context);

            // Verify white bishops are gone
            const whiteBishopsAfter = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'bishop');
            expect(whiteBishopsAfter.length).toBe(0);

            // Verify black bishops are still there
            const blackBishops = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === 'black' && s.piece.type === 'bishop');
            expect(blackBishops.length).toBe(2);
        });
    });

    describe('Arena (Bonus)', () => {
        const whiteContext: any = {
            game: createGameMock(),
            playerId: 'white',
            pactId: 'arena',
            state: {},
            updateState: vi.fn(),
            query: { pieces: vi.fn(() => ({ friendly: vi.fn(() => ({ ofTypes: vi.fn(() => []) })) })) }
        };

        it('should prevent pawn from capturing a piece on a dark square', () => {
            const modifiers = arenaBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('pawn', 'black', 'black-pawn');
            const victim = new Piece('knight', 'white', 'white-knight');

            // a1 is (0,0), which is dark/black (0+0 % 2 === 0)
            const darkSquare = new Coordinate(0, 0);
            const attackerPos = new Coordinate(1, 1);

            const result = canBeCaptured({ game, board: game.board, attacker, victim, to: darkSquare, from: attackerPos }, whiteContext);
            expect(result).toBe(false);
        });

        it('should allow non-pawn to capture a piece on a dark square', () => {
            const modifiers = arenaBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('rook', 'black', 'black-rook');
            const victim = new Piece('knight', 'white', 'white-knight');
            const darkSquare = new Coordinate(0, 0);
            const attackerPos = new Coordinate(0, 5);

            const result = canBeCaptured({ game, board: game.board, attacker, victim, to: darkSquare, from: attackerPos }, whiteContext);
            expect(result).toBe(true);
        });

        it('should allow pawn to capture a piece on a light square', () => {
            const modifiers = arenaBonus.getRuleModifiers();
            const canBeCaptured = modifiers.canBeCaptured!;

            const attacker = new Piece('pawn', 'black', 'black-pawn');
            const victim = new Piece('knight', 'white', 'white-knight');

            // b1 is (1,0), which is light/white (1+0 % 2 === 1)
            const lightSquare = new Coordinate(1, 0);
            const attackerPos = new Coordinate(0, 1);

            const result = canBeCaptured({ game, board: game.board, attacker, victim, to: lightSquare, from: attackerPos }, whiteContext);
            expect(result).toBe(true);
        });
    });
});
