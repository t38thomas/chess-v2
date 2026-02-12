"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Piece = void 0;
class Piece {
    type;
    color;
    id;
    hasMoved;
    constructor(type, color, id, // Unique ID for animations and tracking, e.g. "white-pawn-0"
    hasMoved = false) {
        this.type = type;
        this.color = color;
        this.id = id;
        this.hasMoved = hasMoved;
    }
    clone() {
        return new Piece(this.type, this.color, this.id, this.hasMoved);
    }
}
exports.Piece = Piece;
