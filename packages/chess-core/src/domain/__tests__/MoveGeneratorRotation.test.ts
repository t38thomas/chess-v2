import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { MoveGenerator } from '../rules/MoveGenerator';
import { Piece } from '../models/Piece';
import { IChessGame } from '../GameTypes';
import { describe, it, expect, test } from 'vitest';

describe('MoveGenerator Rotation Logic', () => {

    test('rotateVector correctly rotates vectors', () => {
        // Forward (White)
        expect(MoveGenerator.rotateVector(0, 1, 0)).toEqual({ dx: 0, dy: 1 });
        expect(MoveGenerator.rotateVector(0, 1, 1)).toEqual({ dx: 1, dy: 0 }); // Right
        expect(MoveGenerator.rotateVector(0, 1, 2)).toEqual({ dx: 0, dy: -1 }); // Down
        expect(MoveGenerator.rotateVector(0, 1, 3)).toEqual({ dx: -1, dy: 0 }); // Left

        // Forward (Black)
        expect(MoveGenerator.rotateVector(0, -1, 0)).toEqual({ dx: 0, dy: -1 });
        expect(MoveGenerator.rotateVector(0, -1, 1)).toEqual({ dx: -1, dy: 0 }); // Left

        // Sanitize output to avoid -0 issues if needed, but usually equality works.
        // If strict match fails on -0, we can zero it out.
        // Update: The previous failure showed -0. Let's precise expectations or fix implementation to avoid -0.
        // Implementation uses `return { dx: dy, dy: -dx }`. If dx=0, -dx is -0.
        // We can simple use `(val) => val === 0 ? 0 : val` helper or just expect -0?
        // Expecting -0 is fine if we construct the object that way, or use Matchers.
        // Let's just fix the test to accept -0 or use explicit 0. 
        // Better: fix implementation to return 0.

    });

    test('Pawn single move respects orientation=1 (90 deg CW)', () => {
        const board = new BoardModel();

        // Setup: White Pawn at (3,3)
        const pawn = new Piece('pawn', 'white', 'p1');
        board.placePiece(new Coordinate(3, 3), pawn);

        // Orientation 1: White forward is Right (+1, 0)
        const gameMock = {
            orientation: 1,
            pieceCooldowns: new Map(),
            perkUsage: { white: new Set(), black: new Set() },
            pacts: { white: [], black: [] }
        } as unknown as IChessGame;

        const moves = MoveGenerator.getPseudoLegalMoves(board, pawn, new Coordinate(3, 3), null, [], new Set(), gameMock);

        // Expect move to (4, 3)
        expect(moves).toEqual(expect.arrayContaining([
            expect.objectContaining({ to: new Coordinate(4, 3) })
        ]));
        // Should NOT move to (3, 4) (Standard Forward)
        expect(moves).not.toEqual(expect.arrayContaining([
            expect.objectContaining({ to: new Coordinate(3, 4) })
        ]));
    });

    test('Pawn capture respects orientation=1', () => {
        const board = new BoardModel();

        // White Pawn at (3,3)
        const pawn = new Piece('pawn', 'white', 'p1');
        board.placePiece(new Coordinate(3, 3), pawn);

        // Enemy at (4, 4) (Right-Up relative to grid) -> Capture Right?
        // Rotated: Forward=(1,0). Right=(0,1). F+R = (1,1).
        // So (3+1, 3+1) = (4,4) should be capturable.
        const enemy1 = new Piece('pawn', 'black', 'e1');
        board.placePiece(new Coordinate(4, 4), enemy1);

        // Enemy at (4, 2) (Right-Down relative to grid) -> Capture Left?
        // Rotated: Forward=(1,0). Left=(0,-1). F+L = (1,-1).
        // So (3+1, 3-1) = (4,2) should be capturable.
        const enemy2 = new Piece('pawn', 'black', 'e2');
        board.placePiece(new Coordinate(4, 2), enemy2);

        const gameMock = {
            orientation: 1,
            pieceCooldowns: new Map(),
            perkUsage: { white: new Set(), black: new Set() },
            pacts: { white: [], black: [] }
        } as unknown as IChessGame;
        const moves = MoveGenerator.getPseudoLegalMoves(board, pawn, new Coordinate(3, 3), null, [], new Set(), gameMock);

        expect(moves).toEqual(expect.arrayContaining([
            expect.objectContaining({ to: new Coordinate(4, 4), capturedPiece: enemy1 }),
            expect.objectContaining({ to: new Coordinate(4, 2), capturedPiece: enemy2 })
        ]));
    });

    test('Pawn respects orientation=2 (180 deg)', () => {
        const board = new BoardModel();
        const pawn = new Piece('pawn', 'white', 'p1');
        board.placePiece(new Coordinate(3, 3), pawn);


        // Orientation 2: Forward is Down (0, -1)
        const gameMock = {
            orientation: 2,
            pieceCooldowns: new Map(),
            perkUsage: { white: new Set(), black: new Set() },
            pacts: { white: [], black: [] }
        } as unknown as IChessGame;
        const moves = MoveGenerator.getPseudoLegalMoves(board, pawn, new Coordinate(3, 3), null, [], new Set(), gameMock);

        expect(moves).toEqual(expect.arrayContaining([
            expect.objectContaining({ to: new Coordinate(3, 2) })
        ]));
    });

    test('Pawn Double Move respecting orientation=1', () => {
        const board = new BoardModel();

        // Pawn at a position that is "Rank 2" relative to orientation=1
        // Orientation=1: White Base is Left (x=0,1).
        // If we place pawn at (1, 3). Forward is (1,0).
        // Should be able to move to (2,3) and (3,3).

        const pawn = new Piece('pawn', 'white', 'p1', false); // hasMoved = false
        board.placePiece(new Coordinate(1, 3), pawn);

        const gameMock = {
            orientation: 1,
            pieceCooldowns: new Map(),
            perkUsage: { white: new Set(), black: new Set() },
            pacts: { white: [], black: [] }
        } as unknown as IChessGame;
        const moves = MoveGenerator.getPseudoLegalMoves(board, pawn, new Coordinate(1, 3), null, [], new Set(), gameMock);

        expect(moves).toEqual(expect.arrayContaining([
            expect.objectContaining({ to: new Coordinate(2, 3) }),
            expect.objectContaining({ to: new Coordinate(3, 3) })
        ]));
    });
});
