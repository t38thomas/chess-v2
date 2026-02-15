import { IChessGame, GameEvent } from '../GameTypes';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor } from '../models/Piece';

export class PactUtils {
    /**
     * Swaps the pieces at two coordinates.
     * @param game The game instance.
     * @param coord1 The first coordinate.
     * @param coord2 The second coordinate.
     * @returns True if swap was successful, false otherwise.
     */
    public static swapPieces(game: IChessGame, coord1: Coordinate, coord2: Coordinate): boolean {
        const sq1 = game.board.getSquare(coord1);
        const sq2 = game.board.getSquare(coord2);

        if (!sq1 || !sq2) return false;

        const p1 = sq1.piece;
        const p2 = sq2.piece;

        // Even if one is null, we can swap (move to empty square logic if needed, but usually for swaps we expect pieces)
        // For Void Jumper and Alchemist, we usually swap two existing pieces.
        // But let's handle nulls gracefully just in case (moving piece to empty square via swap).

        game.board.removePiece(coord1);
        game.board.removePiece(coord2);

        if (p2) game.board.placePiece(coord1, p2);
        if (p1) game.board.placePiece(coord2, p1);

        return true;
    }

    /**
     * Sacrifices (removes) the most advanced friendly piece.
     * @param game The game instance.
     * @param playerId The color of the player.
     * @param excludeIds Array of piece IDs to exclude from sacrifice (e.g. King).
     * @returns The piece that was sacrificed, or null if none found.
     */
    public static sacrificeMostAdvancedPiece(game: IChessGame, playerId: PieceColor, excludeIds: string[] = []): Piece | null {
        const allPieces = game.board.getAllSquares()
            .map(s => s.piece)
            .filter((p): p is Piece => p !== null && p.color === playerId);

        // Filter out King and excluded IDs
        const candidates = allPieces.filter(p =>
            p.type !== 'king' && !excludeIds.includes(p.id)
        );

        if (candidates.length === 0) return null;

        // Sort by advancement
        // White promotes at y=7, Black at y=0.
        // So for White, higher y is better. For Black, lower y is better.

        // We need coordinates for this. efficient lookup?
        // simple iteration over board squares is safer to get coords.

        const candidateDetails = candidates.map(p => {
            const coord = game.board.getAllSquares().find(s => s.piece === p)?.coordinate;
            return { piece: p, coord };
        }).filter(d => d.coord !== undefined);

        if (candidateDetails.length === 0) return null;

        candidateDetails.sort((a, b) => {
            const yA = a.coord!.y;
            const yB = b.coord!.y;

            if (playerId === 'white') {
                if (yA !== yB) return yB - yA; // Descending Y (7 is best)
            } else {
                if (yA !== yB) return yA - yB; // Ascending Y (0 is best)
            }

            // Tie-breaker: random or predictable? 
            // Let's use x to be deterministic.
            return a.coord!.x - b.coord!.x;
        });

        const victim = candidateDetails[0];

        game.board.removePiece(victim.coord!);

        return victim.piece;
    }
}
