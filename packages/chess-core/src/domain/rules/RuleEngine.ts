import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Piece, PieceColor, PieceType } from '../models/Piece';
import { Perk } from '../models/Pact';
import { Move } from '../models/Move';
import { IChessGame, GameEvent } from '../GameTypes';
import { PactRegistry } from '../pacts/PactRegistry';
import { PactLogic, PactContextWithState, CaptureContext, MoveContext, TurnModifierContext, RuleModifiers } from '../pacts/PactLogic';

export class RuleEngine {

    private static evaluateModifierTarget(logic: PactLogic | undefined, pactOwner: PieceColor, subjectPieceColor: PieceColor): boolean {
        if (!logic) return false;
        if (logic.target === 'global') return true;
        if (logic.target === 'enemy') return subjectPieceColor !== pactOwner;
        return subjectPieceColor === pactOwner;
    }


    private static buildContext(game: IChessGame | undefined, playerId: PieceColor, pactId: string): PactContextWithState<any> | undefined {
        if (!game) return undefined;
        const logic = PactRegistry.getInstance().get(pactId) as PactLogic;
        return logic?.createContextWithState({ game, playerId, pactId });
    }

    private static getAppliedModifiers<K extends keyof RuleModifiers>(
        key: K,
        perks: Perk[],
        subjectColor: PieceColor,
        game?: IChessGame
    ): { modifier: NonNullable<RuleModifiers[K]>; context: PactContextWithState<any> }[] {
        const result: { modifier: NonNullable<RuleModifiers[K]>; context: PactContextWithState<any> }[] = [];
        const registry = PactRegistry.getInstance();

        for (const perk of perks) {
            const pactLogic = registry.get(perk.id) as PactLogic;
            if (!pactLogic) continue;

            const modifiers = registry.getCachedModifiers(perk.id) || {};
            const modifier = (modifiers as any)[key];
            if (!modifier) continue;

            const context = RuleEngine.buildContext(game, subjectColor, perk.id);
            if (!context) continue;

            if (RuleEngine.evaluateModifierTarget(pactLogic, subjectColor, subjectColor)) {
                result.push({ modifier, context });
            }
        }
        return result;
    }

    // --- PAWN RULES ---

    public static canPawnDoubleMove(piece: Piece, y: number, startY: number, perks: Perk[], game?: IChessGame): boolean {
        let allowed = y === startY;
        const modifiers = RuleEngine.getAppliedModifiers('canDoubleMove', perks, piece.color, game);

        for (const { modifier, context } of modifiers) {
            allowed = modifier(piece, y, startY, context);
            if (!allowed) return false;
        }
        return allowed;
    }

    public static canPawnDiagonalDash(piece: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('canDiagonalDash', perks, piece.color, game);
        return modifiers.some(({ modifier, context }) => modifier(piece, context));
    }

    public static canPawnSidewaysMove(piece: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('canSidewaysMove', perks, piece.color, game);
        return modifiers.some(({ modifier, context }) => modifier(piece, context));
    }

    // --- MOVEMENT RANGE ---

    public static getMaxRange(piece: Piece, perks: Perk[], game?: IChessGame): number {
        let max = 8;
        const modifiers = RuleEngine.getAppliedModifiers('getMaxRange', perks, piece.color, game);
        for (const { modifier, context } of modifiers) {
            max = Math.min(max, modifier(piece, context));
        }
        return max;
    }

    public static getFixedDistances(piece: Piece, perks: Perk[], game?: IChessGame): number[] | null {
        const modifiers = RuleEngine.getAppliedModifiers('getFixedDistances', perks, piece.color, game);
        for (const { modifier, context } of modifiers) {
            const dists = modifier(piece, context);
            if (dists) return dists;
        }
        return null;
    }

    public static canMoveLikeKnight(pieceType: PieceType, perks: Perk[], usedPerks: Set<string>, game?: IChessGame): boolean {
        const unusedPerks = perks.filter(p => !usedPerks.has(p.id));
        const color = "white"; // TODO correct color mapping later? Knight is symmetric
        const modifiers = RuleEngine.getAppliedModifiers('canMoveLikeKnight', unusedPerks, color, game);
        return modifiers.some(({ modifier, context }) => modifier(pieceType, context));
    }

