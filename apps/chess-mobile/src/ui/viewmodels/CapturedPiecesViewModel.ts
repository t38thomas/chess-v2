import { Piece, PieceColor, PieceType } from 'chess-core';

export type PieceCount = {
    kind: PieceType;
    count: number;
};

export type CapturedRowData = {
    labelKey: string;
    pieces: PieceCount[];
    advantageBadge?: number;
};

export type CapturedPiecesViewModel = {
    topRow: CapturedRowData;
    bottomRow: CapturedRowData;
};

const PIECE_VALUES: Record<PieceType, number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
};

// Sort order: Q, R, B, N, P
const SORT_ORDER: Record<PieceType, number> = {
    queen: 5,
    rook: 4,
    bishop: 3,
    knight: 2,
    pawn: 1,
    king: 0,
};

export class CapturedPiecesLogic {

    static calculate(
        capturedByWhite: Piece[],
        capturedByBlack: Piece[],
        perspective: PieceColor = 'white'
    ): CapturedPiecesViewModel {

        // 1. Calculate Material
        const whiteMaterial = this.calculateMaterial(capturedByBlack); // Captured by Black = White lost
        const blackMaterial = this.calculateMaterial(capturedByWhite); // Captured by White = Black lost
        // Wait for logic check:
        // User wants "Material Diff" based on remaining pieces usually. But here we have captured pieces.
        // Standard Material Calculation: 
        // White Score = Sum(White Pieces on Board).
        // Black Score = Sum(Black Pieces on Board).
        // Advantage = White Score - Black Score.

        // If we only have captured pieces:
        // Initial Material is equal.
        // White Material Loss = Sum(capturedByBlack).
        // Black Material Loss = Sum(capturedByWhite).
        // Net Advantage for White = (Initial - WhiteLoss) - (Initial - BlackLoss)
        //                        = BlackLoss - WhiteLoss
        // So if White captured more value (BlackLoss is high), White is ahead.

        const whiteLostValue = this.sumValue(capturedByBlack);
        const blackLostValue = this.sumValue(capturedByWhite);

        const whiteAdvantage = blackLostValue - whiteLostValue;

        // 2. Prepare Rows based on Perspective
        // Constraint: 
        // TOP = "Pieces you lost" (My pieces captured by Opponent)
        // BOTTOM = "Pieces you captured" (Opponent pieces captured by Me)

        // If Perspective is White:
        // ME = White.
        // TOP = White pieces captured by Black (capturedByBlack)
        // BOTTOM = Black pieces captured by White (capturedByWhite)

        // If Perspective is Black:
        // ME = Black.
        // TOP = Black pieces captured by White (capturedByWhite)
        // BOTTOM = White pieces captured by Black (capturedByBlack)

        let topPieces: Piece[];
        let bottomPieces: Piece[];
        let topAdvantage: number | undefined;
        let bottomAdvantage: number | undefined;

        if (perspective === 'white') {
            topPieces = capturedByBlack;
            bottomPieces = capturedByWhite;

            if (whiteAdvantage < 0) {
                // Black is ahead (White has negative advantage). 
                // Black is "Top" relative to White? No, Top Row is "My Losses". 
                // The Badge requirement: "mostra SOLO a chi è avanti".
                // "Oppure... mostra +N vicino al player in vantaggio nella row coerente".
                // Let's put badge on the row of the player who is winning.
                // If Black is winning, Black has captured more (or valuable) pieces.
                // Black's captured pieces (White's losses) are in TOP row for White.
                // So if Black is winning, badge goes to TOP row?
                // TOP row = "Pieces YOU lost". 
                // If I lost a lot, Opponent is winning.
                // Opponent's advantage is shown where? 
                // "mostra +N vicino al player in vantaggio nella row coerente"
                // Top Row represents Opponent's gains (My losses). So Badge (+N) makes sense there if Opponent is ahead.
                topAdvantage = Math.abs(whiteAdvantage);
            } else if (whiteAdvantage > 0) {
                // White is ahead.
                // Bottom Row = "Pieces I captured".
                // Matches "My gains". Badge (+N) here makes sense.
                bottomAdvantage = whiteAdvantage;
            }
        } else {
            // Perspective Black
            topPieces = capturedByWhite;    // Black lost these
            bottomPieces = capturedByBlack; // Black captured these

            const blackAdvantage = whiteLostValue - blackLostValue; // Reverse of White

            if (blackAdvantage < 0) {
                // White is ahead.
                // White's gains are in TOP row (Black's losses).
                topAdvantage = Math.abs(blackAdvantage);
            } else if (blackAdvantage > 0) {
                // Black is ahead.
                // Black's gains are in BOTTOM row.
                bottomAdvantage = blackAdvantage;
            }
        }

        return {
            topRow: {
                labelKey: 'game.piecesLost',
                pieces: this.aggregate(topPieces),
                advantageBadge: topAdvantage
            },
            bottomRow: {
                labelKey: 'game.piecesCaptured',
                pieces: this.aggregate(bottomPieces),
                advantageBadge: bottomAdvantage
            }
        };
    }

    private static sumValue(pieces: Piece[]): number {
        return pieces.reduce((sum, p) => sum + (PIECE_VALUES[p.type] || 0), 0);
    }

    private static calculateMaterial(pieces: Piece[]): number {
        return this.sumValue(pieces);
    }

    private static aggregate(pieces: Piece[]): PieceCount[] {
        const counts: Record<string, number> = {};

        pieces.forEach(p => {
            // We only care about type for counting, color is implied by the list it's in
            counts[p.type] = (counts[p.type] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([kind, count]) => ({ kind: kind as PieceType, count }))
            .sort((a, b) => (SORT_ORDER[b.kind] || 0) - (SORT_ORDER[a.kind] || 0));
    }
}
