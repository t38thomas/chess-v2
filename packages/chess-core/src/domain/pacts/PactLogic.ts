import { IChessGame, GameEvent } from '../GameTypes';
import { PieceColor, Piece, PieceType } from '../models/Piece';
import { Move } from '../models/Move';
import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Perk } from '../models/Pact';

export interface PactContext {
    game: IChessGame;
    playerId: PieceColor;
    pactId: string;
}

export interface PactContextWithState<T> extends PactContext {
    state: T;
    updateState: (update: Partial<T> | ((prev: T) => T)) => void;
}

/**
 * Represents a reusable piece of pact logic.
 */
export interface PactEffect {
    modifiers?: RuleModifiers;
    onEvent?: <K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: any,
        context: PactContext
    ) => void;
}

/**
 * Strongly typed payloads for game events.
 */
export interface GameEventPayloads {
    'move': Move;
    'turn_start': { playerId: PieceColor };
    'turn_end': { playerId: PieceColor };
    'capture': { attacker: Piece; victim: Piece; to: Coordinate; from: Coordinate };
    'pact_effect': any;
    'checkmate': { winner: PieceColor };
    'draw': { reason: string };
    'promotion': { piece: Piece; type: PieceType; coord: Coordinate };
    // Add other event types as needed
}

export interface PactDefinition {
    id: string; // The UI/Meta ID for the pact (e.g. 'berserker')
    bonus: PactLogic;
    malus: PactLogic;
}

export interface ActiveAbilityConfig<T = any> {
    id: string;
    name: string; // Internal name or key for translation
    description: string; // Internal desc or key
    icon: string;
    cooldown?: number; // Turns
    maxUses?: number; // per game
    targetType: 'none' | 'square' | 'piece';
    consumesTurn?: boolean;
    repeatable?: boolean;
    maxTargets?: number;
    execute: (context: PactContextWithState<T>, params: any) => boolean;
}

export interface MoveParams {
    board: BoardModel;
    piece: Piece;
    from: Coordinate;
    moves: Move[];
    game?: IChessGame;
    perks?: Perk[];
    orientation?: number; // 0-3 (clockwise 90° steps), matches game.orientation
}

export interface MoveContext {
    game: IChessGame;
    board: BoardModel;
    from: Coordinate;
}

export interface CaptureContext {
    game: IChessGame | undefined;
    board: BoardModel;
    attacker: Piece;
    victim: Piece;
    from: Coordinate;
    to: Coordinate;
}

export interface TurnModifierContext {
    game: IChessGame;
    currentTurn: PieceColor;
    eventType: GameEvent;
}

export interface RuleModifiers {
    // Movement Hooks
    onGetPseudoMoves?: (params: MoveParams, context: PactContextWithState<any>) => void;

    // Movement overrides
    getMaxRange?: (piece: Piece, context: PactContextWithState<any>) => number;
    getFixedDistances?: (piece: Piece, context: PactContextWithState<any>) => number[] | null;
    canDoubleMove?: (piece: Piece, y: number, startY: number, context: PactContextWithState<any>) => boolean;
    canDiagonalDash?: (piece: Piece, context: PactContextWithState<any>) => boolean;
    canSidewaysMove?: (piece: Piece, context: PactContextWithState<any>) => boolean;
    canMoveThroughFriendlies?: (mover: Piece, obstacle: Piece, context: PactContextWithState<any>) => boolean;
    canMoveLikeKnight?: (pieceType: PieceType, context: PactContextWithState<any>) => boolean;
    hasEcholocation?: (piece: Piece, context: PactContextWithState<any>) => boolean;
    canMovePiece?: (params: MoveContext, context: PactContextWithState<any>) => boolean;

    // Promotion overrides
    getAllowedPromotionTypes?: (piece: Piece, context: PactContextWithState<any>) => PieceType[];

