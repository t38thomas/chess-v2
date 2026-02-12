import { Board, Coordinate, Move, Piece, PieceType, Square } from '../types';
import { getSquare, BOARD_SIZE } from '../board';

// Directions
const ROOK_DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const KNIGHT_DIRS = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
const QUEEN_DIRS = [...ROOK_DIRS, ...BISHOP_DIRS];

export function getPseudoLegalMoves(board: Board, square: Square): Move[] {
    const piece = square.piece;
    if (!piece) return [];

    const moves: Move[] = [];
    const { x, y } = square.coordinate;

    switch (piece.type) {
        case 'pawn':
            // Basic pawn logic (forward 1, capture diagonal)
            const dy = piece.color === 'white' ? 1 : -1;
            const startY = piece.color === 'white' ? 1 : 6;

            // Forward 1
            addMoveIfEmpty(board, x, y + dy, piece, moves, square.coordinate);
            // Double move
            if (y === startY && isEmpty(board, x, y + dy) && isEmpty(board, x, y + dy * 2)) {
                addMoveIfEmpty(board, x, y + dy * 2, piece, moves, square.coordinate);
            }
            // Captures
            addCapture(board, x + 1, y + dy, piece, moves, square.coordinate);
            addCapture(board, x - 1, y + dy, piece, moves, square.coordinate);
            break;

        case 'rook':
            addSlidingMoves(board, x, y, ROOK_DIRS, piece, moves, square.coordinate);
            break;
        case 'bishop':
            addSlidingMoves(board, x, y, BISHOP_DIRS, piece, moves, square.coordinate);
            break;
        case 'queen':
            addSlidingMoves(board, x, y, QUEEN_DIRS, piece, moves, square.coordinate);
            break;
        case 'knight':
            addSteppingMoves(board, x, y, KNIGHT_DIRS, piece, moves, square.coordinate);
            break;
        case 'king':
            addSteppingMoves(board, x, y, QUEEN_DIRS, piece, moves, square.coordinate);
            break;
    }

    return moves;
}

function isEmpty(board: Board, x: number, y: number): boolean {
    const target = getSquare(board, { x, y });
    return !!target && !target.piece;
}

function addMoveIfEmpty(board: Board, x: number, y: number, piece: Piece, moves: Move[], from: Coordinate) {
    if (isEmpty(board, x, y)) {
        moves.push({ from, to: { x, y }, piece });
    }
}

function addCapture(board: Board, x: number, y: number, piece: Piece, moves: Move[], from: Coordinate) {
    const target = getSquare(board, { x, y });
    if (target && target.piece && target.piece.color !== piece.color) {
        moves.push({ from, to: { x, y }, piece, capturedPiece: target.piece });
    }
}

function addSlidingMoves(board: Board, startX: number, startY: number, dirs: number[][], piece: Piece, moves: Move[], from: Coordinate) {
    dirs.forEach(([dx, dy]) => {
        let x = startX + dx;
        let y = startY + dy;
        while (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            const target = getSquare(board, { x, y });
            if (!target) break; // Should not happen with bounds check but safe

            if (!target.piece) {
                moves.push({ from, to: { x, y }, piece });
            } else {
                if (target.piece.color !== piece.color) {
                    moves.push({ from, to: { x, y }, piece, capturedPiece: target.piece });
                }
                break; // Blocked
            }
            x += dx;
            y += dy;
        }
    });
}

function addSteppingMoves(board: Board, startX: number, startY: number, dirs: number[][], piece: Piece, moves: Move[], from: Coordinate) {
    dirs.forEach(([dx, dy]) => {
        const x = startX + dx;
        const y = startY + dy;
        if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
            const target = getSquare(board, { x, y });
            if (target) {
                if (!target.piece || target.piece.color !== piece.color) {
                    moves.push({ from, to: { x, y }, piece, capturedPiece: target.piece || undefined });
                }
            }
        }
    });
}
