import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../models/Piece';
import { Perk } from '../models/Pact';
import { Move } from '../models/Move';
import { IChessGame, GameEvent } from '../GameTypes';
import { PactRegistry } from '../pacts/PactRegistry';

export class RuleEngine {

    // --- PAWN RULES ---

    public static canPawnDoubleMove(piece: Piece, y: number, startY: number, perks: Perk[]): boolean {
        let allowed = y === startY;
        const registry = PactRegistry.getInstance();

        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canDoubleMove;
            if (modifier) {
                // If a pact defines a modifier, it takes precedence
                allowed = modifier(piece, y, startY);
                // If any pact expressly forbids it, we stop and return false
                if (!allowed) return false;
            }
        }
        return allowed;
    }

    public static canPawnDiagonalDash(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canDiagonalDash?.(piece);
        });
    }

    public static canPawnSidewaysMove(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canSidewaysMove?.(piece);
        });
    }

    // --- MOVEMENT RANGE ---

    public static getMaxRange(piece: Piece, perks: Perk[]): number {
        let max = 8;
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getMaxRange;
            if (modifier) {
                max = Math.min(max, modifier(piece));
            }
        }
        return max;
    }

    public static getFixedDistances(piece: Piece, perks: Perk[]): number[] | null {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getFixedDistances;
            if (modifier) {
                const dists = modifier(piece);
                if (dists) return dists;
            }
        }
        return null;
    }

    public static canMoveLikeKnight(pieceType: PieceType, perks: Perk[], usedPerks: Set<string>): boolean {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            if (usedPerks.has(perk.id)) continue;
            const pactLogic = registry.get(perk.id);
            if (pactLogic?.getRuleModifiers()?.canMoveLikeKnight?.(pieceType)) return true;
        }
        return false;
    }

    public static canMovePiece(game: IChessGame, from: Coordinate, perks: Perk[], board?: BoardModel): boolean {
        // Core Rule: Generic Cooldown check
        const targetBoard = board || game.board;
        const square = targetBoard.getSquare(from);
        if (square?.piece) {
            const cooldown = game.pieceCooldowns.get(square.piece.id);
            if (cooldown && cooldown > 0) return false;
        }

        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canMovePiece;
            if (modifier && modifier(game, from, targetBoard) === false) return false;
        }
        return true;
    }

    // --- PROMOTION ---

    public static getAllowedPromotionTypes(piece: Piece, perks: Perk[]): PieceType[] {
        const allTypes: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
        let allowed = new Set(allTypes);
        const registry = PactRegistry.getInstance();

        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.getAllowedPromotionTypes;
            if (modifier) {
                const types = modifier(piece);
                const currentAllowed = new Set(types);
                allowed = new Set([...allowed].filter(x => currentAllowed.has(x)));
            }
        }

        return Array.from(allowed);
    }

    public static canMoveThroughFriendlies(mover: Piece, obstacle: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canMoveThroughFriendlies?.(mover, obstacle);
        });
    }

    public static hasEcholocation(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.hasEcholocation?.(piece);
        });
    }

    // --- CAPTURE RULES ---

    public static canCapture(game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board: BoardModel, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canCapture;
            if (modifier && modifier(game, attacker, victim, to, from, board) === false) return false;
        }

        // Check if victim has a pact that prevents it from being captured
        if (game) {
            const victimPacts = game.pacts[victim.color].map(p => [p.bonus, p.malus]).flat();
            for (const perk of victimPacts) {
                const pactLogic = registry.get(perk.id);
                const modifier = pactLogic?.getRuleModifiers()?.canBeCaptured;
                if (modifier && modifier(game, attacker, victim, to, from, board) === false) return false;
            }
        }

        return true;
    }

    // --- KING SAFETY ---

    public static canCastleWhileMoved(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.canCastleWhileMoved?.(piece);
        });
    }

    public static canCastle(piece: Piece, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            const modifier = pactLogic?.getRuleModifiers()?.canCastle;
            if (modifier && modifier(piece) === false) return false;
        }
        return true;
    }

    public static mustMoveKingInCheck(color: PieceColor, perks: Perk[]): boolean {
        const registry = PactRegistry.getInstance();
        return perks.some(p => {
            const pactLogic = registry.get(p.id);
            return pactLogic?.getRuleModifiers()?.mustMoveKingInCheck?.(color);
        });
    }

    // --- TURN ECONOMY & EVENTS ---

    public static onExecuteMove(game: IChessGame, move: Move, perks: Perk[]) {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
            pactLogic?.getRuleModifiers()?.onExecuteMove?.(game, move);
        }
    }

    public static getNextTurn(game: IChessGame, currentTurn: PieceColor, eventType: GameEvent, perks: Perk[]): PieceColor {
        const opponent: PieceColor = currentTurn === 'white' ? 'black' : 'white';
        const registry = PactRegistry.getInstance();

        // 1. Check if any pact wants to modify the turn sequence
        for (const perk of perks) {
            const pactLogic = registry.get(perk.id);
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

    public static useAbility(game: IChessGame, abilityId: string, params?: any, perks: Perk[] = []): boolean {
        const registry = PactRegistry.getInstance();
        for (const perk of perks) {
            if (perk.id === abilityId) {
                const pactLogic = registry.get(perk.id);
                if (pactLogic?.activeAbility) {
                    const context = {
                        game,
                        playerId: game.turn,
                        pactId: perk.id
                    };
                    return pactLogic.activeAbility.execute(context, params);
                }
            }
        }
        return false;
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

    public static onGetPseudoMoves(board: BoardModel, from: Coordinate, piece: Piece, moves: Move[], perks: Perk[], game?: IChessGame) {
        const registry = PactRegistry.getInstance();
        perks.forEach(p => {
            const pactLogic = registry.get(p.id);
            pactLogic?.getRuleModifiers()?.onGetPseudoMoves?.({
                board, from, piece, moves, game, perks
            });
        });
    }
}
