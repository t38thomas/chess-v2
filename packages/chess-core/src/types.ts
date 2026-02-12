
export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
export type PieceColor = 'white' | 'black';

export interface Piece {
    type: PieceType;
    color: PieceColor;
    id: string; // Unique ID for animations and tracking
    hasMoved?: boolean;
}

export interface Coordinate {
    x: number;
    y: number;
}

export interface Square {
    coordinate: Coordinate;
    piece: Piece | null;
    isValidTarget?: boolean; // UI helper
    isLastMove?: boolean; // UI helper
}

// Map key is "x,y"
export type Board = Map<string, Square>;

export interface Move {
    from: Coordinate;
    to: Coordinate;
    piece: Piece;
    capturedPiece?: Piece;
    isCastling?: boolean;
    isEnPassant?: boolean;
    promotion?: PieceType;
}

export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw';

export interface GameState {
    board: Board;
    turn: PieceColor;
    history: Move[];
    status: GameStatus;
    whiteKing: Coordinate;
    blackKing: Coordinate;
}