    public static canMovePiece(game: IChessGame, from: Coordinate, perks: Perk[], board?: BoardModel): boolean {
        // Core Rule: Generic Cooldown check
        const targetBoard = board || game.board;
        const square = targetBoard.getSquare(from);
        if (square?.piece) {
            const cooldown = game.pieceCooldowns.get(square.piece.id);
            if (cooldown && cooldown > 0) return false;
        }

        const pieceColor = square?.piece?.color || "white";
        const modifiers = RuleEngine.getAppliedModifiers('canMovePiece', perks, pieceColor, game);
        const params: MoveContext = { game, board: targetBoard, from };

        for (const { modifier, context } of modifiers) {
            if (modifier(params, context) === false) return false;
        }
        return true;
    }

    // --- PROMOTION ---

    public static getAllowedPromotionTypes(piece: Piece, perks: Perk[], game?: IChessGame): PieceType[] {
        const allTypes: PieceType[] = ['queen', 'rook', 'bishop', 'knight'];
        let allowed = new Set(allTypes);
        const modifiers = RuleEngine.getAppliedModifiers('getAllowedPromotionTypes', perks, piece.color, game);

        for (const { modifier, context } of modifiers) {
            const types = modifier(piece, context);
            const currentAllowed = new Set(types);
            allowed = new Set([...allowed].filter(x => currentAllowed.has(x)));
        }

        return Array.from(allowed);
    }

    public static canMoveThroughFriendlies(mover: Piece, obstacle: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('canMoveThroughFriendlies', perks, mover.color, game);
        return modifiers.some(({ modifier, context }) => modifier(mover, obstacle, context));
    }

    public static hasEcholocation(piece: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('hasEcholocation', perks, piece.color, game);
        return modifiers.some(({ modifier, context }) => modifier(piece, context));
    }

    // --- CAPTURE RULES ---

    public static canCapture(game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board: BoardModel, perks: Perk[]): boolean {
        const params: CaptureContext = { game, board, attacker, victim, from, to };

        const attackerModifiers = RuleEngine.getAppliedModifiers('canCapture', perks, attacker.color, game);
        for (const { modifier, context } of attackerModifiers) {
            if (modifier(params, context) === false) return false;
        }

        // Check if victim has a pact that prevents it from being captured
        if (game) {
            const victimPacts = game.pacts[victim.color].map(p => [p.bonus, p.malus]).flat();
            const victimModifiers = RuleEngine.getAppliedModifiers('canBeCaptured', victimPacts, victim.color, game);
            for (const { modifier, context } of victimModifiers) {
                if (modifier(params, context) === false) return false;
            }
        }

        return true;
    }

    // --- KING SAFETY ---

    public static canCastleWhileMoved(piece: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('canCastleWhileMoved', perks, piece.color, game);
        return modifiers.some(({ modifier, context }) => modifier(piece, context));
    }

    public static canCastle(piece: Piece, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('canCastle', perks, piece.color, game);
        for (const { modifier, context } of modifiers) {
            if (modifier(piece, context) === false) return false;
        }
        return true;
    }

    public static mustMoveKingInCheck(color: PieceColor, perks: Perk[], game?: IChessGame): boolean {
        const modifiers = RuleEngine.getAppliedModifiers('mustMoveKingInCheck', perks, color, game);
        return modifiers.some(({ modifier, context }) => modifier(color, context));
    }

    // --- TURN ECONOMY & EVENTS ---

    public static onExecuteMove(game: IChessGame, move: Move, perks: Perk[]) {
        const pieceColor = move.piece?.color || "white";
        const modifiers = RuleEngine.getAppliedModifiers('onExecuteMove', perks, pieceColor, game);
        for (const { modifier, context } of modifiers) {
            modifier(game, move, context);
        }
    }

    public static getNextTurn(game: IChessGame, currentTurn: PieceColor, eventType: GameEvent, perks: Perk[]): PieceColor {
        const opponent: PieceColor = currentTurn === 'white' ? 'black' : 'white';
        const modifiers = RuleEngine.getAppliedModifiers('modifyNextTurn', perks, currentTurn, game);

        // 1. Check if any pact wants to modify the turn sequence
        for (const { modifier, context } of modifiers) {
            const params: TurnModifierContext = { game, currentTurn, eventType };
            const res = modifier(params, context);
            if (res) return res;
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
                const ability = pactLogic?.activeAbility;
                if (ability) {
                    const typedLogic = pactLogic as PactLogic;
                    const context = {
                        game,
                        playerId: game.turn,
                        pactId: perk.id
                    };
                    return ability.execute(typedLogic.createContextWithState(context), params);
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
        const modifiers = RuleEngine.getAppliedModifiers('onGetPseudoMoves', perks, piece.color, game);
        for (const { modifier, context } of modifiers) {
            modifier({
                board, from, piece, moves, game, perks,
                orientation: game?.orientation ?? 0
            }, context);
        }
    }
}
