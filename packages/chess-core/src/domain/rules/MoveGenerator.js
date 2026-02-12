"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveGenerator = void 0;
const BoardModel_1 = require("../models/BoardModel");
const Coordinate_1 = require("../models/Coordinate");
const Move_1 = require("../models/Move");
class MoveGenerator {
    static ROOK_DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    static BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
    static KNIGHT_DIRS = [[1, 2], [1, -2], [-1, 2], [-1, -2], [2, 1], [2, -1], [-2, 1], [-2, -1]];
    static QUEEN_DIRS = [...MoveGenerator.ROOK_DIRS, ...MoveGenerator.BISHOP_DIRS];
    static getPseudoLegalMoves(board, piece, from) {
        const moves = [];
        const { x, y } = from;
        switch (piece.type) {
            case 'pawn':
                this.addPawnMoves(board, piece, from, moves);
                break;
            case 'rook':
                this.addSlidingMoves(board, from, MoveGenerator.ROOK_DIRS, piece, moves);
                break;
            case 'bishop':
                this.addSlidingMoves(board, from, MoveGenerator.BISHOP_DIRS, piece, moves);
                break;
            case 'queen':
                this.addSlidingMoves(board, from, MoveGenerator.QUEEN_DIRS, piece, moves);
                break;
            case 'knight':
                this.addSteppingMoves(board, from, MoveGenerator.KNIGHT_DIRS, piece, moves);
                break;
            case 'king':
                this.addSteppingMoves(board, from, MoveGenerator.QUEEN_DIRS, piece, moves);
                break;
        }
        return moves;
    }
    static isEmpty(board, x, y) {
        const target = board.getSquare(new Coordinate_1.Coordinate(x, y));
        return !!target && !target.piece;
    }
    static addPawnMoves(board, piece, from, moves) {
        const { x, y } = from;
        const dy = piece.color === 'white' ? 1 : -1;
        const startY = piece.color === 'white' ? 1 : 6;
        const to = new Coordinate_1.Coordinate(x, y + dy);
        // Forward 1
        if (this.isEmpty(board, x, y + dy)) {
            moves.push(new Move_1.Move(from, to, piece));
            // Double move
            if (y === startY && this.isEmpty(board, x, y + dy * 2)) {
                moves.push(new Move_1.Move(from, new Coordinate_1.Coordinate(x, y + dy * 2), piece));
            }
        }
        // Captures
        this.addCapture(board, x + 1, y + dy, piece, moves, from);
        this.addCapture(board, x - 1, y + dy, piece, moves, from);
    }
    static addCapture(board, x, y, piece, moves, from) {
        const target = board.getSquare(new Coordinate_1.Coordinate(x, y));
        if (target && target.piece && target.piece.color !== piece.color) {
            moves.push(new Move_1.Move(from, new Coordinate_1.Coordinate(x, y), piece, target.piece));
        }
    }
    static addSlidingMoves(board, from, dirs, piece, moves) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            let x = startX + dx;
            let y = startY + dy;
            while (x >= 0 && x < BoardModel_1.BoardModel.SIZE && y >= 0 && y < BoardModel_1.BoardModel.SIZE) {
                const coord = new Coordinate_1.Coordinate(x, y);
                const target = board.getSquare(coord);
                if (!target)
                    break;
                if (!target.piece) {
                    moves.push(new Move_1.Move(from, coord, piece));
                }
                else {
                    if (target.piece.color !== piece.color) {
                        moves.push(new Move_1.Move(from, coord, piece, target.piece));
                    }
                    break; // Blocked
                }
                x += dx;
                y += dy;
            }
        });
    }
    static addSteppingMoves(board, from, dirs, piece, moves) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            const x = startX + dx;
            const y = startY + dy;
            if (x >= 0 && x < BoardModel_1.BoardModel.SIZE && y >= 0 && y < BoardModel_1.BoardModel.SIZE) {
                const coord = new Coordinate_1.Coordinate(x, y);
                const target = board.getSquare(coord);
                if (target) {
                    if (!target.piece || target.piece.color !== piece.color) {
                        moves.push(new Move_1.Move(from, coord, piece, target.piece || null));
                    }
                }
            }
        });
    }
}
exports.MoveGenerator = MoveGenerator;
