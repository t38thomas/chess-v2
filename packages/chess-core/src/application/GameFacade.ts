import { ChessGame } from '../domain/ChessGame';
import { GameEvent } from '../domain/GameTypes';
import { Coordinate } from '../domain/models/Coordinate';
import { Move } from '../domain/models/Move';
import { Piece, PieceType, PieceColor } from '../domain/models/Piece';
import { MoveGenerator } from '../domain/rules/MoveGenerator';
import { CheckDetector } from '../domain/rules/CheckDetector';
import { BoardViewModel, SquareViewModel } from './ViewModels';
import { PactDefinition, TurnCounter } from '../domain/pacts/PactLogic';
import { PactRegistry } from '../domain/pacts/PactRegistry';
import { PactUtils } from '../domain/pacts/PactUtils';
import { MatchConfig, DEFAULT_MATCH_CONFIG } from '../domain/models/MatchConfig';
import { StateSyncPayload } from '../types/protocol';

export class GameFacade {
    private game: ChessGame;
    private selectedSquare: Coordinate | null = null;
    private validMoves: Move[] = [];
    private lastMove: { from: Coordinate, to: Coordinate } | null = null;
    private listeners: (() => void)[] = [];
    private playerColor?: PieceColor;
    private pendingPromotionMove: Move | null = null;
    private _activeAbilityId: string | null = null;
    private pendingTargets: Coordinate[] = [];
    private gameEventListeners: ((event: GameEvent, payload?: unknown) => void)[] = [];

    constructor(
        private matchConfig: MatchConfig = DEFAULT_MATCH_CONFIG,
        private onMove?: (move: Move) => void,
        private onEvent?: (event: GameEvent, payload?: unknown) => void,
        private onUseAbility?: (abilityId: string, params?: unknown) => void
    ) {
        this.game = new ChessGame(matchConfig);
        this.game.subscribe((event, payload) => {
            console.log('[GameFacade] Forwarding event:', event, payload);
            if (this.onEvent) this.onEvent(event, payload);
            this.gameEventListeners.forEach(l => l(event, payload));
        });
    }

