import { BoardModel } from './models/BoardModel';
import { Piece, PieceColor, PieceType } from './models/Piece';
import { Move } from './models/Move';
import { Coordinate } from './models/Coordinate';
import { MoveGenerator } from './rules/MoveGenerator';
import { CheckDetector } from './rules/CheckDetector';
import { RuleEngine } from './rules/RuleEngine';
import { PactFactory } from './pacts/PactFactory';
import { PactRegistry } from './pacts/PactRegistry';
import { PactDefinition } from './pacts/PactLogic';

import { IChessGame, GameEvent, GameStatus, GamePhase, GameEventPayloads } from './GameTypes';
import { MatchConfig, DEFAULT_MATCH_CONFIG } from './models/MatchConfig';

export class ChessGame implements IChessGame {
    public matchConfig: MatchConfig;
    public readonly board: BoardModel;
    public turn: PieceColor;
    public history: Move[];
    public status: GameStatus;
    public winner?: PieceColor | null; // Added winner property
    public phase: GamePhase;
    public readonly pacts: Record<PieceColor, PactDefinition[]> = { white: [], black: [] };
    public readonly perkUsage: Record<PieceColor, Set<string>> = { white: new Set(), black: new Set() };
    public readonly pieceCooldowns: Map<string, number> = new Map(); // pieceId -> turnCount to unlock
    public readonly pactState: Record<string, unknown> = {}; // Generic storage for pact-specific state
    public readonly capturedPieces: Record<PieceColor, Piece[]> = { white: [], black: [] };
    public totalTurns: number = 0;
    public extraTurns: Record<PieceColor, number> = { white: 0, black: 0 };
    public kingMoves: Record<PieceColor, number> = { white: 0, black: 0 };
    public lastMovedPiecePos: Coordinate | null = null;
    public enPassantTarget: Coordinate | null; // Square vulnerable to en passant
    public orientation: number = 0; // 0, 1, 2, 3 (clockwise)
    private listeners: ((event: GameEvent, payload?: unknown) => void)[] = [];
    /**
     * Random number generator used by pact logic. Replace with a seeded function
     * in tests to get deterministic results. Defaults to Math.random.
     */
    public rng: () => number = Math.random;
    constructor(config: MatchConfig = DEFAULT_MATCH_CONFIG) {
        PactFactory.initialize();
        this.matchConfig = config;
        this.board = new BoardModel();
        this.board.setupStandardGame();
        this.turn = 'white';
        this.history = [];
        this.status = 'active';
        this.status = 'active';
        // If no pacts are needed, start playing immediately
        this.phase = config.activePactsMax > 0 ? 'setup' : 'playing';
        this.enPassantTarget = null;
        this.extraTurns = { white: 0, black: 0 };
        this.kingMoves = { white: 0, black: 0 };
        this.lastMovedPiecePos = null;
        this.perkUsage.white.clear();
        this.perkUsage.black.clear();
        this.capturedPieces.white = [];
        this.capturedPieces.white = [];
        this.capturedPieces.black = [];
        this.orientation = 0;
    }

    public assignPact(color: PieceColor, pact: PactDefinition) {
        if (this.phase !== 'setup') return;

        const maxPacts = this.matchConfig.activePactsMax;

        // Prevent overflow
        if (this.pacts[color].length >= maxPacts) return;

        this.pacts[color].push(pact);
        this.emit('pact_assigned');

        const whiteReady = this.pacts.white.length >= maxPacts;
        const blackReady = this.pacts.black.length >= maxPacts;

        if (whiteReady && blackReady) {
            this.phase = 'playing';
            this.turn = 'white'; // Always start game with white's turn
            this.emit('phase_change');
            this.emit('turn_start', this.turn);
        } else {
            // If the current player has more pacts to pick, keep their turn.
            // Otherwise, swap to the other player.
            if (this.pacts[color].length < maxPacts) {
                // Keep turn
                this.emit('turn_start', this.turn);
            } else {
                // Swap turn
                this.turn = this.turn === 'white' ? 'black' : 'white';
                this.emit('turn_start', this.turn);
            }
        }
    }

