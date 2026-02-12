"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Move = void 0;
class Move {
    from;
    to;
    piece;
    capturedPiece;
    isCastling;
    isEnPassant;
    promotion;
    constructor(from, to, piece, capturedPiece, isCastling = false, isEnPassant = false, promotion) {
        this.from = from;
        this.to = to;
        this.piece = piece;
        this.capturedPiece = capturedPiece;
        this.isCastling = isCastling;
        this.isEnPassant = isEnPassant;
        this.promotion = promotion;
    }
}
exports.Move = Move;
