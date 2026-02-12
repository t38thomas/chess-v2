import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../models/Piece';
import { Perk } from '../models/Pact';
import { Move } from '../models/Move';
import { ChessGame, GameEvent } from '../ChessGame';
import { PactRegistry } from '../pacts/PactRegistry';
import { PactLogic } from '../pacts/PactLogic';

export interface RuleEffect {
    // Movement overrides
    getMaxRange?: (piece: Piece) => number;
    getFixedDistances?: (piece: Piece) => number[] | null;
    canDoubleMove?: (piece: Piece, y: number, startY: number) => boolean;
    canDiagonalDash?: (piece: Piece) => boolean;
    canSidewaysMove?: (piece: Piece) => boolean;
    canMoveThroughFriendlies?: (piece: Piece) => boolean;
    canMoveLikeKnight?: (pieceType: PieceType) => boolean;
    canMovePiece?: (game: ChessGame, from: Coordinate) => boolean;

    // Capture overrides
    canCapture?: (attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board: BoardModel) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece) => boolean;
    mustMoveKingInCheck?: (color: PieceColor) => boolean;

    // Movement Hooks
    onGetPseudoMoves?: (board: BoardModel, from: Coordinate, piece: Piece, moves: Move[], game?: ChessGame) => void;

    // Turn Economy
    onExecuteMove?: (game: ChessGame, move: Move) => void;
    modifyNextTurn?: (game: ChessGame, currentTurn: PieceColor, eventType: GameEvent) => PieceColor | null;
    onUseAbility?: (game: ChessGame, abilityId: string, params?: any) => void;
}