    public resign(player: PieceColor) {
        if (this.status !== 'active' || this.phase !== 'playing') return;

        this.status = 'resignation';
        this.winner = player === 'white' ? 'black' : 'white';
        this.emit('checkmate'); // Emit checkmate to trigger game end flows for now, or add specific event?
        // Actually, let's keep it clean.
        // We probably need a 'game_over' event or just rely on status change if UI subscribes to move/generic events.
        // But 'emit' expects GameEvent. 'checkmate' or generic 'move' might not be enough.
        // Let's add 'resignation' to GameEvent in GameTypes.ts as well? 
        // For now, let's emit 'checkmate' as it usually signals game end, OR just rely on the UI checking status.
        // But better:
        this.phase = 'game_over';
        this.emit('checkmate'); // Using checkmate as proxy for "game ended with a winner" for listeners that might not know about resignation yet.
    }



    /**
     * Ends the match with a winner and reason.
     * Preferred over setting `game.status` directly from pact logic.
     */
    public endMatch(winner: PieceColor | null, reason: 'checkmate' | 'stalemate' | 'draw' | 'resignation'): void {
        if (this.status !== 'active') return; // already game over
        this.status = reason === 'stalemate' || reason === 'draw' ? reason : 'checkmate';
        if (winner) this.winner = winner;
        this.phase = 'game_over';
        this.emit('checkmate');
    }

    /**
     * Applies a cooldown to a piece.
     * Preferred over `game.pieceCooldowns.set(pieceId, turns)` from pact logic.
     */
    public applyCooldown(pieceId: string, turns: number): void {
        if (turns <= 0) {
            this.pieceCooldowns.delete(pieceId);
        } else {
            this.pieceCooldowns.set(pieceId, turns);
        }
    }

    /**
     * Grants extra turns to a player.
     * Preferred over direct mutation of `game.extraTurns[color]` from pact logic.
     */
    public grantExtraTurn(color: PieceColor, count: number = 1): void {
        this.extraTurns[color] = (this.extraTurns[color] || 0) + count;
    }

    public useAbility(abilityId: string, params?: unknown): boolean {
        if (this.phase !== 'playing') return false;

        const playerPacts = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        const abilityPerk = playerPacts.find(p => p.id === abilityId);

        if (!abilityPerk || !abilityPerk.activeAbility) return false;

        const stateCooldownKey = `${abilityId}_${this.turn}_cooldown`;
        const currentCooldown = (this.pactState[stateCooldownKey] as number) || 0;
        if (currentCooldown > 0) return false;

        // Check maxUses
        const logic = PactRegistry.getInstance().get(abilityId);
        if (logic?.activeAbility?.maxUses !== undefined) {
            const stateUsesKey = `${abilityId}_${this.turn}_uses`;
            const currentUses = (this.pactState[stateUsesKey] as number) || 0;
            if (currentUses >= logic.activeAbility.maxUses) return false;
        }

        if (!abilityPerk.activeAbility.cooldown && this.perkUsage[this.turn].has(abilityId)) return false;

        const success = RuleEngine.useAbility(this, abilityId, params, playerPacts);

        // Mark as used if successful (unless repeatable)
        if (success) {
            if (logic?.activeAbility?.cooldown) {
                this.pactState[stateCooldownKey] = logic.activeAbility.cooldown;
            } else if (!logic?.activeAbility?.repeatable) {
                this.perkUsage[this.turn].add(abilityId);
            }

            // Increment maxUses counter
            if (logic?.activeAbility?.maxUses !== undefined) {
                const stateUsesKey = `${abilityId}_${this.turn}_uses`;
                const currentUses = (this.pactState[stateUsesKey] as number) || 0;
                this.pactState[stateUsesKey] = currentUses + 1;
            }

            this.emit('ability_activated', { abilityId, playerId: this.turn });

            if (logic?.activeAbility?.consumesTurn) {
                this.turn = RuleEngine.getNextTurn(this, this.turn, 'ability_activated', playerPacts);
                this.emit('turn_start', this.turn);
            }

            this.updateGameStatus();
            return true;
        }

        return false;
    }

    public getAvailableAbilities(): string[] {
        if (this.phase !== 'playing') return [];
        const playerPacts = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        const registry = PactRegistry.getInstance();
        return playerPacts
            .filter(p => {
                if (!p.activeAbility) return false;
                const currentCooldown = (this.pactState[`${p.id}_${this.turn}_cooldown`] as number) || 0;
                if (currentCooldown > 0) return false;

                // Check maxUses
                const logic = registry.get(p.id);
                if (logic?.activeAbility?.maxUses !== undefined) {
                    const currentUses = (this.pactState[`${p.id}_${this.turn}_uses`] as number) || 0;
                    if (currentUses >= logic.activeAbility.maxUses) return false;
                }

                return p.activeAbility.cooldown || !this.perkUsage[this.turn].has(p.id);
            })
            .map(p => p.id);
    }

