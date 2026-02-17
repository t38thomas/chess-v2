import { describe, it, expect, beforeEach } from 'vitest';
import { ChessGame } from '../ChessGame';
import { Piece } from '../models/Piece';
import { Coordinate } from '../models/Coordinate';
import { PactFactory } from '../pacts/PactFactory';
import { VigilanceBonus } from '../pacts/definitions/TheSentinel';

describe('MoveGenerator - Pact Capture Validation', () => {
    let game: ChessGame;

    beforeEach(() => {
        game = new ChessGame();
        PactFactory.initialize();
    });

    it('should forbid Knight from capturing a Vigilance-protected piece (Stepping Move)', () => {
        const knight = new Piece('knight', 'white', 'w-knight');
        const blackKing = new Piece('king', 'black', 'b-king');
        const target = new Piece('pawn', 'black', 'b-pawn');

        game.board.clear();
        game.board.placePiece(new Coordinate(2, 2), knight);
        game.board.placePiece(new Coordinate(4, 3), target); // Knight can reach (4,3)
        game.board.placePiece(new Coordinate(4, 4), blackKing); // Adjacent to target

        // Give Black the Sentinel pact
        const sentinelPact = {
            id: 'sentinel',
            title: 'Sentinel',
            bonus: { id: 'vigilance', name: 'Vigilance', icon: '', description: '', ranking: 1, category: 'Defense' },
            malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
        };
        game.pacts.black.push(sentinelPact as any);
        game.phase = 'playing';

        const moves = game.getLegalMoves(new Coordinate(2, 2));
        const canCaptureTarget = moves.some(m => m.to.x === 4 && m.to.y === 3 && !!m.capturedPiece);

        expect(canCaptureTarget).toBe(false);
    });

    it('should forbid Pawn from En Passant capturing a Vigilance-protected piece', () => {
        // En Passant setup:
        // White Pawn at (4, 4)
        // Black Pawn just moved (5, 6) -> (5, 4)
        // enPassantTarget is (5, 5)
        // Capture square is (5, 5), Victim is at (5, 4)
        // Place Black King at (6, 4) (adjacent to (5, 4))

        const whitePawn = new Piece('pawn', 'white', 'w-pawn');
        const blackPawn = new Piece('pawn', 'black', 'b-pawn');
        const blackKing = new Piece('king', 'black', 'b-king');

        game.board.clear();
        game.board.placePiece(new Coordinate(4, 4), whitePawn);
        game.board.placePiece(new Coordinate(5, 4), blackPawn);
        game.board.placePiece(new Coordinate(6, 4), blackKing);
        game.enPassantTarget = new Coordinate(5, 5);

        // Give Black the Sentinel pact
        const sentinelPact = {
            id: 'sentinel',
            title: 'Sentinel',
            bonus: { id: 'vigilance', name: 'Vigilance', icon: '', description: '', ranking: 1, category: 'Defense' },
            malus: { id: 'any', name: 'any', icon: '', description: '', ranking: 0, category: 'None' }
        };
        game.pacts.black.push(sentinelPact as any);
        game.phase = 'playing';

        const moves = game.getLegalMoves(new Coordinate(4, 4));
        const canEnPassant = moves.some(m => m.to.x === 5 && m.to.y === 5 && m.isEnPassant);

        expect(canEnPassant).toBe(false);
    });
});
