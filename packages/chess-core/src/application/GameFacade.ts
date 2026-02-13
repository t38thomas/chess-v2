import { ChessGame, GameEvent } from '../domain/ChessGame';
import { Coordinate } from '../domain/models/Coordinate';
import { Move } from '../domain/models/Move';
import { PieceType, PieceColor } from '../domain/models/Piece';
import { MoveGenerator } from '../domain/rules/MoveGenerator';
import { CheckDetector } from '../domain/rules/CheckDetector';
import { BoardViewModel, SquareViewModel, TurnCounter } from './ViewModels';
import { Pact } from '../domain/models/Pact';
import { PactRegistry } from '../domain/pacts/PactRegistry';

export { GameEvent };

export class GameFacade {
    private game: ChessGame;
    private selectedSquare: Coordinate | null = null;
    private validMoves: Move[] = [];
    private lastMove: { from: Coordinate, to: Coordinate } | null = null;
    private listeners: (() => void)[] = [];
    private playerColor?: PieceColor;
    private pendingPromotionMove: Move | null = null;
    private activeAbilityId: string | null = null;
    private pendingTargets: Coordinate[] = [];
    private gameEventListeners: ((event: GameEvent, payload?: any) => void)[] = [];

    constructor(
        private onMove?: (move: Move) => void,
        private onEvent?: (event: GameEvent, payload?: any) => void
    ) {
        this.game = new ChessGame();
        this.game.subscribe((event, payload) => {
            console.log('[GameFacade] Forwarding event:', event, payload);
            if (this.onEvent) this.onEvent(event, payload);
            this.gameEventListeners.forEach(l => l(event, payload));
        });
    }

