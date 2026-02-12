"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameFacade = void 0;
const BoardModel_1 = require("../domain/models/BoardModel");
const Coordinate_1 = require("../domain/models/Coordinate");
const MoveGenerator_1 = require("../domain/rules/MoveGenerator");
class GameFacade {
    board;
    turn;
    selectedSquare = null;
    validMoves = [];
    listeners = [];
    // Singleton instance for simplicity if needed, but we'll instantiate it
    constructor() {
        this.board = new BoardModel_1.BoardModel();
        this.board.setupStandardGame();
        this.turn = 'white';
    }
    // State Access
    getViewModel() {
        const squares = [];
        const allSquares = this.board.getAllSquares();
        allSquares.forEach(sq => {
            const coord = sq.coordinate;
            const isSelected = this.selectedSquare ? this.selectedSquare.equals(coord) : false;
            // Check if this square is a valid target for the selected piece
            const isValidTarget = this.validMoves.some(m => m.to.equals(coord));
            // Determine square color based on position
            const isDark = (coord.x + coord.y) % 2 === 1;
            squares.push({
                x: coord.x,
                y: coord.y,
                color: isDark ? 'dark' : 'light',
                piece: sq.piece ? {
                    type: sq.piece.type,
                    color: sq.piece.color,
                    id: sq.piece.id
                } : null,
                isSelected,
                isValidTarget,
                isLastMove: false, // TODO: History tracking
                isCheck: false // TODO: Check detection
            });
        });
        return {
            squares,
            turn: this.turn
        };
    }
    // Actions
    handleSquarePress(x, y) {
        const coord = new Coordinate_1.Coordinate(x, y);
        const square = this.board.getSquare(coord);
        if (this.selectedSquare) {
            // Already selected something.
            // 1. Check if clicking on same square -> Deselect
            if (this.selectedSquare.equals(coord)) {
                this.deselect();
                return;
            }
            // 2. Check if valid move target
            const move = this.validMoves.find(m => m.to.equals(coord));
            if (move) {
                this.executeMove(move);
                return;
            }
            // 3. If clicking another piece of same color -> Select that instead
            if (square?.piece && square.piece.color === this.turn) {
                this.selectSquare(coord);
                return;
            }
            // 4. Clicked empty or invalid -> Deselect
            this.deselect();
        }
        else {
            // Nothing selected.
            // Select if it's a piece of current turn
            if (square?.piece && square.piece.color === this.turn) {
                this.selectSquare(coord);
            }
        }
    }
    selectSquare(coord) {
        this.selectedSquare = coord;
        const square = this.board.getSquare(coord);
        if (square && square.piece) {
            this.validMoves = MoveGenerator_1.MoveGenerator.getPseudoLegalMoves(this.board, square.piece, coord);
        }
        else {
            this.validMoves = [];
        }
        this.notify();
    }
    deselect() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.notify();
    }
    executeMove(move) {
        this.board.movePiece(move.from, move.to);
        this.turn = this.turn === 'white' ? 'black' : 'white';
        this.deselect();
        // Notify handled in deselect
    }
    // Observer Pattern for UI
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
    notify() {
        this.listeners.forEach(l => l());
    }
    reset() {
        this.board.setupStandardGame();
        this.turn = 'white';
        this.deselect();
    }
}
exports.GameFacade = GameFacade;
