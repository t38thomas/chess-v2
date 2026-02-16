import { CapturedPiecesLogic } from './CapturedPiecesViewModel';
import { PieceType, PieceColor, Piece } from 'chess-core';

// Mock Piece
const mockPiece = (type: PieceType, color: PieceColor, id: string): Piece => ({
    type,
    color,
    id,
    hasMoved: false
} as any);

describe('CapturedPiecesLogic', () => {
    it('should return empty rows when no pieces are captured', () => {
        const result = CapturedPiecesLogic.calculate([], []);
        expect(result.topRow.pieces).toEqual([]);
        expect(result.bottomRow.pieces).toEqual([]);
        expect(result.topRow.advantageBadge).toBeUndefined();
        expect(result.bottomRow.advantageBadge).toBeUndefined();
    });

    it('should correctly categorize captured pieces for White perspective', () => {
        // Perspective: White (default)
        // Top = My Losses (White pieces captured by Black)
        // Bottom = My Captures (Black pieces captured by White)

        const capturedByBlack = [mockPiece('pawn', 'white', 'p1')]; // White lost a pawn
        const capturedByWhite = [mockPiece('knight', 'black', 'n1')]; // Black lost a knight

        const result = CapturedPiecesLogic.calculate(capturedByBlack, capturedByWhite, 'white');

        // Top Row: White's Losses
        expect(result.topRow.pieces).toHaveLength(1);
        expect(result.topRow.pieces[0]).toEqual({ kind: 'pawn', count: 1 });

        // Bottom Row: White's Captures
        expect(result.bottomRow.pieces).toHaveLength(1);
        expect(result.bottomRow.pieces[0]).toEqual({ kind: 'knight', count: 1 });
    });

    it('should calculate material advantage for White', () => {
        // White captured Knight (3). Black captured Pawn (1).
        // White Advantage = 3 - 1 = +2.
        // Advantage should be on Bottom Row (White's side/captures).

        const capturedByBlack = [mockPiece('pawn', 'white', 'p1')];
        const capturedByWhite = [mockPiece('knight', 'black', 'n1')];

        const result = CapturedPiecesLogic.calculate(capturedByBlack, capturedByWhite, 'white');

        expect(result.bottomRow.advantageBadge).toBe(2);
        expect(result.topRow.advantageBadge).toBeUndefined();
    });

    it('should calculate material advantage for Black (displayed on Top Row for White perspective)', () => {
        // White captured Pawn (1). Black captured Queen (9).
        // White Advantage = 1 - 9 = -8.
        // Black is ahead by 8.
        // Advantage should be on Top Row (Opponent's side/losses).

        const capturedByBlack = [mockPiece('queen', 'white', 'q1')];
        const capturedByWhite = [mockPiece('pawn', 'black', 'p1')];

        const result = CapturedPiecesLogic.calculate(capturedByBlack, capturedByWhite, 'white');

        expect(result.topRow.advantageBadge).toBe(8);
        expect(result.bottomRow.advantageBadge).toBeUndefined();
    });

    it('should aggregate counts and sort pieces (Q, R, B, N, P)', () => {
        const pieces = [
            mockPiece('pawn', 'black', 'p1'),
            mockPiece('queen', 'black', 'q1'),
            mockPiece('pawn', 'black', 'p2'),
            mockPiece('rook', 'black', 'r1')
        ];

        // White capturing these
        const result = CapturedPiecesLogic.calculate([], pieces, 'white');

        const bottomPieces = result.bottomRow.pieces;

        // Expected order: Queen (1), Rook (1), Pawn (2)
        expect(bottomPieces).toHaveLength(3);
        expect(bottomPieces[0]).toEqual({ kind: 'queen', count: 1 });
        expect(bottomPieces[1]).toEqual({ kind: 'rook', count: 1 });
        expect(bottomPieces[2]).toEqual({ kind: 'pawn', count: 2 });
    });
});
