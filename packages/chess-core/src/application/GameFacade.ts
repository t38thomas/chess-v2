import { ChessGame, GameEvent } from '../domain/ChessGame';
import { Coordinate } from '../domain/models/Coordinate';
import { Move } from '../domain/models/Move';
import { PieceType, PieceColor } from '../domain/models/Piece';
import { MoveGenerator } from '../domain/rules/MoveGenerator';
import { CheckDetector } from '../domain/rules/CheckDetector';
import { BoardViewModel, SquareViewModel } from './ViewModels';
import { Pact } from '../domain/models/Pact';

export { GameEvent };

export class GameFacade {
    private game: ChessGame;
    private selectedSquare: Coordinate | null = null;
    private validMoves: Move[] = [];
    private lastMove: { from: Coordinate, to: Coordinate } | null = null;
    private listeners: (() => void)[] = [];
    private playerColor?: PieceColor;

    constructor(
        private onMove?: (move: Move) => void,
        private onEvent?: (event: GameEvent) => void
    ) {
        this.game = new ChessGame();
        this.game.subscribe((event) => {
            if (this.onEvent) this.onEvent(event);
        });
    }

    // State Access
    public getViewModel(): BoardViewModel {
        const squares: SquareViewModel[] = [];
        const allSquares = this.game.board.getAllSquares();

        const color = this.game.turn;
        const playerPacts = this.game.pacts[color].map(p => [p.bonus, p.malus]).flat();
        const whiteInCheck = this.game.isInCheck('white');
        const blackInCheck = this.game.isInCheck('black');

        allSquares.forEach(sq => {
            const coord = sq.coordinate;
            const isSelected = this.selectedSquare ? this.selectedSquare.equals(coord) : false;
            const isValidTarget = this.validMoves.some(m => m.to.equals(coord));
            const isDark = (coord.x + coord.y) % 2 === 1;
            const isLastMove = this.lastMove
                ? (this.lastMove.from.equals(coord) || this.lastMove.to.equals(coord))
                : false;

            const isCheck = sq.piece?.type === 'king' && (
                (sq.piece.color === 'white' && whiteInCheck) ||
                (sq.piece.color === 'black' && blackInCheck)
            );

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
                isLastMove,
                isCheck
            });
        });

        squares.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });

        return {
            squares,
            turn: this.game.turn,
            status: this.game.status,
            history: [], // Placeholder
            phase: this.game.phase,
            pacts: this.game.pacts,
            pendingPromotion: this.game.enPassantTarget ? null : this.getPendingPromotion(),
            winner: this.game.status === 'checkmate' ? (this.game.turn === 'white' ? 'black' : 'white') : undefined
        };
    }

    private getPendingPromotion() {
        // Enforce express or normal promotion check
        const allSquares = this.game.board.getAllSquares();
        for (const sq of allSquares) {
            if (sq.piece?.type === 'pawn') {
                const isExpress = this.game.pacts[sq.piece.color].some(p => [p.bonus, p.malus].some(perk => perk.id === 'express_promotion'));
                const promotionRank = sq.piece.color === 'white' ? (isExpress ? 6 : 7) : (isExpress ? 1 : 0);
                if (sq.coordinate.y === promotionRank) {
                    return { x: sq.coordinate.x, y: sq.coordinate.y, color: sq.piece.color };
                }
            }
        }
        return null;
    }

    public completePromotion(pieceType: PieceType) {
        const pending = this.getPendingPromotion();
        if (pending) {
            const sq = this.game.board.getSquare(new Coordinate(pending.x, pending.y));
            if (sq?.piece) {
                sq.piece.type = pieceType;
                this.notify();
            }
        }
    }

    // Actions
    public handleSquarePress(x: number, y: number, promotion?: PieceType) {
        const coord = new Coordinate(x, y);
        const square = this.game.board.getSquare(coord);

        if (this.selectedSquare) {
            if (this.selectedSquare.equals(coord)) {
                this.deselect();
                return;
            }

            const move = this.validMoves.find(m => m.to.equals(coord));
            if (move) {
                this.executeMove(move, promotion);
                return;
            }

            if (square?.piece && square.piece.color === this.game.turn && this.canSelectPiece(square.piece.color)) {
                this.selectSquare(coord);
                return;
            }

            this.deselect();
        } else {
            if (square?.piece && square.piece.color === this.game.turn && this.canSelectPiece(square.piece.color)) {
                this.selectSquare(coord);
            }
        }
    }

    private canSelectPiece(color: PieceColor): boolean {
        if (this.playerColor) {
            return color === this.playerColor;
        }
        return true;
    }

    private selectSquare(coord: Coordinate) {
        this.selectedSquare = coord;
        const square = this.game.board.getSquare(coord);
        if (square && square.piece) {
            const playerPacts = this.game.pacts[square.piece.color].map(p => [p.bonus, p.malus]).flat();
            const pseudoMoves = MoveGenerator.getPseudoLegalMoves(
                this.game.board,
                square.piece,
                coord,
                this.game.enPassantTarget,
                playerPacts,
                this.game.perkUsage[square.piece.color],
                this.game
            );

            const opponentColor: PieceColor = square.piece.color === 'white' ? 'black' : 'white';
            const opponentPacts = this.game.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

            this.validMoves = pseudoMoves.filter(m =>
                !CheckDetector.wouldLeaveKingInCheck(this.game.board, m.from, m.to, square.piece!.color, opponentPacts)
            );
        } else {
            this.validMoves = [];
        }
        this.notify();
    }

    private deselect() {
        this.selectedSquare = null;
        this.validMoves = [];
        this.notify();
    }

    private executeMove(move: Move, promotion?: PieceType) {
        if (this.onMove) {
            this.onMove(move);
            this.deselect();
            return;
        }

        const success = this.game.makeMove(move.from, move.to, promotion);

        if (success) {
            this.lastMove = { from: move.from, to: move.to };
            this.deselect();
            this.notify();
        }
    }

    // Roguelike Methods
    public assignPact(color: PieceColor, pact: Pact) {
        this.game.assignPact(color, pact);
        this.notify();
    }

    public useAbility(id: string, params?: any) {
        const success = this.game.useAbility(id, params);
        if (success) this.notify();
        return success;
    }

    public getAvailableAbilities(): string[] {
        return this.game.getAvailableAbilities();
    }

    public subscribe(listener: () => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    public reset() {
        this.game.reset();
        this.lastMove = null;
        this.deselect();
        this.notify();
    }

    public setPlayerColor(color: PieceColor) {
        this.playerColor = color;
    }

    public jumpToMove(index: number) {
        this.game.jumpToMove(index);
        this.lastMove = this.game.history.length > 0
            ? { from: this.game.history[this.game.history.length - 1].from, to: this.game.history[this.game.history.length - 1].to }
            : null;
        this.deselect();
        this.notify();
    }

    public undo() {
        this.game.undo();
        this.lastMove = this.game.history.length > 0
            ? { from: this.game.history[this.game.history.length - 1].from, to: this.game.history[this.game.history.length - 1].to }
            : null;
        this.deselect();
        this.notify();
    }

    public syncState(payload: any) {
        if (!payload || !payload.board) return;

        this.game.board.clear();
        payload.board.forEach(([key, sqData]: [string, any]) => {
            if (sqData && sqData.piece) {
                const coord = new Coordinate(sqData.coordinate.x, sqData.coordinate.y);
                this.game.board.placePiece(coord, sqData.piece);
            }
        });

        this.game.turn = payload.turn;
        this.game.status = payload.status || 'active';
        this.game.phase = payload.phase || 'playing';
        this.game.totalTurns = payload.totalTurns || 0;

        // Sync Pacts
        if (payload.pacts) {
            this.game.pacts.white = payload.pacts.white || [];
            this.game.pacts.black = payload.pacts.black || [];
        }

        // Sync Perk Usage
        if (payload.perkUsage) {
            this.game.perkUsage.white = new Set(payload.perkUsage.white || []);
            this.game.perkUsage.black = new Set(payload.perkUsage.black || []);
        }

        // Sync Cooldowns
        if (payload.pieceCooldowns) {
            this.game.pieceCooldowns.clear();
            Object.entries(payload.pieceCooldowns).forEach(([id, turn]) => {
                this.game.pieceCooldowns.set(id, turn as number);
            });
        }

        this.notify();
    }
}