    // Capture overrides
    canCapture?: (params: CaptureContext, context: PactContextWithState<any>) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece, context: PactContextWithState<any>) => boolean;
    canCastle?: (piece: Piece, context: PactContextWithState<any>) => boolean;
    mustMoveKingInCheck?: (color: PieceColor, context: PactContextWithState<any>) => boolean;

    // Turn Economy & Special Rules
    modifyNextTurn?: (params: TurnModifierContext, context: PactContextWithState<any>) => PieceColor | null;
    onExecuteMove?: (game: IChessGame, move: Move, context: PactContextWithState<any>) => void;

    // Attack/Defense modifiers
    canBeCaptured?: (params: CaptureContext, context: PactContextWithState<any>) => boolean;
    isImmuneToCheckmate?: (game: IChessGame, context: PactContextWithState<any>) => boolean;
}

export abstract class PactLogic<T = any> {
    abstract id: string;
    public target: 'self' | 'enemy' | 'global' = 'self';

    /**
     * Returns the initial state for this pact.
     * This state will be stored in the game's serializable pactState.
     */
    getInitialState(): T | null {
        return null;
    }

    /**
     * Helper to get or initialize the state for this pact from the game instance.
     */
    protected getState(game: any, color: PieceColor): T {
        const key = `${this.id}_${color}`;
        if (!game.pactState) {
            game.pactState = {};
        }
        if (game.pactState[key] === undefined) {
            const initial = this.getInitialState();
            game.pactState[key] = initial;
        }
        return game.pactState[key];
    }

    /**
     * Helper to update the state for this pact.
     */
    protected setState(game: any, color: PieceColor, state: T): void {
        const key = `${this.id}_${color}`;
        if (!game.pactState) {
            game.pactState = {};
        }
        game.pactState[key] = state;
    }

    public createContextWithState(context: PactContext): PactContextWithState<T> {
        const state = this.getState(context.game, context.playerId);
        return {
            ...context,
            state,
            updateState: (update) => {
                const currentState = this.getState(context.game, context.playerId);
                const nextState = typeof update === 'function'
                    ? (update as Function)(currentState)
                    : { ...currentState, ...update };
                this.setState(context.game, context.playerId, nextState);
            }
        };
    }

    // Hooks primarily for RuleEngine integration
    getRuleModifiers(): RuleModifiers {
        return {};
    }

    // Typed Event Handling (Supports both new and legacy styles)
    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: any,
        context: PactContext
    ): void {
        const ctx = this.createContextWithState(context);
        if (event === 'move') this.onMove?.(payload, ctx);
        if (event === 'capture') this.onCapture?.(payload, ctx);
        if (event === 'checkmate') this.onCheckmate?.(payload, ctx);
        if (event === 'turn_start') this.onTurnStart?.(ctx);
        if (event === 'turn_end') this.onTurnEnd?.(ctx);
        if (event === 'promotion') this.onPromotion?.(payload, ctx);
    }

    // Typed Hooks (Override these for cleaner logic)
    protected onMove?(payload: GameEventPayloads['move'], context: PactContextWithState<T>): void;
    protected onCapture?(payload: GameEventPayloads['capture'], context: PactContextWithState<T>): void;
    protected onCheckmate?(payload: GameEventPayloads['checkmate'], context: PactContextWithState<T>): void;
    protected onPromotion?(payload: GameEventPayloads['promotion'], context: PactContextWithState<T>): void;

    // Turn Hooks
    onTurnStart(pactContext: PactContext): void {
        const ctx = this.createContextWithState(pactContext);
        this.onTurnStartHook?.(ctx);
    }

    onTurnEnd(pactContext: PactContext): void {
        const ctx = this.createContextWithState(pactContext);
        this.onTurnEndHook?.(ctx);
    }

    protected onTurnStartHook?(context: PactContextWithState<T>): void;
    protected onTurnEndHook?(context: PactContextWithState<T>): void;

    // Ability configuration
    activeAbility?: ActiveAbilityConfig<T>;

    // UI Helpers
    getTurnCounters(context: PactContext): TurnCounter[] {
        return [];
    }
}

/**
 * A concrete implementation of PactLogic that accepts functions to define its behavior.
 */
class GenericPact<T = any> extends PactLogic<T> {
    constructor(
        public readonly id: string,
        private readonly options: PactLogicOptions<T>
    ) {
        super();
        this.activeAbility = options.activeAbility;
        this.target = options.target || 'self';
    }

    getInitialState(): T | null {
        return this.options.initialState ? this.options.initialState() : null;
    }

