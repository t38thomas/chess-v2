import { BoardModel } from './models/BoardModel';
import { PieceColor, PieceType } from './models/Piece';
import { Move } from './models/Move';
import { Coordinate } from './models/Coordinate';
import { MoveGenerator } from './rules/MoveGenerator';
import { CheckDetector } from './rules/CheckDetector';
import { RuleEngine } from './rules/RuleEngine';
import { PactFactory } from './pacts/PactFactory';
import { Pact } from './models/Pact';
import { PactRegistry } from './pacts/PactRegistry';

export type GameStatus = 'active' | 'checkmate' | 'stalemate' | 'draw';
export type GamePhase = 'setup' | 'playing' | 'game_over';
export type GameEvent = 'move' | 'capture' | 'check' | 'checkmate' | 'stalemate' | 'draw' | 'castle' | 'promotion' | 'phase_change' | 'pact_assigned' | 'ability_activated' | 'turn_start' | 'pact_effect';

export class ChessGame {
    public readonly board: BoardModel;
    public turn: PieceColor;
    public history: Move[];
    public status: GameStatus;
    public phase: GamePhase;
    public readonly pacts: Record<PieceColor, Pact[]> = { white: [], black: [] };
    public readonly perkUsage: Record<PieceColor, Set<string>> = { white: new Set(), black: new Set() };
    public readonly pieceCooldowns: Map<string, number> = new Map(); // pieceId -> turnCount to unlock
    public readonly pactState: Record<string, any> = {}; // Generic storage for pact-specific state
    public totalTurns: number = 0;
    public extraTurns: Record<PieceColor, number> = { white: 0, black: 0 };
    public kingMoves: Record<PieceColor, number> = { white: 0, black: 0 };
    public lastMovedPiecePos: Coordinate | null = null;
    public enPassantTarget: Coordinate | null; // Square vulnerable to en passant
    private listeners: ((event: GameEvent, payload?: any) => void)[] = [];
    constructor() {
        PactFactory.initialize();
        this.board = new BoardModel();
        this.board.setupStandardGame();
        this.turn = 'white';
        this.history = [];
        this.status = 'active';
        this.phase = 'setup';
        this.enPassantTarget = null;
        this.extraTurns = { white: 0, black: 0 };
        this.kingMoves = { white: 0, black: 0 };
        this.lastMovedPiecePos = null;
        this.perkUsage.white.clear();
        this.perkUsage.black.clear();
    }

    public assignPact(color: PieceColor, pact: Pact) {
        if (this.phase !== 'setup') return;

        // Prevent re-assigning if already has a pact (for local safety)
        if (this.pacts[color].length > 0) return;

        this.pacts[color].push(pact);
        this.emit('pact_assigned');

        if (this.pacts.white.length > 0 && this.pacts.black.length > 0) {
            this.phase = 'playing';
            this.turn = 'white'; // Always start game with white's turn
            this.emit('phase_change');
        } else {
            // Swap turn so the other player can select their pact
            this.turn = this.turn === 'white' ? 'black' : 'white';
            this.emit('turn_start', this.turn);
        }
    }

    public useAbility(abilityId: string, params?: any): boolean {
        if (this.phase !== 'playing') return false;

        const playerPacts = this.pacts[this.turn].map(p => [p.bonus, p.malus]).flat();
        const abilityPerk = playerPacts.find(p => p.id === abilityId);

        if (!abilityPerk || abilityPerk.category !== 'Action') return false;
        if (this.perkUsage[this.turn].has(abilityId)) return false;

        const success = RuleEngine.useAbility(this, abilityId, params, playerPacts);

        // Mark as used if successful
        if (success) {
            this.perkUsage[this.turn].add(abilityId);
            this.emit('ability_activated', { abilityId, playerId: this.turn });

            const logic = PactRegistry.getInstance().get(abilityId);
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
        return playerPacts
            .filter(p => p.category === 'Action' && !this.perkUsage[this.turn].has(p.id))
            .map(p => p.id);
    }

    public subscribe(listener: (event: GameEvent, payload?: any) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Overload emit to support payload
    public emit(event: GameEvent, payload?: any) {
        this.listeners.forEach(l => l(event, payload));

        // Notify active pacts
        const registry = PactRegistry.getInstance();
        ['white', 'black'].forEach(c => {
            const color = c as PieceColor;
            this.pacts[color].forEach(pact => {
                // Check bonus
                let logic = registry.get(pact.bonus.id);
                if (logic) logic.onEvent(event, payload, { game: this, playerId: color, pactId: pact.bonus.id });

                // Check malus
                logic = registry.get(pact.malus.id);
                if (logic) logic.onEvent(event, payload, { game: this, playerId: color, pactId: pact.malus.id });
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
            this.board.removePiece(new Coordinate(to.x, capturedPawnY));
            eventType = 'capture';
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
                const allowedTypes = RuleEngine.getAllowedPromotionTypes(movingPiece, playerPacts);

                // Ensure the requested type is allowed. If not, fallback to the first allowed type.
                if (!allowedTypes.includes(pieceToPromote)) {
                    if (allowedTypes.length > 0) {
                        pieceToPromote = allowedTypes[0];
                    } else {
                        // Edge case: No promotion allowed (rare). Default to Queen if list empty?
                        // Should technically block move, but for safety in this block:
                        pieceToPromote = 'queen';
                    }
                }

                const pieceOnBoard = this.board.getSquare(to)?.piece;
                if (pieceOnBoard) pieceOnBoard.type = pieceToPromote;
                move.promotion = pieceToPromote;
                eventType = 'promotion'; // Fix for Necromancer Malus (event type)
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
            if (isInCheck) {
                this.status = 'checkmate';
            } else {
                this.status = 'stalemate';
            }
        } else {
            this.status = 'active';
        }
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

    public reset() {
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
            this.board.removePiece(new Coordinate(move.to.x, capturedPawnY));
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
