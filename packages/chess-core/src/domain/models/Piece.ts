
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export class Piece {
    constructor(
        public type: PieceType, // Not readonly - allows promotion
        public readonly color: PieceColor,
        public readonly id: string, // Unique ID for animations and tracking, e.g. "white-pawn-0"
        public hasMoved: boolean = false
    ) { }

    clone(): Piece {
        return new Piece(this.type, this.color, this.id, this.hasMoved);
    }
}
