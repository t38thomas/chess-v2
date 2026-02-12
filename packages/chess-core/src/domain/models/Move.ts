import { Coordinate } from './Coordinate';
import { Piece, PieceType } from './Piece';

export class Move {
    public promotion?: PieceType; // Mutable to allow setting after move creation

    constructor(
        public readonly from: Coordinate,
        public readonly to: Coordinate,
        public readonly piece: Piece,
        public readonly capturedPiece?: Piece | null,
        public readonly isCastling: boolean = false,
        public readonly isEnPassant: boolean = false,
        public readonly isSwap: boolean = false,
        promotion?: PieceType
    ) {
        this.promotion = promotion;
    }
}