    public subscribeToGameEvents(listener: (event: GameEvent, payload?: any) => void): () => void {
        this.gameEventListeners.push(listener);
        return () => {
            this.gameEventListeners = this.gameEventListeners.filter(l => l !== listener);
        };
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
                isCheck,
                targetIndex: this.pendingTargets.findIndex(c => c.equals(coord)) !== -1
                    ? this.pendingTargets.findIndex(c => c.equals(coord)) + 1
                    : null
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
            pendingPromotion: this.pendingPromotionMove ? {
                x: this.pendingPromotionMove.to.x,
                y: this.pendingPromotionMove.to.y,
                color: this.pendingPromotionMove.piece.color
            } : null,
            winner: this.game.status === 'checkmate' ? (this.game.turn === 'white' ? 'black' : 'white') : undefined,
            activeAbilityId: this.activeAbilityId,
            pendingTargets: this.pendingTargets.map(c => ({ x: c.x, y: c.y })),
            turnCounters: this.getTurnCounters()
        };
    }

    private getTurnCounters(): Record<PieceColor, TurnCounter[]> {
        const counters: Record<PieceColor, TurnCounter[]> = { white: [], black: [] };

        ['white', 'black'].forEach(c => {
            const color = c as PieceColor;

            // 1. Generic Stun Check (for the victim)
            let maxCooldown = 0;
            this.game.pieceCooldowns.forEach((cd, id) => {
                // Piece ID starts with color (e.g., 'white-rook-0')
                if (id.startsWith(color) && cd > 0) {
                    if (cd > maxCooldown) maxCooldown = cd;
                }
            });

            if (maxCooldown > 0) {
                counters[color].push({
                    id: `stunned_${color}`,
                    label: 'stunned_label',
                    value: maxCooldown,
                    pactId: 'stun', // Virtual pact ID for styling
                    type: 'cooldown'
                });
            }

            // 2. Pact Specific Counters
            const playerPacts = this.game.pacts[color];
            playerPacts.forEach(pact => {
                const registry = PactRegistry.getInstance();
                // Check bonus
                let logic = registry.get(pact.bonus.id);
                if (logic) {
                    counters[color].push(...logic.getTurnCounters({ game: this.game, playerId: color, pactId: pact.bonus.id }) as TurnCounter[]);
                }

                // Check malus
                logic = registry.get(pact.malus.id);
                if (logic) {
                    counters[color].push(...logic.getTurnCounters({ game: this.game, playerId: color, pactId: pact.malus.id }) as TurnCounter[]);
                }
            });
        });

        return counters;
    }

    public completePromotion(pieceType: PieceType) {
        if (this.pendingPromotionMove) {
            const move = this.pendingPromotionMove;
            this.pendingPromotionMove = null;
            this.executeMove(move, pieceType);
        }
    }

    // Actions
    public handleSquarePress(x: number, y: number, promotion?: PieceType) {
        const coord = new Coordinate(x, y);
        const square = this.game.board.getSquare(coord);

        if (this.activeAbilityId) {
            this.handleAbilityTargetPress(x, y);
            return;
        }

        if (this.selectedSquare) {
            if (this.selectedSquare.equals(coord)) {
                this.deselect();
                return;
            }

            const move = this.validMoves.find(m => m.to.equals(coord));
            if (move) {
                // Check if this is a promotion move
                const isPawn = move.piece.type === 'pawn';
                const finalRank = move.piece.color === 'white' ? 7 : 0;

                // Check for express promotion perk
                const playerPacts = this.game.pacts[move.piece.color].map(p => [p.bonus, p.malus]).flat();
                const isExpress = playerPacts.some(p => p.id === 'express_promotion');

                const promotionRank = move.piece.color === 'white' ? (isExpress ? 6 : 7) : (isExpress ? 1 : 0);
                const isPromotionMove = isPawn && move.to.y === promotionRank;

                if (isPromotionMove && !promotion) {
                    this.pendingPromotionMove = move;
                    this.deselect(); // Clear selection but keep pending move
                    this.notify();
                    return;
                }

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
                !CheckDetector.wouldLeaveKingInCheck(this.game.board, m.from, m.to, square.piece!.color, opponentPacts, false, this.game)
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
        const playerPacts = this.game.pacts[this.game.turn].map(p => [p.bonus, p.malus]).flat();
        const perk = playerPacts.find(p => p.id === id);
        const registry = PactRegistry.getInstance();
        const logic = registry.get(id);

        if (logic?.activeAbility && logic.activeAbility.targetType !== 'none' && !params) {
            // Enter targeting mode
            this.activeAbilityId = id;
            this.pendingTargets = [];
            this.deselect(); // Clear piece selection
            this.notify();
            return true;
        }

        const success = this.game.useAbility(id, params);
        if (success) {
            this.activeAbilityId = null;
            this.pendingTargets = [];
            this.notify();
        }
        return success;
    }

    private handleAbilityTargetPress(x: number, y: number) {
        if (!this.activeAbilityId) return;

        const coord = new Coordinate(x, y);

        // Toggle target if already selected
        const existingIdx = this.pendingTargets.findIndex(c => c.equals(coord));
        if (existingIdx !== -1) {
            this.pendingTargets.splice(existingIdx, 1);
            this.notify();
            return;
        }

        this.pendingTargets.push(coord);

        // Check if we have enough targets
        const logic = PactRegistry.getInstance().get(this.activeAbilityId);
        if (!logic?.activeAbility) return;

        let requiredTargets = 0;
        if (this.activeAbilityId === 'transmutation') requiredTargets = 2;
        // Add more abilities here if they have different target requirements

        if (this.pendingTargets.length === requiredTargets) {
            let params: any = {};
            if (this.activeAbilityId === 'transmutation') {
                params = {
                    from: this.pendingTargets[0],
                    to: this.pendingTargets[1]
                };
            }

            const success = this.game.useAbility(this.activeAbilityId, params);
            if (success) {
                this.activeAbilityId = null;
                this.pendingTargets = [];
            }
            // If failed, we keep targets so user can adjust? 
            // Better to clear if it was an invalid selection according to logic
            if (!success) {
                this.pendingTargets = [];
            }
            this.notify();
        } else {
            this.notify();
        }
    }

    public cancelAbility() {
        this.activeAbilityId = null;
        this.pendingTargets = [];
        this.notify();
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