    getRuleModifiers(): RuleModifiers {
        const base = this.options.modifiers || {};
        const effectModifiers = (this.options.effects || [])
            .map(e => e.modifiers)
            .filter(m => m !== undefined) as RuleModifiers[];

        if (effectModifiers.length === 0) return base;

        return Object.assign({}, ...effectModifiers, base);
    }

    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: any,
        context: PactContext
    ): void {
        const ctx = this.createContextWithState(context);

        // New typed hooks
        if (event === 'move' && this.options.onMove) this.options.onMove(payload, ctx);
        if (event === 'capture' && this.options.onCapture) this.options.onCapture(payload, ctx);
        if (event === 'checkmate' && this.options.onCheckmate) this.options.onCheckmate(payload, ctx);
        if (event === 'promotion' && this.options.onPromotion) this.options.onPromotion(payload, ctx);

        // Effects hooks
        if (this.options.effects) {
            for (const effect of this.options.effects) {
                effect.onEvent?.(event, payload, ctx);
            }
        }
    }

    onTurnStart(context: PactContext): void {
        if (this.options.onTurnStart) {
            this.options.onTurnStart(this.createContextWithState(context));
        }
        else if (this.onTurnStartHook) {
            this.onTurnStartHook(this.createContextWithState(context));
        }
    }

    onTurnEnd(context: PactContext): void {
        if (this.options.onTurnEnd) {
            this.options.onTurnEnd(this.createContextWithState(context));
        }
        else if (this.onTurnEndHook) {
            this.onTurnEndHook(this.createContextWithState(context));
        }
    }

    getTurnCounters(context: PactContext): TurnCounter[] {
        return this.options.getTurnCounters ? this.options.getTurnCounters(this.createContextWithState(context)) : [];
    }

}


/**
 * Builder for defining pacts declaratively.
 */
export interface PactLogicOptions<T = any> {
    target?: 'self' | 'enemy' | 'global';
    effects?: PactEffect[];
    modifiers?: RuleModifiers;
    onMove?: (payload: GameEventPayloads['move'], context: PactContextWithState<T>) => void;
    onCapture?: (payload: GameEventPayloads['capture'], context: PactContextWithState<T>) => void;
    onCheckmate?: (payload: GameEventPayloads['checkmate'], context: PactContextWithState<T>) => void;
    onPromotion?: (payload: GameEventPayloads['promotion'], context: PactContextWithState<T>) => void;
    onTurnStart?: (context: PactContextWithState<T>) => void;
    onTurnEnd?: (context: PactContextWithState<T>) => void;
    initialState?: () => T;
    activeAbility?: ActiveAbilityConfig<T>;
    getTurnCounters?: (context: PactContextWithState<T>) => TurnCounter[];
}

export class PactBuilder<TBonus = any, TMalus = any> {
    private bonusLogic?: { id: string } & PactLogicOptions<TBonus>;
    private malusLogic?: { id: string } & PactLogicOptions<TMalus>;

    constructor(private readonly pactId: string) { }

    bonus<T = TBonus>(id: string, options: PactLogicOptions<T>): PactBuilder<T, TMalus> {
        this.bonusLogic = { id, ...options } as any;
        return this as any;
    }

    malus<T = TMalus>(id: string, options: PactLogicOptions<T>): PactBuilder<TBonus, T> {
        this.malusLogic = { id, ...options } as any;
        return this as any;
    }

    build(): PactDefinition {
        if (!this.bonusLogic || !this.malusLogic) {
            throw new Error(`Pact ${this.pactId} must have both a bonus and a malus defined.`);
        }

        return {
            id: this.pactId,
            bonus: new GenericPact(this.bonusLogic.id, this.bonusLogic),
            malus: new GenericPact(this.malusLogic.id, this.malusLogic),
        };
    }
}

export function definePact<TBonus = any, TMalus = any>(id: string): PactBuilder<TBonus, TMalus> {
    return new PactBuilder<TBonus, TMalus>(id);
}

export interface TurnCounter {
    id: string;
    label: string; // Internal name or key for translation
    value: number;
    pactId: string; // The pact ID to get the icon from registry
    type: 'cooldown' | 'counter';
    maxValue?: number; // Optional for progress bars
    subLabel?: string; // Optional sub-label (e.g. "turns left")
}

