import { Board, Piece, PieceColor, PieceType, Square, Coordinate } from './types';

export const BOARD_SIZE = 8;

export function createBoard(): Board {
    const board = new Map<string, Square>();
    for (let y = 0; y < BOARD_SIZE; y++) {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const key = `${x},${y}`;
            board.set(key, {
                coordinate: { x, y },
                piece: null,
            });
        }
    }
    setupStandardPieces(board);
    return board; // Return the Map directly
}

export function getSquare(board: Board, { x, y }: Coordinate): Square | undefined {
    return board.get(`${x},${y}`);
}

function setupStandardPieces(board: Board) {
    const setupRow = (y: number, color: PieceColor, pieces: PieceType[]) => {
        pieces.forEach((type, x) => {
            const square = board.get(`${x},${y}`);
            if (square) {
                square.piece = { type, color, id: `${color}-${type}-${x}` };
            }
        });
    };

    const pawnsRow = (y: number, color: PieceColor) => {
        for (let x = 0; x < BOARD_SIZE; x++) {
            const square = board.get(`${x},${y}`);
            if (square) {
                square.piece = { type: 'pawn', color, id: `${color}-pawn-${x}` };
            }
        }
    };

    const backRank: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

    setupRow(0, 'white', backRank);
    pawnsRow(1, 'white');
    pawnsRow(6, 'black');
    setupRow(7, 'black', backRank);
}