export class RuleEngine {
    private static readonly DEFINITIONS: Record<string, RuleEffect> = {
        vanguard_pawns: {
            canDoubleMove: (piece, y, startY) => true // Always can double move
        },
        shattered_faith: {
            getFixedDistances: (piece) => piece.type === 'bishop' ? [2, 4] : null
        },
        rusting_rooks: {
            getMaxRange: (piece) => piece.type === 'rook' ? 4 : 8
        },
        range_cap: {
            getMaxRange: (piece) => piece.type !== 'queen' ? 5 : 8
        },
        diagonal_dash: {
            canDiagonalDash: (piece) => piece.type === 'pawn'
        },
        zealous_bishops: {
            onGetPseudoMoves: (board, from, piece, moves) => {
                if (piece.type === 'bishop') {
                    // Bishops can move 1 square horizontally/vertically
                    // This uses a static helper to avoid circularity if possible
                    RuleEngine.addSteppingMoves(board, from, [[0, 1], [0, -1], [1, 0], [-1, 0]], piece, moves);
                }
            }
        },
        squire_leap: {
            canMoveLikeKnight: (type) => type === 'king',
            onExecuteMove: (game, move) => {
                // If the move was a knight jump by a king, mark as used
                const dx = Math.abs(move.from.x - move.to.x);
                const dy = Math.abs(move.from.y - move.to.y);
                const isKnightJump = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);

                if (move.piece.type === 'king' && isKnightJump) {
                    game.perkUsage[move.piece.color].add('squire_leap');
                }
            }
        },
        queen_hubris: {
            canCapture: (attacker, victim) => !(attacker.type === 'queen' && victim.type === 'pawn')
        },
        non_combatants: {
            canCapture: (attacker, victim, to) => {
                if (attacker.type !== 'knight') return true;
                const isRank12 = victim.color === 'white' ? to.y <= 1 : to.y >= 6;
                return !isRank12;
            }
        },
        blinded_bishops: {
            canCapture: (attacker, victim, to) => {
                if (attacker.type !== 'bishop') return true;
                const isEdge = to.x === 0 || to.x === 7 || to.y === 0 || to.y === 7;
                return !isEdge;
            }
        },
        loyal_guard: {
            canCastleWhileMoved: (piece) => piece.type === 'king'
        },
        panic_rule: {
            mustMoveKingInCheck: (color) => true
        },
        blitz_maneuver: {
            onUseAbility: (game, id) => {
                if (!game.perkUsage[game.turn].has(id)) {
                    game.perkUsage[game.turn].add(id);
                    game.extraTurns[game.turn]++;
                }
            }
        },
        royal_pivot: {
            onUseAbility: (game, id, params) => {
                const to = params?.to;
                if (!to) return;

                const targetCoord = new Coordinate(to.x, to.y);
                const kingSquare = game.board.getAllSquares().find(s => s.piece?.type === 'king' && s.piece.color === game.turn);
                const targetSquare = game.board.getSquare(targetCoord);

                if (kingSquare && targetSquare?.piece && targetSquare.piece.color === game.turn) {
                    const kingPos = kingSquare.coordinate;
                    game.board.movePiece(kingPos, targetCoord); // Swap simulated by two moves (internal logic might need care)
                    // Wait, movePiece replaces. Swapping needs a temp.
                    const king = kingSquare.piece!;
                    const target = targetSquare.piece!;

                    // Direct manipulation for swap
                    (kingSquare as any).piece = target;
                    (targetSquare as any).piece = king;

                    game.perkUsage[game.turn].add(id);
                }
            }
        },
        grand_vision: {
            onUseAbility: (game, id) => {
                const user = game.turn;
                if (!game.perkUsage[user].has(id)) {
                    game.undo();
                    game.perkUsage[user].add(id);
                }
            }
        },
        ascension_cost: {
            onExecuteMove: (game, move) => {
                if (move.promotion) {
                    const opponent: PieceColor = move.piece.color === 'white' ? 'black' : 'white';
                    game.extraTurns[opponent]++;
                }
            }
        },
        stiff_start: {
            canDoubleMove: (piece, y, startY) => false
        },
        no_retreat: {
            // Handled in addPawnMoves: Pawns on opponent's half cannot move forward
        },
        sanctuary: {
            canCapture: (attacker, victim, to) => {
                if (attacker.type !== 'queen') return true;
                const isSanctuary = victim.color === 'white' ? to.y <= 1 : to.y >= 6;
                return !isSanctuary;
            }
        },
        slug_move: {
            canMovePiece: (game, from) => {
                if (!game.lastMovedPiecePos) return true;
                return !game.lastMovedPiecePos.equals(from);
            }
        },
        heavy_crown: {
            canMovePiece: (game, from) => {
                const square = game.board.getSquare(from);
                if (square?.piece?.type !== 'king') return true;
                return game.kingMoves[square.piece.color] < 5;
            }
        },
        rook_shift: {
            onGetPseudoMoves: (board, from, piece, moves) => {
                if (piece.type === 'rook') {
                    // Rooks can swap with adjacent friendly pawn
                    const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                    adj.forEach(([dx, dy]) => {
                        const targetCoord = new Coordinate(from.x + dx, from.y + dy);
                        const targetSq = board.getSquare(targetCoord);
                        if (targetSq?.piece && targetSq.piece.type === 'pawn' && targetSq.piece.color === piece.color) {
                            // Valid swap move
                            moves.push(new Move(from, targetCoord, piece, targetSq.piece, false, false, true));
                        }
                    });
                }
            }
        },
        scout_path: {
            canSidewaysMove: (piece) => piece.type === 'pawn'
        },
        tactical_retreat: {
            canMoveThroughFriendlies: (piece) => piece.type !== 'pawn'
        },
        focused_center: {
            getMaxRange: (piece) => {
                // If piece is in center 4 squares, it gains +1 reach (if it's not already max)
                // However, getMaxRange is for sliding pieces. 
                // For Knight/King, we'd need a different hook or check their "reach".
                // Let's simplify: if in center, they can move further.
                return 8; // Queens are already 8.
            },
            onGetPseudoMoves: (board, from, piece, moves) => {
                const isCenter = (from.x === 3 || from.x === 4) && (from.y === 3 || from.y === 4);
                if (isCenter && (piece.type === 'knight' || piece.type === 'king')) {
                    // King/Knight gain +1 reach. For King, this means a 2nd ring.
                    // For Knight, it's hard to define "+1 reach" without a custom list.
                    // Let's assume King moves like a 5x5 area.
                    if (piece.type === 'king') {
                        RuleEngine.addSteppingMoves(board, from, [
                            [2, 0], [-2, 0], [0, 2], [0, -2],
                            [2, 2], [2, -2], [-2, 2], [-2, -2],
                            [2, 1], [2, -1], [-2, 1], [-2, -1],
                            [1, 2], [1, -2], [-1, 2], [-1, -2]
                        ], piece, moves);
                    }
                }
            }
        },
        iron_phalanx: {
            canCapture: (attacker, victim, to, from, board) => {
                if (victim.type !== 'pawn') return true;

                // Check for an adjacent friendly pawn
                const adjX = [to.x - 1, to.x + 1];
                let hasAdjacentFriendlyPawn = false;
                for (const x of adjX) {
                    if (x < 0 || x > 7) continue;
                    const sq = board.getSquare(new Coordinate(x, to.y));
                    if (sq?.piece && sq.piece.type === 'pawn' && sq.piece.color === victim.color) {
                        hasAdjacentFriendlyPawn = true;
                        break;
                    }
                }

                if (!hasAdjacentFriendlyPawn) return true;

                // Frontal attack check
                // For white victims (move down conceptually for black attackers), front is lower Y.
                // Wait, perspective: 
                // White pawns move 1 -> 7. Their "front" is towards row 7.
                // Black pawns move 6 -> 0. Their "front" is towards row 0.
                // A frontal attack on a White pawn (at Y) comes from Y+1 or more?
                // No, standard chess: Frontal means same column, moving towards the pawn's face.

                const isSameFile = from.x === to.x;
                const isComingFromFront = victim.color === 'white' ? from.y > to.y : from.y < to.y;

                if (isSameFile && isComingFromFront) return false;

                return true;
            }
        },
        exhaustion: {
            onExecuteMove: (game, move) => {
                if (move.capturedPiece) {
                    game.pieceCooldowns.set(move.piece.id, game.totalTurns + 2); // Locked for next turn
                }
            },
            canMovePiece: (game, from) => {
                const piece = game.board.getSquare(from)?.piece;
                if (!piece) return true;
                const unlockTurn = game.pieceCooldowns.get(piece.id);
                return !unlockTurn || game.totalTurns >= unlockTurn;
            }
        },
        knight_fatigue: {
            onExecuteMove: (game, move) => {
                if (move.piece.type === 'knight') {
                    game.pieceCooldowns.set(move.piece.id, game.totalTurns + 6); // roughly 3 full rounds (6 half-turns)
                }
            },
            canMovePiece: (game, from) => {
                const piece = game.board.getSquare(from)?.piece;
                if (piece?.type !== 'knight') return true;
                const unlockTurn = game.pieceCooldowns.get(piece.id);
                return !unlockTurn || game.totalTurns >= unlockTurn;
            }
        },
        delayed_castle: {
            onGetPseudoMoves: (board, from, piece, moves, game) => {
                // Filter out castling moves if turn < 30 (15 full rounds)
                // The 'game' object is now passed directly to onGetPseudoMoves
                if (game && game.totalTurns < 30) {
                    const idx = moves.findIndex(m => m.isCastling);
                    if (idx !== -1) moves.splice(idx, 1);
                }
            }
        },
        frozen_flanks: {
            canMovePiece: (game, from) => {
                if (game.totalTurns >= 16) return true;
                return (from.x !== 0 && from.x !== 7);
            }
        },
        isolation: {
            canMovePiece: (game, from) => {
                const piece = game.board.getSquare(from)?.piece;
                if (piece?.type !== 'king') return true;

                // King cannot be adjacent to friendly piece
                const adj = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [dx, dy] of adj) {
                    const sq = game.board.getSquare(new Coordinate(from.x + dx, from.y + dy));
                    if (sq?.piece && sq.piece.color === piece.color) return false;
                }
                return true;
            }
        },
        forced_hunger: {
            onGetPseudoMoves: (board, from, piece, moves) => {
                if (piece.type !== 'pawn') return;
                // If any capture is available for this pawn, it MUST be taken?
                // Actually, Forced Hunger applies to ALL pawns. If any pawn can capture, you MUST capture with a pawn.
                // This is hard to implement per-piece without looking at all pieces.
                // But the perk says: "If a pawn capture is available, you MUST take it."
                // This usually means if you choose a pawn that CAN capture, you can only move to capture.
                // Or globally: if ANY pawn can capture, you can only move pawns to capture.
                const hasCapture = moves.some(m => m.capturedPiece);
                if (hasCapture) {
                    const captureMoves = moves.filter(m => m.capturedPiece);
                    moves.length = 0;
                    moves.push(...captureMoves);
                }
            }
        },
        fragile_core: {
            onExecuteMove: (game, move) => {
                // If piece moved adjacent to a piece in center, center piece dies
                const adj = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                adj.forEach(([dx, dy]) => {
                    const coord = new Coordinate(move.to.x + dx, move.to.y + dy);
                    const isCenter = (coord.x === 3 || coord.x === 4) && (coord.y === 3 || coord.y === 4);
                    if (isCenter) {
                        const sq = game.board.getSquare(coord);
                        if (sq?.piece && sq.piece.color !== move.piece.color) {
                            game.board.removePiece(coord);
                        }
                    }
                });
            }
        },
        double_step: {
            modifyNextTurn: (game, currentTurn, eventType) => {
                // Check if last move was a Knight move without capture
                const lastMove = game.history[game.history.length - 1];
                if (lastMove && lastMove.piece.type === 'knight' && !lastMove.capturedPiece) {
                    // Only allow double step once per "real" turn (avoid infinite turns)
                    const perkId = 'double_step_used';
                    if (!game.perkUsage[currentTurn].has(perkId)) {
                        game.perkUsage[currentTurn].add(perkId);
                        return currentTurn; // Extra move!
                    }
                }
                // Cleanup flag for next standard turn? 
                // No, RuleEngine can detect turn boundaries.
                return null;
            }
        },
        reclaimer: {
            onUseAbility: (game, id) => {
                // Find last captured piece of current player
                const lastLostMove = [...game.history].reverse().find(m => m.capturedPiece && m.capturedPiece.color === game.turn);
                if (!lastLostMove || !lastLostMove.capturedPiece) return;

                const piece = lastLostMove.capturedPiece;
                const idParts = piece.id.split('-');
                if (idParts.length < 3) return;

                const startX = parseInt(idParts[2]);
                const startY = piece.type === 'pawn' ? (piece.color === 'white' ? 1 : 6) : (piece.color === 'white' ? 0 : 7);
                const startCoord = new Coordinate(startX, startY);

                const square = game.board.getSquare(startCoord);
                if (square && !square.piece) {
                    game.board.placePiece(startCoord, piece);
                    game.perkUsage[game.turn].add(id);
                }
            }
        }
    };

    // --- PAWN RULES ---

    public static canPawnDoubleMove(piece: Piece, y: number, startY: number, perks: Perk[]): boolean {
        let allowed = y === startY;
        const registry = PactRegistry.getInstance();

        // Check existing definitions (legacy/transition)
        for (const perk of perks) {
            const effect = this.DEFINITIONS[perk.id];
            if (effect?.canDoubleMove) {
                allowed = effect.canDoubleMove(piece, y, startY);
            }

            // Check new PactLogic system
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canDoubleMove;
            if (modifier) {
                // If ANY pact says false, it's false? Or override? Usually override.
                // Current logic: allowed is mutated. 
                // Stiff Start returns false. Vanguard returns true.
                // We should likely let them vote or override.
                // For canDoubleMove: "Always true" vs "Always false".
                // Let's assume the pact logic returns a boolean that OVERWRITES allowed if defined.
                allowed = modifier(piece, y, startY);
            }
        }
        return allowed;
    }

    public static canPawnDiagonalDash(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            if (this.DEFINITIONS[p.id]?.canDiagonalDash?.(piece)) return true;
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canDiagonalDash?.(piece);
        });
    }

    public static canPawnSidewaysMove(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            if (this.DEFINITIONS[p.id]?.canSidewaysMove?.(piece)) return true;
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canSidewaysMove?.(piece);
        });
    }

    // --- MOVEMENT RANGE ---

    public static getMaxRange(piece: Piece, perks: Perk[]): number {
        let max = 8;
        for (const perk of perks) {
            const effect = this.DEFINITIONS[perk.id];
            if (effect?.getMaxRange) {
                max = Math.min(max, effect.getMaxRange(piece));
            }
            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getMaxRange;
            if (modifier) {
                max = Math.min(max, modifier(piece));
            }
        }
        return max;
    }

    public static getFixedDistances(piece: Piece, perks: Perk[]): number[] | null {
        for (const perk of perks) {
            const distances = this.DEFINITIONS[perk.id]?.getFixedDistances?.(piece);
            if (distances) return distances;

            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getFixedDistances;
            if (modifier) {
                const dists = modifier(piece);
                if (dists) return dists;
            }
        }
        return null;
    }

    public static canMoveLikeKnight(pieceType: PieceType, perks: Perk[], usedPerks: Set<string>): boolean {
        for (const perk of perks) {
            if (usedPerks.has(perk.id)) continue;
            if (this.DEFINITIONS[perk.id]?.canMoveLikeKnight?.(pieceType)) return true;

            const pactLogic = PactRegistry.getInstance().get(perk.id);
            if (pactLogic?.getRuleModifiers()?.canMoveLikeKnight?.(pieceType)) return true;
        }
        return false;
    }

    public static canMovePiece(game: ChessGame, from: Coordinate, perks: Perk[]): boolean {
        for (const perk of perks) {
            const allowed = this.DEFINITIONS[perk.id]?.canMovePiece?.(game, from);
            if (allowed === false) return false;

            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canMovePiece;
            if (modifier && modifier(game, from) === false) return false;
        }
        return true;
    }

    // --- PROMOTION ---

    public static getAllowedPromotionTypes(piece: Piece, perks: Perk[]): PieceType[] {
        const allTypes: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
        let allowed = new Set(allTypes);

        for (const perk of perks) {
            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getAllowedPromotionTypes;
            if (modifier) {
                const types = modifier(piece);
                // Intersect allowed types
                const currentAllowed = new Set(types);
                allowed = new Set([...allowed].filter(x => currentAllowed.has(x)));
            }
        }

        return Array.from(allowed);
    }

    public static canMoveThroughFriendlies(piece: Piece, perks: Perk[]): boolean {
        return perks.some(p => {
            if (this.DEFINITIONS[p.id]?.canMoveThroughFriendlies?.(piece)) return true;
            const pactLogic = PactRegistry.getInstance().get(p.id);
            return pactLogic?.getRuleModifiers()?.canMoveThroughFriendlies?.(piece);
        });
    }

    // --- CAPTURE RULES ---

    public static canCapture(attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board: BoardModel, perks: Perk[]): boolean {
        for (const perk of perks) {
            const allowed = this.DEFINITIONS[perk.id]?.canCapture?.(attacker, victim, to, from, board);
            if (allowed === false) return false;

            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canCapture;
            if (modifier && modifier(attacker, victim, to, from, board) === false) return false;
        }
        return true;
    }

    // --- KING SAFETY ---

    public static canCastleWhileMoved(piece: Piece, perks: Perk[]): boolean {
        return perks.some(p => {
            if (this.DEFINITIONS[p.id]?.canCastleWhileMoved?.(piece)) return true;
            const pactLogic = PactRegistry.getInstance().get(p.id);
            return pactLogic?.getRuleModifiers()?.canCastleWhileMoved?.(piece);
        });
    }

    public static mustMoveKingInCheck(color: PieceColor, perks: Perk[]): boolean {
        return perks.some(p => {
            if (this.DEFINITIONS[p.id]?.mustMoveKingInCheck?.(color)) return true;
            const pactLogic = PactRegistry.getInstance().get(p.id);
            return pactLogic?.getRuleModifiers()?.mustMoveKingInCheck?.(color);
        });
    }

    // --- TURN ECONOMY & EVENTS ---

    public static onExecuteMove(game: ChessGame, move: Move, perks: Perk[]) {
        perks.forEach(p => {
            this.DEFINITIONS[p.id]?.onExecuteMove?.(game, move);
            // PactLogic hook for onExecuteMove isn't explicitly defined in RuleModifiers yet?
            // Wait, looking at PactLogic.ts, we didn't add onExecuteMove to RuleModifiers?
            // It might be better as a generic event 'move'?
            // Re-checking PactLogic.ts... I see onTurnStart/End and onEvent.
            // Move execution is a major event.
            // Let's use the registry for it if it exists in RuleModifiers, or dispatch event.
            // The plan said: onEvent(event, ...). 
            // But strict rule hooks like turn economy might be in RuleModifiers.
            // Let's stick to onEvent for now for generic stuff, but if we need strict logic...
            // Actually, let's invoke the generic onEvent here too? 
            // Or just check RuleModifiers if we added it?
            // In PactLogic.ts I did NOT add onExecuteMove to RuleModifiers.
            // But I DID add 'modifyNextTurn'.
        });
    }

    public static getNextTurn(game: ChessGame, currentTurn: PieceColor, eventType: GameEvent, perks: Perk[]): PieceColor {
        const opponent: PieceColor = currentTurn === 'white' ? 'black' : 'white';

        // 1. Check if any perk wants to modify the turn sequence
        for (const perk of perks) {
            const modified = this.DEFINITIONS[perk.id]?.modifyNextTurn?.(game, currentTurn, eventType);
            if (modified) return modified;

            const pactLogic = PactRegistry.getInstance().get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.modifyNextTurn;
            if (modifier) {
                const res = modifier(game, currentTurn, eventType);
                if (res) return res;
            }
        }

        // 2. Check extra turns stored in game state
        if (game.extraTurns[currentTurn] > 0) {
            game.extraTurns[currentTurn]--;
            return currentTurn;
        }

        return opponent;
    }

    public static useAbility(game: ChessGame, abilityId: string, params?: any, perks: Perk[] = []) {
        for (const perk of perks) {
            if (perk.id === abilityId) {
                this.DEFINITIONS[perk.id]?.onUseAbility?.(game, abilityId, params);

                const pactLogic = PactRegistry.getInstance().get(perk.id);
                if (pactLogic?.activeAbility) {
                    // Provide context
                    const context = {
                        game,
                        playerId: game.turn, // Assuming user is current turn
                        pactId: perk.id
                    };
                    pactLogic.activeAbility.execute(context, params);
                }
            }
        }
    }

    // --- UTILS & HOOKS ---

    public static addSteppingMoves(
        board: BoardModel,
        from: Coordinate,
        dirs: number[][],
        piece: Piece,
        moves: Move[]
    ) {
        const { x: startX, y: startY } = from;
        dirs.forEach(([dx, dy]) => {
            const x = startX + dx;
            const y = startY + dy;
            if (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE) {
                const coord = new Coordinate(x, y);
                const target = board.getSquare(coord);
                if (target) {
                    if (!target.piece || target.piece.color !== piece.color) {
                        moves.push(new Move(from, coord, piece, target.piece || null));
                    }
                }
            }
        });
    }

    public static onGetPseudoMoves(board: BoardModel, from: Coordinate, piece: Piece, moves: Move[], perks: Perk[], game?: ChessGame) {
        perks.forEach(p => {
            this.DEFINITIONS[p.id]?.onGetPseudoMoves?.(board, from, piece, moves, game);

            const pactLogic = PactRegistry.getInstance().get(p.id);
            pactLogic?.getRuleModifiers()?.onGetPseudoMoves?.({
                board, from, piece, moves, game
            });
        });
    }
}
