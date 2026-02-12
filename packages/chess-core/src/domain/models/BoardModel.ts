import { Piece, PieceColor, PieceType } from './Piece';
import { Coordinate } from './Coordinate';

export class Square {
    constructor(
        public readonly coordinate: Coordinate,
        public piece: Piece | null = null
    ) { }
}

export class BoardModel {
    private squares: Map<string, Square>;
    public static readonly SIZE = 8;

    constructor() {
        this.squares = new Map();
        this.initializeEmpty();
    }

    public clear() {
        this.squares.clear();
        for (let y = 0; y < BoardModel.SIZE; y++) {
            for (let x = 0; x < BoardModel.SIZE; x++) {
                const coord = new Coordinate(x, y);
                this.squares.set(coord.toString(), new Square(coord));
            }
        }
    }

    private initializeEmpty() {
        this.clear();
    }

    public setupStandardGame() {
        this.initializeEmpty();

        const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

        // Setup White
        this.setupRow(0, 'white', backRank);
        this.setupPawns(1, 'white');

        // Setup Black
        this.setupPawns(6, 'black');
        this.setupRow(7, 'black', backRank);
    }

    private setupRow(y: number, color: PieceColor, types: PieceType[]) {
        types.forEach((type, x) => {
            this.placePiece(new Coordinate(x, y), new Piece(type, color, `${color}-${type}-${x}`));
        });
    }

    private setupPawns(y: number, color: PieceColor) {
        for (let x = 0; x < BoardModel.SIZE; x++) {
            this.placePiece(new Coordinate(x, y), new Piece('pawn', color, `${color}-pawn-${x}`));
        }
    }

    public placePiece(coord: Coordinate, piece: Piece) {
        const square = this.getSquare(coord);
        if (square) {
            square.piece = piece;
        }
    }

    public getSquare(coord: Coordinate): Square | undefined {
        return this.squares.get(coord.toString());
    }

    public movePiece(from: Coordinate, to: Coordinate): void {
        const sourceSquare = this.getSquare(from);
        const targetSquare = this.getSquare(to);

        if (sourceSquare && targetSquare && sourceSquare.piece) {
            const piece = sourceSquare.piece;
            piece.hasMoved = true; // Mark as moved
            targetSquare.piece = piece;
            sourceSquare.piece = null;
        }
    }

    public removePiece(coord: Coordinate): void {
        const square = this.getSquare(coord);
        if (square) {
            square.piece = null;
        }
    }

    public getSquaresMap(): Map<string, Square> {
        // Return readonly view or copy if needed, for now direct ref is fine for internal use
        return this.squares;
    }

    public getAllSquares(): Square[] {
        return Array.from(this.squares.values());
    }
}
