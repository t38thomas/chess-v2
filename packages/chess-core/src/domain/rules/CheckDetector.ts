import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { PieceColor, PieceType } from '../models/Piece';
import { MoveGenerator } from './MoveGenerator';
import { Perk } from '../models/Pact';

export class CheckDetector {
    /**
     * Check if a square is under attack by the given color
     */
    public static isSquareUnderAttack(
        board: BoardModel,
        square: Coordinate,
        byColor: PieceColor,
        perks: Perk[] = []
    ): boolean {
        // Check all squares for enemy pieces that can attack this square
        const allSquares = board.getAllSquares();

        for (const sq of allSquares) {
            if (!sq.piece || sq.piece.color !== byColor) continue;

            // Generate pseudo-legal moves for this piece
            // NOTE: We pass null for enPassantTarget to avoid infinite recursion
            const moves = MoveGenerator.getPseudoLegalMoves(board, sq.piece, sq.coordinate, null, perks);

            // Check if any move targets our square
            if (moves.some(m => m.to.equals(square))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find the king position for a given color
     */
    public static findKing(board: BoardModel, color: PieceColor): Coordinate | null {
        const allSquares = board.getAllSquares();
        for (const sq of allSquares) {
            if (sq.piece && sq.piece.type === 'king' && sq.piece.color === color) {
                return sq.coordinate;
            }
        }
        return null;
    }

    /**
     * Check if the king of the given color is in check
     */
    public static isKingInCheck(board: BoardModel, kingColor: PieceColor, perks: Perk[] = []): boolean {
        const kingPos = this.findKing(board, kingColor);
        if (!kingPos) return false; // No king found (shouldn't happen in valid game)

        const enemyColor: PieceColor = kingColor === 'white' ? 'black' : 'white';
        // When checking if the king is in check, we must consider the enemy pieces' perks
        return this.isSquareUnderAttack(board, kingPos, enemyColor, perks);
    }

    /**
     * Test if a move would leave the king in check (simulate the move)
     */
    public static wouldLeaveKingInCheck(
        board: BoardModel,
        from: Coordinate,
        to: Coordinate,
        kingColor: PieceColor,
        perks: Perk[] = [],
        isSwap: boolean = false
    ): boolean {
        // We need to simulate the move and check
        const sourceSquare = board.getSquare(from);
        const targetSquare = board.getSquare(to);

        if (!sourceSquare || !targetSquare || !sourceSquare.piece) return true;

        // Store original state
        const originalPiece = sourceSquare.piece;
        const capturedPiece = targetSquare.piece;

        // Simulate move
        targetSquare.piece = originalPiece;
        sourceSquare.piece = isSwap ? capturedPiece : null;

        // Check if king is in check
        // Note: For wouldLeaveKingInCheck, we should consider the CURRENT board context perks
        const inCheck = this.isKingInCheck(board, kingColor, perks);

        // Restore board
        sourceSquare.piece = originalPiece;
        targetSquare.piece = capturedPiece;

        return inCheck;
    }
}
