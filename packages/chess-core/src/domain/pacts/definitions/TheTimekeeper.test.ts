import { describe, it, expect, beforeEach } from 'vitest';
import { TheTimekeeper } from './TheTimekeeper';
import { ChessGame } from '../../ChessGame';
import { BoardModel } from '../../models/BoardModel';
import { Coordinate } from '../../models/Coordinate';
import { Piece } from '../../models/Piece';
import { PactContext } from '../PactLogic';

describe('The Timekeeper', () => {
    let game: ChessGame;
    const timeStop = TheTimekeeper.bonus;
    const paradox = TheTimekeeper.malus;

    beforeEach(() => {
        game = new ChessGame();
        // game.start() is not needed/does not exist, constructor sets up game
    });

    it('should grant an extra turn when Time Stop is activated', () => {
        const initialExtraTurns = game.extraTurns['white'] || 0;

        const context: PactContext = {
            game: game,
            playerId: 'white',
            pactId: TheTimekeeper.id
        };

        // Mock execute if needed, but we are testing the class providing execute
        const result = timeStop.activeAbility!.execute(context, {});

        expect(result).toBe(true);
        expect(game.extraTurns['white']).toBe(initialExtraTurns + 1);
    });

    it('should trigger Paradox and remove up to 3 pawns', () => {
        // Setup board with known pawns
        game.board.clear();
        game.board.placePiece(new Coordinate(0, 1), new Piece('pawn', 'white', 'white-pawn-0'));
        game.board.placePiece(new Coordinate(1, 1), new Piece('pawn', 'white', 'white-pawn-1'));
        game.board.placePiece(new Coordinate(2, 1), new Piece('pawn', 'white', 'white-pawn-2'));
        game.board.placePiece(new Coordinate(3, 1), new Piece('pawn', 'white', 'white-pawn-3'));

        // Ensure there are 4 pawns
        let whitePawns = game.board.getAllSquares()
            .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'pawn');
        expect(whitePawns.length).toBe(4);

        const context: PactContext = {
            game: game,
            playerId: 'white',
            pactId: 'time_stop'
        };

        timeStop.activeAbility!.execute(context, {});

        // Should have 1 pawn left (4 - 3 = 1)
        whitePawns = game.board.getAllSquares()
            .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'pawn');
        expect(whitePawns.length).toBe(1);
    });

    it('should remove all pawns if less than 3 exist', () => {
        // Setup board with 2 pawns
        game.board.clear();
        game.board.placePiece(new Coordinate(0, 1), new Piece('pawn', 'white', 'white-pawn-0'));
        game.board.placePiece(new Coordinate(1, 1), new Piece('pawn', 'white', 'white-pawn-1'));

        let whitePawns = game.board.getAllSquares()
            .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'pawn');
        expect(whitePawns.length).toBe(2);

        const context: PactContext = {
            game: game,
            playerId: 'white',
            pactId: 'time_stop'
        };

        timeStop.activeAbility!.execute(context, {});

        // Should have 0 pawns left
        whitePawns = game.board.getAllSquares()
            .filter(s => s.piece && s.piece.color === 'white' && s.piece.type === 'pawn');
        expect(whitePawns.length).toBe(0);
    });
});
