"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardModel = exports.Square = void 0;
const Piece_1 = require("./Piece");
const Coordinate_1 = require("./Coordinate");
class Square {
    coordinate;
    piece;
    constructor(coordinate, piece = null) {
        this.coordinate = coordinate;
        this.piece = piece;
    }
}
exports.Square = Square;
class BoardModel {
    squares;
    static SIZE = 8;
    constructor() {
        this.squares = new Map();
        this.initializeEmpty();
    }
    initializeEmpty() {
        this.squares.clear();
        for (let y = 0; y < BoardModel.SIZE; y++) {
            for (let x = 0; x < BoardModel.SIZE; x++) {
                const coord = new Coordinate_1.Coordinate(x, y);
                this.squares.set(coord.toString(), new Square(coord));
            }
        }
    }
    setupStandardGame() {
        this.initializeEmpty();
        const backRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
        // Setup White
        this.setupRow(0, 'white', backRank);
        this.setupPawns(1, 'white');
        // Setup Black
        this.setupPawns(6, 'black');
        this.setupRow(7, 'black', backRank);
    }
    setupRow(y, color, types) {
        types.forEach((type, x) => {
            this.placePiece(new Coordinate_1.Coordinate(x, y), new Piece_1.Piece(type, color, `${color}-${type}-${x}`));
        });
    }
    setupPawns(y, color) {
        for (let x = 0; x < BoardModel.SIZE; x++) {
            this.placePiece(new Coordinate_1.Coordinate(x, y), new Piece_1.Piece('pawn', color, `${color}-pawn-${x}`));
        }
    }
    placePiece(coord, piece) {
        const square = this.getSquare(coord);
        if (square) {
            square.piece = piece;
        }
    }
    getSquare(coord) {
        return this.squares.get(coord.toString());
    }
    movePiece(from, to) {
        const sourceSquare = this.getSquare(from);
        const targetSquare = this.getSquare(to);
        if (sourceSquare && targetSquare && sourceSquare.piece) {
            const piece = sourceSquare.piece;
            piece.hasMoved = true; // Mark as moved
            targetSquare.piece = piece;
            sourceSquare.piece = null;
        }
    }
    getSquaresMap() {
        // Return readonly view or copy if needed, for now direct ref is fine for internal use
        return this.squares;
    }
    getAllSquares() {
        return Array.from(this.squares.values());
    }
}
exports.BoardModel = BoardModel;