    public subscribeToGameEvents(listener: (event: GameEvent, payload?: unknown) => void): () => void {
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
        const opponentColor = color === 'white' ? 'black' : 'white';
        const opponentPacts = this.game.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

        const whiteInCheck = this.game.isInCheck('white');
        const blackInCheck = this.game.isInCheck('black');

        // Oracle Prescience Check
        const hasPrescience = playerPacts.some(p => p.id === 'prescience');
        const attackedSquares = new Set<string>();

        if (hasPrescience) {
            const opponentPieces = PactUtils.findPieces(this.game, opponentColor);
            for (const { piece, coord } of opponentPieces) {
                // SPECIAL HANDLING FOR PAWNS
                // Pawns attack diagonally — only highlight if the diagonal square is EMPTY
                if (piece.type === 'pawn') {
                    const direction = piece.color === 'white' ? 1 : -1;
                    const attackY = coord.y + direction;

                    const leftAttack = new Coordinate(coord.x - 1, attackY);
                    const rightAttack = new Coordinate(coord.x + 1, attackY);

                    if (leftAttack.isValid() && !this.game.board.getSquare(leftAttack)?.piece)
                        attackedSquares.add(leftAttack.toString());
                    if (rightAttack.isValid() && !this.game.board.getSquare(rightAttack)?.piece)
                        attackedSquares.add(rightAttack.toString());
                    continue;
                }

                // General moves for others
                const moves = MoveGenerator.getPseudoLegalMoves(
                    this.game.board,
                    piece,
                    coord,
                    this.game.enPassantTarget,
                    opponentPacts,
                    this.game.perkUsage[opponentColor],
                    this.game
                );

                for (const move of moves) {
                    // SPECIAL HANDLING FOR KING: Filter out castling
                    if (piece.type === 'king') {
                        if (Math.abs(move.to.x - coord.x) > 1) continue;
                    }
                    // Only highlight EMPTY squares — warning: "don't move here or you'll be captured"
                    const targetSq = this.game.board.getSquare(move.to);
                    if (!targetSq?.piece) {
                        attackedSquares.add(move.to.toString());
                    }
                }
            }
        }

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
                isAttacked: attackedSquares.has(coord.toString()),
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
            capturedPieces: {
                white: this.game.capturedPieces.white.map(p => ({ type: p.type, color: p.color, id: p.id })),
                black: this.game.capturedPieces.black.map(p => ({ type: p.type, color: p.color, id: p.id }))
            },
            pendingPromotion: this.pendingPromotionMove ? {
                x: this.pendingPromotionMove.to.x,
                y: this.pendingPromotionMove.to.y,
                color: this.pendingPromotionMove.piece.color
            } : null,
            winner: this.game.winner,
            activeAbilityId: this._activeAbilityId,
            pendingTargets: this.pendingTargets.map(c => ({ x: c.x, y: c.y })),
            turnCounters: this.getTurnCounters(),
            matchConfig: this.game.matchConfig,
            orientation: this.game.orientation,
            totalTurns: this.game.totalTurns
        };
    }

    private getTurnCounters(): Record<PieceColor | 'both', TurnCounter[]> {
        const counters: Record<PieceColor | 'both', TurnCounter[]> = { white: [], black: [], both: [] };

        // 0. Board Orientation Counter (Compass)
        // We show it for both players if enabled
        if (this.game.matchConfig.enableTurnRotate90) {
            const directions = ['north', 'east', 'south', 'west'];
            const icons = ['arrow-up', 'arrow-right', 'arrow-down', 'arrow-left'];
            const orientation = this.game.orientation % 4;

            counters.both.push({
                id: 'board_orientation',
                label: 'orientation_label',
                value: orientation,
                pactId: 'compass', // Virtual pact ID
                type: 'counter',
                subLabel: directions[orientation],
                maxValue: 3
            });
        }

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
        if (this.onMove && this.playerColor) {
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
    public assignPact(color: PieceColor, pact: PactDefinition) {
        this.game.assignPact(color, pact);
        this.notify();
    }

    public useAbility(id: string, params?: unknown) {
        const playerPacts = this.game.pacts[this.game.turn].map(p => [p.bonus, p.malus]).flat();
        const perk = playerPacts.find(p => p.id === id);
        const registry = PactRegistry.getInstance();
        const logic = registry.get(id);

        if (logic?.activeAbility && logic.activeAbility.targetType !== 'none' && !params) {
            // Enter targeting mode
            this._activeAbilityId = id;
            this.pendingTargets = [];
            this.deselect(); // Clear piece selection
            this.notify();
            return true;
        }

        // Online handling: if we have onUseAbility, delegate to it
        if (this.onUseAbility && this.playerColor) {
            this.onUseAbility(id, params);
            this._activeAbilityId = null;
            this.pendingTargets = [];
            this.notify();
            return true;
        }

        const success = this.game.useAbility(id, params);
        if (success) {
            this._activeAbilityId = null;
            this.pendingTargets = [];
            this.notify();
        }
        return success;
    }

    private handleAbilityTargetPress(x: number, y: number) {
        if (!this._activeAbilityId) return;

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
        const logic = PactRegistry.getInstance().get(this._activeAbilityId);
        if (!logic?.activeAbility) return;

        // Determine required targets: use maxTargets if defined, fallback to targetType or hardcoded logic
        let requiredTargets = logic.activeAbility.maxTargets ?? 0;

        // Backward compatibility for old hardcoded abilities if maxTargets is not set
        if (requiredTargets === 0 && logic.activeAbility.targetType !== 'none') {
            if (this._activeAbilityId === 'transmutation' || this._activeAbilityId === 'void_jump') {
                requiredTargets = 2;
            } else {
                requiredTargets = 1;
            }
        }

        if (this.pendingTargets.length === requiredTargets) {
            let params: unknown = undefined;
            if (requiredTargets === 2) {
                params = {
                    from: this.pendingTargets[0],
                    to: this.pendingTargets[1]
                } as Record<string, unknown>;
            } else if (requiredTargets === 1) {
                params = this.pendingTargets[0];
            }

            const success = this.useAbility(this._activeAbilityId, params);
            if (success) {
                this._activeAbilityId = null;
                this.pendingTargets = [];
            } else {
                this.pendingTargets = [];
            }
            this.notify();
        } else {
            this.notify();
        }
    }

    public cancelAbility() {
        this._activeAbilityId = null;
        this.pendingTargets = [];
        this.notify();
    }

    public get activeAbilityId(): string | null {
        return this._activeAbilityId;
    }

    public get orientation(): number {
        return this.game.orientation;
    }

    public rotateBoard(): boolean {
        // In Local Match: Directly call game.rotateBoard
        // In Online Match: This should be handled by Engine/Server, but Facade usually wraps local game logic.
        // For now, allow local execution.
        const result = this.game.rotateBoard();
        if (result) {
            this.notify();
        }
        return result;
    }

    public resign() {
        if (this.game.phase !== 'playing') return;
        this.game.resign(this.game.turn);
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

    public reset(config?: MatchConfig) {
        if (config) this.matchConfig = config;
        this.game.reset(this.matchConfig);
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

    public syncState(payload: StateSyncPayload) {
        if (!payload || !payload.board) return;

        this.game.board.clear();
        (payload.board || []).forEach(([key, sqData]) => {
            if (sqData && sqData.piece) {
                const coord = new Coordinate(sqData.coordinate.x, sqData.coordinate.y);
                this.game.board.placePiece(coord, sqData.piece as Piece);
            }
        });

        this.game.turn = payload.turn;
        this.game.status = payload.status || 'active';
        this.game.phase = payload.phase || 'playing';
        this.game.totalTurns = payload.totalTurns || 0;
        this.game.winner = payload.winner;

        // Sync Pacts: map DTOs back to Logic objects using Registry
        if (payload.pacts) {
            const registry = PactRegistry.getInstance();
            const hydratePacts = (color: 'white' | 'black') => {
                const list: PactDefinition[] = [];
                payload.pacts[color].forEach(dto => {
                    const bonus = registry.get(dto.bonus.id);
                    const malus = registry.get(dto.malus.id);
                    if (bonus && malus) {
                        list.push({ id: dto.id, bonus, malus });
                    }
                });
                return list;
            };

            this.game.pacts.white = hydratePacts('white');
            this.game.pacts.black = hydratePacts('black');
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

        // Sync Captured Pieces
        if (payload.capturedPieces) {
            this.game.capturedPieces.white = (payload.capturedPieces.white || []).map(p => new Piece(p.type, p.color, p.id));
            this.game.capturedPieces.black = (payload.capturedPieces.black || []).map(p => new Piece(p.type, p.color, p.id));
        }

        if (payload.matchConfig) {
            this.game.matchConfig = payload.matchConfig;
        }

        if (payload.orientation !== undefined) {
            this.game.orientation = payload.orientation;
        }

        if (payload.extraTurns) {
            this.game.extraTurns.white = payload.extraTurns.white || 0;
            this.game.extraTurns.black = payload.extraTurns.black || 0;
        }

        if (payload.enPassantTarget) {
            this.game.enPassantTarget = new Coordinate(payload.enPassantTarget.x, payload.enPassantTarget.y);
        } else {
            this.game.enPassantTarget = null;
        }

        // Sync PactState — critical for stateful pacts (Phoenix, Alchemist, Diplomat, etc.)
        if (payload.pactState && typeof payload.pactState === 'object') {
            for (const key in this.game.pactState) {
                delete this.game.pactState[key];
            }
            Object.assign(this.game.pactState, payload.pactState);
        }

        if (payload.lastMove) {
            this.lastMove = {
                from: new Coordinate(payload.lastMove.from.x, payload.lastMove.from.y),
                to: new Coordinate(payload.lastMove.to.x, payload.lastMove.to.y)
            };
        } else {
            this.lastMove = null;
        }

        this.notify();
    }
}