    public subscribe(listener: (event: GameEvent, payload?: unknown) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Overload emit to support typed payloads
    public emit<E extends keyof GameEventPayloads>(event: E, payload: GameEventPayloads[E]): void;
    public emit(event: GameEvent, payload?: unknown): void;
    public emit(event: GameEvent, payload?: unknown) {
        this.listeners.forEach(l => l(event, payload));

        // Notify active pacts
        const registry = PactRegistry.getInstance();
        ['white', 'black'].forEach(c => {
            const color = c as PieceColor;
            this.pacts[color].forEach(pact => {
                // Check bonus
                let logic = registry.get(pact.bonus.id);
                if (logic) {
                    // WHY: payload type at emit() boundary is already validated by the overloaded emit();
                    // casting to GameEventPayloads[K] is safe here as the same payload is forwarded.
                    logic.onEvent(event, payload as GameEventPayloads[typeof event], { game: this, playerId: color, pactId: pact.bonus.id });
                    if (event === 'turn_start' && payload === color) {
                        try {
                            logic.onTurnStart({ game: this, playerId: color, pactId: pact.bonus.id });
                        } catch (e) {
                            console.error(`Error in pact ${pact.bonus.id} onTurnStart:`, e);
                        }
                    }
                }

                // Check malus
                logic = registry.get(pact.malus.id);
                if (logic) {
                    // WHY: same as above — payload forwarded from typed emit() overload.
                    logic.onEvent(event, payload as GameEventPayloads[typeof event], { game: this, playerId: color, pactId: pact.malus.id });
                    if (event === 'turn_start' && payload === color) {
                        try {
                            logic.onTurnStart({ game: this, playerId: color, pactId: pact.malus.id });
                        } catch (e) {
                            console.error(`Error in pact ${pact.malus.id} onTurnStart:`, e);
                        }
                    }
                }
            });
        });
    }

    public makeMove(from: Coordinate, to: Coordinate, promotionPiece?: PieceType): boolean {
        if (this.phase !== 'playing') return false;

        const square = this.board.getSquare(from);
        if (!square || !square.piece) return false;
        if (square.piece.color !== this.turn) return false;

        const movingPiece = square.piece;
        const pieceColor = movingPiece.color;
        const playerPacts = this.pacts[pieceColor].map(p => [p.bonus, p.malus]).flat();

        const pseudoMoves = MoveGenerator.getPseudoLegalMoves(this.board, movingPiece, from, this.enPassantTarget, playerPacts, this.perkUsage[pieceColor], this);
        const opponentColor: PieceColor = pieceColor === 'white' ? 'black' : 'white';
        const opponentPacts = this.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

        const legalMoves = pseudoMoves.filter(m =>
            !CheckDetector.wouldLeaveKingInCheck(this.board, m.from, m.to, pieceColor, opponentPacts, m.isSwap, this)
        );

        // Check if piece can move (Slug Move, Heavy Crown)
        if (!RuleEngine.canMovePiece(this, from, playerPacts)) {
            return false;
        }

        const move = legalMoves.find(m => m.to.equals(to));
        if (!move) return false;

        // Panic Rule check via RuleEngine
        if (RuleEngine.mustMoveKingInCheck(this.turn, playerPacts) && this.isInCheck(this.turn) && movingPiece.type !== 'king') {
            return false;
        }

        let eventType: GameEvent = move.capturedPiece ? 'capture' : 'move';

        // Handle en passant capture
        if (move.isEnPassant && this.enPassantTarget) {
            const capturedPawnY = pieceColor === 'white' ? to.y - 1 : to.y + 1;
            const capturedPawnSquare = this.board.getSquare(new Coordinate(to.x, capturedPawnY));
            if (capturedPawnSquare?.piece) {
                this.capturedPieces[capturedPawnSquare.piece.color].push(capturedPawnSquare.piece);
            }
            this.board.removePiece(new Coordinate(to.x, capturedPawnY));
            eventType = 'capture';
        }

        // Standard capture
        if (move.capturedPiece && !move.isEnPassant && !move.isSwap) {
            this.capturedPieces[move.capturedPiece.color].push(move.capturedPiece);
        }

        // Handle Castling Execution
        if (move.isCastling) {
            const isKingside = to.x === 6;
            const rookFromX = isKingside ? 7 : 0;
            const rookToX = isKingside ? 5 : 3;
            const baseRank = pieceColor === 'white' ? 0 : 7;
            this.board.movePiece(new Coordinate(rookFromX, baseRank), new Coordinate(rookToX, baseRank));
            eventType = 'castle';
        }



        // Execute the move
        if (move.isSwap) {
            this.board.movePiece(from, to);
            if (move.capturedPiece) {
                this.board.placePiece(from, move.capturedPiece);
            }
        } else {
            this.board.movePiece(from, to);
        }

        // --- PROMOTION LOGIC ---
        if (movingPiece.type === 'pawn') {
            const finalRank = pieceColor === 'white' ? 7 : 0;
            const isStandardPromotion = to.y === finalRank;

            // Future: Add Express Promotion check here if needed
            const isExpressPromotion = false;

            if (isStandardPromotion || isExpressPromotion) {
                let pieceToPromote = promotionPiece || 'queen';

                // Validate promotion type against active pacts (Fix for Saboteur Malus)
                const allowedTypes = RuleEngine.getAllowedPromotionTypes(movingPiece, playerPacts, this);

                // Ensure the requested type is allowed. If not, fallback to the first allowed type.
                if (!allowedTypes.includes(pieceToPromote)) {
                    if (allowedTypes.length > 0) {
                        pieceToPromote = allowedTypes[0];
                    } else {
                        // Edge case: No promotion allowed (rare). 
                        // We skip changing the type, piece remains a pawn (as per Thief Malus)
                        pieceToPromote = 'pawn';
                    }
                }

                if (pieceToPromote !== 'pawn') {
                    const pieceOnBoard = this.board.getSquare(to)?.piece;
                    if (pieceOnBoard) pieceOnBoard.type = pieceToPromote;
                    move.promotion = pieceToPromote;
                    eventType = 'promotion';
                }
            }
        }

        // RuleEngine side effects (e.g., tracking usage, extra turn costs)
        RuleEngine.onExecuteMove(this, move, playerPacts);

        // Update en passant target
        this.enPassantTarget = null;
        if (movingPiece.type === 'pawn' && Math.abs(from.y - to.y) === 2) {
            const enPassantY = pieceColor === 'white' ? from.y + 1 : from.y - 1;
            this.enPassantTarget = new Coordinate(from.x, enPassantY);
        }

        this.history.push(move);
        this.totalTurns++;

        // Tracking for Heavy Crown and Slug Move
        if (movingPiece.type === 'king') {
            this.kingMoves[pieceColor]++;
        }
        this.lastMovedPiecePos = to;

        // Turn Economy via RuleEngine
        this.turn = RuleEngine.getNextTurn(this, this.turn, eventType, playerPacts);

        this.updateGameStatus();

        // Check for specific end-game or status events
        if (this.status === 'checkmate') eventType = 'checkmate';
        else if (this.status === 'stalemate') eventType = 'stalemate';
        else if (this.status === 'draw') eventType = 'draw';
        else if (this.isInCheck(this.turn)) eventType = 'check';

        this.emit(eventType, move);

        // Central Cooldown Management: Decrement cooldowns for the player who is about to start their turn
        // We do this AFTER the move event so that passive effects triggered by the move (like Pickpocket) 
        // can set cooldowns that are immediately decremented by the upcoming turn.
        const pieces = this.board.getAllSquares().map(s => s.piece).filter(p => p !== null);
        pieces.forEach(p => {
            if (p && p.color === this.turn) {
                const cd = this.pieceCooldowns.get(p.id) || 0;
                if (cd > 0) {
                    this.pieceCooldowns.set(p.id, cd - 1);
                }
            }
        });

        const activePlayerPactsAfterMove = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        activePlayerPactsAfterMove.forEach(p => {
            const stateCooldownKey = `${p.id}_${this.turn}_cooldown`;
            const cd = (this.pactState[stateCooldownKey] as number) || 0;
            if (cd > 0) {
                this.pactState[stateCooldownKey] = cd - 1;
            }
        });

        this.emit('turn_start', this.turn);
        return true;
    }

    public rotateBoard(): boolean {
        if (!this.matchConfig.enableTurnRotate90) return false;
        if (this.phase !== 'playing') return false;
        if (this.totalTurns < 2) return false;

        // Apply rotation
        const previousOrientation = this.orientation;
        this.orientation = (this.orientation + 1) % 4;

        // Verify if rotation leaves King in check (which is allowed if it removes an existing check,
        // but wait: User said "La rotazione può essere usata anche se sei sotto scacco: se ruotando lo scacco scompare, è una action legale.")
        // Implicitly: If you are NOT in check, and rotate, and end up IN check, is it legal?
        // Usually NO. You cannot make a move that puts you in check.

        if (this.isInCheck(this.turn)) {
            // Revert
            this.orientation = previousOrientation;
            return false;
        }

        // Action successful
        this.totalTurns++;

        // Emit 'board_rotated' (not 'move') so pact handlers that listen for 'move'
        // don't process this action with an undefined Move payload.
        this.emit('board_rotated');

        // Turn Economy
        const playerPacts = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        this.turn = RuleEngine.getNextTurn(this, this.turn, 'move', playerPacts);

        // Update Game Status (checkmate etc)
        this.updateGameStatus();

        // Cooldowns
        const pieces = this.board.getAllSquares().map(s => s.piece).filter(p => p !== null);
        pieces.forEach(p => {
            if (p && p.color === this.turn) {
                const cd = this.pieceCooldowns.get(p.id) || 0;
                if (cd > 0) {
                    this.pieceCooldowns.set(p.id, cd - 1);
                }
            }
        });

        const activePlayerPactsAfterRotate = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        activePlayerPactsAfterRotate.forEach(p => {
            const stateCooldownKey = `${p.id}_${this.turn}_cooldown`;
            const cd = (this.pactState[stateCooldownKey] as number) || 0;
            if (cd > 0) {
                this.pactState[stateCooldownKey] = cd - 1;
            }
        });

        this.emit('turn_start', this.turn);
        return true;
    }

    private updateGameStatus(): void {
        // Fix for Swarm Malus: Do not overwrite if already Checkmate/GameOver by a Pact
        if (this.status === 'checkmate' || this.phase === 'game_over') return;

        const hasLegalMoves = this.hasAnyLegalMoves(this.turn);
        const opponentColor: PieceColor = this.turn === 'white' ? 'black' : 'white';
        const opponentPacts = this.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();
        const isInCheck = CheckDetector.isKingInCheck(this.board, this.turn, opponentPacts, this);

        if (!hasLegalMoves) {
            this.phase = 'game_over';
            if (isInCheck) {
                this.status = 'checkmate';
                this.winner = this.turn === 'white' ? 'black' : 'white';
            } else {
                this.status = 'stalemate';
            }
        } else {
            this.status = 'active';
        }
    }

    public getLegalMoves(from: Coordinate): Move[] {
        const square = this.board.getSquare(from);
        if (!square || !square.piece) return [];

        const piece = square.piece;
        const playerPacts = this.pacts[piece.color].map(p => [p.bonus, p.malus]).flat();

        // Check if piece can move (Slug Move, Heavy Crown)
        if (!RuleEngine.canMovePiece(this, from, playerPacts)) {
            return [];
        }

        const pseudoMoves = MoveGenerator.getPseudoLegalMoves(
            this.board,
            piece,
            from,
            this.enPassantTarget,
            playerPacts,
            this.perkUsage[piece.color],
            this
        );

        const opponentColor = piece.color === 'white' ? 'black' : 'white';
        const opponentPacts = this.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

        return pseudoMoves.filter(m =>
            !CheckDetector.wouldLeaveKingInCheck(this.board, m.from, m.to, piece.color, opponentPacts, m.isSwap, this)
        );
    }

    private hasAnyLegalMoves(color: PieceColor): boolean {
        const allSquares = this.board.getAllSquares();
        const playerPacts = this.pacts[color].map(p => [p.bonus, p.malus]).flat();

        for (const square of allSquares) {
            if (!square.piece || square.piece.color !== color) continue;

            const pseudoMoves = MoveGenerator.getPseudoLegalMoves(
                this.board,
                square.piece,
                square.coordinate,
                this.enPassantTarget,
                playerPacts,
                this.perkUsage[color],
                this
            );

            const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
            const opponentPacts = this.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();

            const legalMoves = pseudoMoves.filter(m =>
                !CheckDetector.wouldLeaveKingInCheck(this.board, m.from, m.to, color, opponentPacts, m.isSwap, this)
            );

            if (legalMoves.length > 0) return true;
        }

        return false;
    }

    public isInCheck(color: PieceColor): boolean {
        const opponentColor: PieceColor = color === 'white' ? 'black' : 'white';
        const opponentPacts = this.pacts[opponentColor].map(p => [p.bonus, p.malus]).flat();
        return CheckDetector.isKingInCheck(this.board, color, opponentPacts, this);
    }

    public reset(config?: MatchConfig) {
        if (config) this.matchConfig = config;
        this.board.setupStandardGame();
        this.turn = 'white';
        this.history = [];
        this.status = 'active';
        this.phase = 'setup';
        this.pacts.white = [];
        this.pacts.black = [];
        this.enPassantTarget = null;
        this.totalTurns = 0;
        this.pieceCooldowns.clear();
        // Clear pact state
        for (const key in this.pactState) delete this.pactState[key];
        this.perkUsage.white.clear();
        this.perkUsage.black.clear();
        this.capturedPieces.white = [];
        this.capturedPieces.black = [];
        this.capturedPieces.black = [];
        this.orientation = 0;
    }

    public jumpToMove(index: number): boolean {
        if (index < -1 || index >= this.history.length) return false;

        const originalHistory = [...this.history];

        // Capture critical setup state to restore after reset
        const savedPacts = {
            white: [...this.pacts.white],
            black: [...this.pacts.black]
        };
        const savedPhase = this.phase;
        const savedPerkUsage = {
            white: new Set(this.perkUsage.white),
            black: new Set(this.perkUsage.black)
        };

        this.reset();

        // Restore setup state if we are already out of the absolute beginning
        if (savedPhase !== 'setup') {
            this.pacts.white = savedPacts.white;
            this.pacts.black = savedPacts.black;
            this.phase = savedPhase;
            this.perkUsage.white = savedPerkUsage.white;
            this.perkUsage.black = savedPerkUsage.black;
        }

        for (let i = 0; i <= index; i++) {
            this.executeStoredMove(originalHistory[i]);
        }

        return true;
    }

    private executeStoredMove(move: Move) {
        if (move.isEnPassant) {
            const capturedPawnY = move.piece.color === 'white' ? move.to.y - 1 : move.to.y + 1;
            const capturedPawnSquare = this.board.getSquare(new Coordinate(move.to.x, capturedPawnY));
            if (capturedPawnSquare?.piece) {
                this.capturedPieces[capturedPawnSquare.piece.color].push(capturedPawnSquare.piece);
            }
            this.board.removePiece(new Coordinate(move.to.x, capturedPawnY));
        }

        if (move.capturedPiece && !move.isEnPassant && !move.isSwap) {
            this.capturedPieces[move.capturedPiece.color].push(move.capturedPiece);
        }

        if (move.isSwap) {
            this.board.movePiece(move.from, move.to);
            if (move.capturedPiece) {
                this.board.placePiece(move.from, move.capturedPiece);
            }
        } else {
            this.board.movePiece(move.from, move.to);
        }

        if (move.isCastling && move.piece.type === 'king') {
            const baseRank = move.piece.color === 'white' ? 0 : 7;
            if (move.to.x === 6) {
                this.board.movePiece(new Coordinate(7, baseRank), new Coordinate(5, baseRank));
            } else if (move.to.x === 2) {
                this.board.movePiece(new Coordinate(0, baseRank), new Coordinate(3, baseRank));
            }
        }

        if (move.promotion) {
            const piece = this.board.getSquare(move.to)?.piece;
            if (piece) piece.type = move.promotion;
        }

        this.enPassantTarget = null;
        if (move.piece.type === 'pawn' && Math.abs(move.from.y - move.to.y) === 2) {
            const enPassantY = move.piece.color === 'white' ? move.from.y + 1 : move.from.y - 1;
            this.enPassantTarget = new Coordinate(move.from.x, enPassantY);
        }

        this.history.push(move);
        this.totalTurns++;
        if (move.piece.type === 'king') {
            this.kingMoves[move.piece.color]++;
        }

        this.turn = this.turn === 'white' ? 'black' : 'white';
        // Note: Turn economy perks (like extra turns) are harder to restore without full event log.
        // For basic jumpToMove/undo, alternating turns is usually sufficient if the moves came from a valid sequence.

        this.updateGameStatus();
    }

    public undo(): boolean {
        if (this.history.length === 0) return false;
        return this.jumpToMove(this.history.length - 2);
    }
}
