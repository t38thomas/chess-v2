import { IChessGame, GameEvent, GameEventPayloads, PactEffectNotification } from '../GameTypes';
import { PieceColor, Piece, PieceType } from '../models/Piece';
import { Move } from '../models/Move';
import { BoardModel } from '../models/BoardModel';
import { Coordinate } from '../models/Coordinate';
import { Perk } from '../models/Pact';
import { BoardUtils } from './utils/BoardUtils';
import { IconName } from '../models/Icon';

export interface PieceQueryResult extends Array<{ piece: Piece; coord: Coordinate }> {
    ofTypes(types: PieceType[]): PieceQueryResult;
    byId(id: string): { piece: Piece; coord: Coordinate } | undefined;
    atCoord(coord: Coordinate): { piece: Piece; coord: Coordinate } | undefined;
    inRange(from: Coordinate, range: number): PieceQueryResult;
}

export interface PactContext {
    game: IChessGame;
    playerId: PieceColor;
    pactId: string;
    /**
     * Stack of active pact/engine calls. Used to detect and prevent infinite recursion
     * (e.g. Sentinel logic checking captureability while being checked for capture).
     */
    callStack?: string[];
}

export interface PactContextWithState<T, TSibling = unknown> extends PactContext {
    readonly state: Readonly<T>;
    updateState: (update: Partial<T> | ((prev: Readonly<T>) => Readonly<T>)) => void;
    /**
     * Gets the state of the sibling logic (bonus if this is malus, or vice-versa).
     */
    getSiblingState: () => Readonly<TSibling> | null;
    /**
     * Fluent query API for common board/piece operations.
     */
    query: {
        pieces: (color?: PieceColor) => {
            all: () => PieceQueryResult;
            friendly: () => PieceQueryResult;
            enemy: () => PieceQueryResult;
            ofTypes: (types: PieceType[]) => PieceQueryResult;
            byId: (id: string) => { piece: Piece; coord: Coordinate } | undefined;
            atCoord: (coord: Coordinate) => { piece: Piece; coord: Coordinate } | undefined;
        };
        isCheckmated: (color?: PieceColor) => boolean;
    };

}

export enum PactPriority {
    EARLY = 100,
    NORMAL = 0,
    LATE = -100,
    VERY_LATE = -200
}

/**
 * Represents a reusable piece of pact logic.
 */
export interface PactEffect<T = any, TSibling = any> {
    modifiers?: RuleModifiers<T, TSibling>;
    priority?: number; // Defines execution order (higher priority runs earlier), default 0
    onEvent?: <K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: K extends keyof GameEventPayloads ? GameEventPayloads[K] : unknown,
        context: PactContextWithState<T, TSibling>
    ) => void;
}



export interface PactDefinition {
    id: string; // The UI/Meta ID for the pact (e.g. 'berserker')
    bonus: PactLogic;
    malus: PactLogic;
}

export interface ActiveAbilityConfig<TState = Record<string, unknown>, TSibling = Record<string, unknown>, TParams = unknown> {
    id: string;
    name: string; // Internal name or key for translation
    description: string; // Internal desc or key
    icon: IconName;
    cooldown?: number; // Turns
    maxUses?: number; // per game
    targetType: 'none' | 'square' | 'piece';
    consumesTurn?: boolean;
    repeatable?: boolean;
    maxTargets?: number;
    validateParams?: (params: unknown) => params is TParams;
    execute: (context: PactContextWithState<TState, TSibling>, params: TParams) => boolean;
}

export interface MoveParams {
    board: BoardModel;
    piece: Piece;
    from: Coordinate;
    moves: Move[];
    game?: IChessGame;
    pacts?: PactLogic[];
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

export interface RuleModifiers<T = Record<string, unknown>, TSibling = Record<string, unknown>> {
    // Movement Hooks - Now pure functions passing through a pipeline
    onModifyMoves?: (currentMoves: Move[], params: MoveParams, context: PactContextWithState<T, TSibling>) => Move[];

    // Movement overrides
    getMaxRange?: (piece: Piece, context: PactContextWithState<T, TSibling>) => number;
    getFixedDistances?: (piece: Piece, context: PactContextWithState<T, TSibling>) => number[] | null;
    canDoubleMove?: (piece: Piece, y: number, startY: number, context: PactContextWithState<T, TSibling>) => boolean;
    canDiagonalDash?: (piece: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    canSidewaysMove?: (piece: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    canMoveThroughFriendlies?: (mover: Piece, obstacle: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    canMoveLikeKnight?: (pieceType: PieceType, context: PactContextWithState<T, TSibling>) => boolean;
    hasEcholocation?: (piece: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    canMovePiece?: (params: MoveContext, context: PactContextWithState<T, TSibling>) => boolean;

    // Promotion overrides
    getAllowedPromotionTypes?: (piece: Piece, context: PactContextWithState<T, TSibling>) => PieceType[];

    // Capture overrides
    canCapture?: (params: CaptureContext, context: PactContextWithState<T, TSibling>) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    canCastle?: (piece: Piece, context: PactContextWithState<T, TSibling>) => boolean;
    mustMoveKingInCheck?: (color: PieceColor, context: PactContextWithState<T, TSibling>) => boolean;

    // Turn Economy & Special Rules
    modifyNextTurn?: (params: TurnModifierContext, context: PactContextWithState<T, TSibling>) => PieceColor | null;
    onExecuteMove?: (game: IChessGame, move: Move, context: PactContextWithState<T, TSibling>) => void;

    // Attack/Defense modifiers
    canBeCaptured?: (params: CaptureContext, context: PactContextWithState<T, TSibling>) => boolean;
    isImmuneToCheckmate?: (game: IChessGame, context: PactContextWithState<T, TSibling>) => boolean;
}

/**
 * Flyweight implementation of the pact context to reduce memory allocation
 * and provide built-in caching for expensive queries.
 */
class PactContextFlyweight<T, TSibling> implements PactContextWithState<T, TSibling> {
    public game: IChessGame;
    public playerId: PieceColor;
    public pactId: string;
    public callStack: string[];
    public state: Readonly<T>;

    private _query: PactContextWithState<T, TSibling>['query'];
    private _pieceCache: Map<string, PieceQueryResult> = new Map();
    private _checkmateCache: Map<PieceColor, boolean> = new Map();

    constructor(
        context: PactContext,
        state: T,
        private logic: PactLogic<T, TSibling>
    ) {
        this.game = context.game;
        this.playerId = context.playerId;
        this.pactId = context.pactId;
        this.callStack = context.callStack || [];
        this.state = state;

        this._query = {
            pieces: (colorOverride?: PieceColor) => {
                const color = colorOverride || this.playerId;

                const getCached = (c: PieceColor) => {
                    const cacheKey = `pieces_${c}`;
                    if (this._pieceCache.has(cacheKey)) {
                        return this._pieceCache.get(cacheKey)!;
                    }
                    const wrap = (pieces: { piece: Piece, coord: Coordinate }[]) => Object.assign(pieces, {
                        ofTypes: (types: PieceType[]) => wrap(pieces.filter(p => types.includes(p.piece.type))),
                        byId: (id: string) => pieces.find(p => p.piece.id === id),
                        atCoord: (coord: Coordinate) => pieces.find(p => p.coord.x === coord.x && p.coord.y === coord.y),
                        inRange: (from: Coordinate, range: number) => wrap(pieces.filter(p => Math.max(Math.abs(p.coord.x - from.x), Math.abs(p.coord.y - from.y)) <= range))
                    }) as PieceQueryResult;

                    const result = wrap(BoardUtils.findPieces(this.game, c));
                    this._pieceCache.set(cacheKey, result);
                    return result;
                };

                return {
                    all: () => getCached(color),
                    friendly: () => getCached(color),
                    enemy: () => getCached(color === 'white' ? 'black' : 'white'),
                    ofTypes: (types: PieceType[]) => getCached(color).ofTypes(types),
                    byId: (id: string) => getCached(color).byId(id),
                    atCoord: (coord: Coordinate) => getCached(color).atCoord(coord),
                    inRange: (from: Coordinate, range: number) => getCached(color).inRange(from, range)
                };
            },
            isCheckmated: (colorOverride?: PieceColor) => {
                const color = colorOverride || this.playerId;
                if (this._checkmateCache.has(color)) return this._checkmateCache.get(color)!;

                const result = this.game.status === 'checkmate' && this.game.turn === color;
                this._checkmateCache.set(color, result);
                return result;
            }
        };
    }

    public get query() { return this._query; }

    public updateState(update: Partial<T> | ((prev: Readonly<T>) => Readonly<T>)): void {
        const currentState = this.logic.getState(this.game, this.playerId);
        const nextState = typeof update === 'function'
            ? (update as (prev: Readonly<T>) => Readonly<T>)(currentState)
            : { ...currentState, ...update };

        if (this.logic.validateState && !this.logic.validateState(nextState)) {
            console.warn(`[PactSystem] State validation failed for pact: ${this.pactId}`);
        }

        this.logic.setState(this.game, this.playerId, nextState);
        // Sync flyweight state
        this.state = nextState;
    }

    public getSiblingState(): Readonly<TSibling> | null {
        if (!this.logic.siblingId) return null;
        // Accessing internal state of sibling logic
        return (this.logic as any).getRawState(this.game, this.playerId, this.logic.siblingId) as Readonly<TSibling>;
    }
}

export abstract class PactLogic<T = Record<string, unknown>, TSibling = Record<string, unknown>> {
    abstract id: string;
    public target: 'self' | 'enemy' | 'global' = 'self';
    public siblingId?: string;
    public validateState?: (state: T) => boolean;
    /**
     * Used by RuleEngine to access effects. Properly typed via PactLogicOptions in GenericPact.
     */
    public options?: PactLogicOptions<T, TSibling>;

    // Metadata Getters (SPoD)
    public get icon(): string | undefined { return this.options?.icon; }
    public get ranking(): number | undefined { return this.options?.ranking; }
    public get category(): string | undefined { return this.options?.category; }
    public get i18nKey(): string | undefined { return this.options?.i18nKey || this.id; }

    /**
     * Returns the initial state for this pact.
     * This state will be stored in the game's serializable pactState.
     */
    getInitialState(): T | null {
        return null;
    }

    /**
     * Internal helper to get raw state without type safety.
     */
    protected getRawState(game: IChessGame, color: PieceColor, pactId: string): any {
        const key = `${pactId}_${color}`;
        if (!game.pactState) {
            (game as IChessGame & { pactState: Record<string, unknown> }).pactState = {};
        }
        if (game.pactState[key] === undefined || game.pactState[key] === null) {
            // This is a bit of a hack: ideally we'd know if this is the main pact or a sibling
            // to call getInitialState(), but for siblings we often just want the defaults.
            const initial = pactId === this.id ? this.getInitialState() : {};
            game.pactState[key] = initial !== null ? initial : {};
        }
        return game.pactState[key];
    }

    /**
     * Helper to get or initialize the state for this pact from the game instance.
     */
    public getState(game: IChessGame, color: PieceColor): T {
        return this.getRawState(game, color, this.id);
    }


    /**
     * Helper to update the state for this pact.
     */
    public setState(game: IChessGame, color: PieceColor, state: T): void {
        const key = `${this.id}_${color}`;
        if (!game.pactState) {
            (game as IChessGame & { pactState: Record<string, unknown> }).pactState = {};
        }
        game.pactState[key] = state;
    }

    public createContextWithState(context: PactContext): PactContextWithState<T, TSibling> {
        const state = this.getState(context.game, context.playerId);
        return new PactContextFlyweight(context, state, this);
    }



    // Hooks primarily for RuleEngine integration
    getRuleModifiers(): RuleModifiers<T, TSibling> {
        return {};
    }

    // Typed Event Handling (Supports both new and legacy styles)
    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: K extends keyof GameEventPayloads ? GameEventPayloads[K] : unknown,
        context: PactContext
    ): void {
        const ctx = this.createContextWithState(context);
        if (event === 'move') this.onMove?.(payload as GameEventPayloads['move'], ctx);
        if (event === 'capture') this.onCapture?.(payload as GameEventPayloads['capture'], ctx);
        if (event === 'checkmate') this.onCheckmate?.(payload as GameEventPayloads['checkmate'], ctx);
        if (event === 'turn_start') this.onTurnStartHook?.(ctx);
        if (event === 'turn_end') this.onTurnEndHook?.(ctx);
        if (event === 'promotion') this.onPromotion?.(payload as GameEventPayloads['promotion'], ctx);
    }

    // Typed Hooks (Override these for cleaner logic)
    protected onMove?(payload: GameEventPayloads['move'], context: PactContextWithState<T, TSibling>): void;
    protected onCapture?(payload: GameEventPayloads['capture'], context: PactContextWithState<T, TSibling>): void;
    protected onCheckmate?(payload: GameEventPayloads['checkmate'], context: PactContextWithState<T, TSibling>): void;
    protected onPromotion?(payload: GameEventPayloads['promotion'], context: PactContextWithState<T, TSibling>): void;

    // Turn Hooks
    onTurnStart(pactContext: PactContext): void {
        const ctx = this.createContextWithState(pactContext);
        this.onTurnStartHook?.(ctx);
    }

    onTurnEnd(pactContext: PactContext): void {
        const ctx = this.createContextWithState(pactContext);
        this.onTurnEndHook?.(ctx);
    }

    protected onTurnStartHook?(context: PactContextWithState<T, TSibling>): void;
    protected onTurnEndHook?(context: PactContextWithState<T, TSibling>): void;

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
class GenericPact<T = Record<string, unknown>, TSibling = Record<string, unknown>> extends PactLogic<T, TSibling> {
    constructor(
        public readonly id: string,
        public readonly options: PactLogicOptions<T, TSibling>
    ) {
        super();
        this.activeAbility = options.activeAbility;
        this.target = options.target || 'self';
    }

    getInitialState(): T | null {
        return this.options.initialState ? this.options.initialState() : null;
    }

    getRuleModifiers(): RuleModifiers<T, TSibling> {
        const wrapModifier = (fn: ModifierFn): ModifierFn => {
            return (...args: unknown[]) => {
                const context = args[args.length - 1] as PactContext;
                args[args.length - 1] = this.createContextWithState(context);
                return fn(...args);
            };
        };

        const wrapAll = <TState, TSib>(mods: RuleModifiers<TState, TSib>): RuleModifiers<TState, TSib> => {
            const result: Partial<RuleModifiers<TState, TSib>> = {};
            (Object.keys(mods) as Array<keyof RuleModifiers<TState, TSib>>).forEach((key) => {
                const val = mods[key];
                if (typeof val === 'function') {
                    (result as Record<string, ModifierFn>)[key as string] = wrapModifier(val as ModifierFn);
                } else {
                    result[key] = val;
                }
            });
            return result as RuleModifiers<TState, TSib>;
        };

        const base = wrapAll(this.options.modifiers || {});

        // Sort effects by priority (descending: higher priority runs first)
        const sortedEffects = [...(this.options.effects || [])]
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        const effectModifiers = sortedEffects
            .map(e => e.modifiers)
            .filter((m): m is RuleModifiers<T, TSibling> => m !== undefined)
            .map(m => wrapAll(m));

        if (effectModifiers.length === 0) return base;

        // WHY: composeRuleModifiers operates on ModifierFn (erased types) internally.
        // The cast is safe because wrapAll already wrapped all functions in the correct context.
        return composeRuleModifiers([...effectModifiers, base] as any) as RuleModifiers<T, TSibling>;
    }


    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: K extends keyof GameEventPayloads ? GameEventPayloads[K] : unknown,
        context: PactContext
    ): void {
        const ctx = this.createContextWithState(context);

        // New typed hooks
        if (event === 'move' && this.options.onMove) this.options.onMove(payload as GameEventPayloads['move'], ctx);
        if (event === 'capture' && this.options.onCapture) this.options.onCapture(payload as GameEventPayloads['capture'], ctx);
        if (event === 'checkmate' && this.options.onCheckmate) this.options.onCheckmate(payload as GameEventPayloads['checkmate'], ctx);
        if (event === 'promotion' && this.options.onPromotion) this.options.onPromotion(payload as GameEventPayloads['promotion'], ctx);

        // Effects hooks
        if (this.options.effects) {
            for (const effect of this.options.effects) {
                effect.onEvent?.(event, payload as never, ctx);
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
        const counters = this.options.getTurnCounters ? this.options.getTurnCounters(this.createContextWithState(context)) : [];

        // Auto-inject cooldown counter if activeAbility has a cooldown
        if (this.activeAbility?.cooldown) {
            const cd = context.game.abilityCooldowns?.[context.playerId]?.[this.id] || 0;
            if (cd > 0) {
                counters.push({
                    id: `${this.id}_cooldown`,
                    label: `perks.${this.id}.name`,
                    value: cd,
                    pactId: this.id,
                    type: 'cooldown'
                });
            }
        }

        // Auto-inject uses counter if activeAbility has maxUses
        if (this.activeAbility?.maxUses !== undefined) {
            const currentUses = context.game.abilityUses?.[context.playerId]?.[this.id] || 0;
            const remaining = this.activeAbility.maxUses - currentUses;
            if (remaining >= 0) {
                counters.push({
                    id: `${this.id}_uses`,
                    label: `perks.${this.id}.name`,
                    value: remaining,
                    pactId: this.id,
                    type: 'uses'
                });
            }
        }

        return counters;
    }

}


/**
 * Builder for defining pacts declaratively.
 */
export interface PactLogicOptions<T = any, TSibling = any> {
    target?: 'self' | 'enemy' | 'global';
    effects?: PactEffect<T, TSibling>[];
    modifiers?: RuleModifiers<T, TSibling>;
    /**
     * Optional state validation function. 
     * Called whenever updateState is invoked to verify the new state.
     */
    validateState?: (state: T) => boolean;


    onMove?: (payload: GameEventPayloads['move'], context: PactContextWithState<T, TSibling>) => void;
    onCapture?: (payload: GameEventPayloads['capture'], context: PactContextWithState<T, TSibling>) => void;
    onCheckmate?: (payload: GameEventPayloads['checkmate'], context: PactContextWithState<T, TSibling>) => void;
    onPromotion?: (payload: GameEventPayloads['promotion'], context: PactContextWithState<T, TSibling>) => void;
    onTurnStart?: (context: PactContextWithState<T, TSibling>) => void;
    onTurnEnd?: (context: PactContextWithState<T, TSibling>) => void;
    initialState?: () => T;
    activeAbility?: ActiveAbilityConfig<T>;
    getTurnCounters?: (context: PactContextWithState<T, TSibling>) => TurnCounter[];

    // Metadata (SPoD)
    icon?: IconName | string;
    ranking?: number; // 1-5 stars
    category?: string;
    i18nKey?: string; // Optional: can be derived from ID
}

export class PactBuilder<TBonus = Record<string, unknown>, TMalus = Record<string, unknown>> {
    private bonusLogic?: { id: string } & PactLogicOptions<TBonus, TMalus>;
    private malusLogic?: { id: string } & PactLogicOptions<TMalus, TBonus>;

    constructor(private readonly pactId: string) { }

    bonus<T = TBonus>(id: string, options: PactLogicOptions<T, TMalus>): PactBuilder<T, TMalus> {
        this.bonusLogic = { id, ...options } as any;
        return this as any;
    }

    malus<T = TMalus>(id: string, options: PactLogicOptions<T, TBonus>): PactBuilder<TBonus, T> {
        this.malusLogic = { id, ...options } as any;
        return this as any;
    }

    build(): PactDefinition {
        if (!this.bonusLogic || !this.malusLogic) {
            throw new Error(`Pact ${this.pactId} must have both a bonus and a malus defined.`);
        }

        const bonus = new GenericPact<TBonus, TMalus>(this.bonusLogic.id, this.bonusLogic);
        const malus = new GenericPact<TMalus, TBonus>(this.malusLogic.id, this.malusLogic);

        // Links siblings
        bonus.siblingId = malus.id;
        malus.siblingId = bonus.id;

        return {
            id: this.pactId,
            // WHY: PactDefinition uses PactLogic (erased T) to allow heterogeneous pact collections.
            // GenericPact<TBonus/TMalus> is always a valid PactLogic at runtime.
            bonus: bonus as PactLogic,
            malus: malus as PactLogic,
        };
    }
}


// ---------------------------------------------------------------------------
// Modifier Composition
// ---------------------------------------------------------------------------

type ModifierFn = (...args: unknown[]) => unknown;

/**
 * Boolean modifier keys — these use AND-chain semantics.
 * Returning `false` from any one handler blocks the action.
 * Returning `undefined` (not expressed) does not block.
 */
const BOOLEAN_MODIFIERS: ReadonlySet<keyof RuleModifiers> = new Set([
    'canMovePiece', 'canCapture', 'canBeCaptured',
    'canCastleWhileMoved', 'canCastle', 'mustMoveKingInCheck',
    'canDoubleMove', 'canDiagonalDash', 'canSidewaysMove',
    'canMoveThroughFriendlies', 'canMoveLikeKnight', 'hasEcholocation',
    'isImmuneToCheckmate',
] as const satisfies (keyof RuleModifiers)[]);

/**
 * Composes multiple RuleModifiers sources into a single object.
 * - Boolean modifier keys: AND-chain (any `false` result blocks)
 * - Void/array modifier keys: sequential execution (all handlers called)
 *
 * This replaces the previous `Object.assign({}, ...sources)` which silently
 * discarded all but the last handler for duplicate keys.
 */
export function composeRuleModifiers(sources: Partial<RuleModifiers>[]): RuleModifiers {
    const result: Record<string, ModifierFn> = {};
    const allKeys = new Set(sources.flatMap(s => Object.keys(s))) as Set<keyof RuleModifiers>;

    for (const key of allKeys) {
        const fns = sources
            .map(s => (s as Record<keyof RuleModifiers, ModifierFn | undefined>)[key])
            .filter((f): f is ModifierFn => typeof f === 'function');

        if (fns.length === 0) continue;
        if (fns.length === 1) {
            result[key as string] = (...args: unknown[]) => {
                try {
                    const res = fns[0](...args);
                    return res !== undefined ? res : args[0];
                } catch (e) {
                    console.error(`[PactSystem] Error in modifier ${key}:`, e);
                    // Return neutral values on failure
                    if (BOOLEAN_MODIFIERS.has(key)) return true;
                    if (key === 'onModifyMoves') return args[0];
                    return args[0] !== undefined ? args[0] : undefined;
                }
            };
            continue;
        }

        if (BOOLEAN_MODIFIERS.has(key)) {
            // AND-chain: false from any handler blocks; undefined is neutral
            result[key as string] = (...args: unknown[]) => {
                for (const fn of fns) {
                    try {
                        const res = fn(...args);
                        if (res === false) return false;
                    } catch (e) {
                        console.error(`[PactSystem] Error in boolean modifier ${key}:`, e);
                    }
                }
                return true;
            };
        } else if (key === 'onModifyMoves') {
            // Pipeline (Reduce): Each handler processes the result of the previous one
            result[key as string] = (...args: unknown[]) => {
                let current = args[0]; // The Move[] array
                for (const fn of fns) {
                    try {
                        args[0] = current;
                        const next = fn(...args);
                        if (next !== undefined) {
                            current = next;
                        }
                    } catch (e) {
                        console.error(`[PactSystem] Error in onModifyMoves pipeline for ${key}:`, e);
                    }
                }
                return current;
            };
        } else {
            // Sequential: all handlers called, last non-undefined return value propagated
            result[key as string] = (...args: unknown[]) => {
                let last: unknown = undefined;
                for (const fn of fns) {
                    try {
                        const res = fn(...args);
                        if (res !== undefined) {
                            last = res;
                        }
                    } catch (e) {
                        console.error(`[PactSystem] Error in sequential modifier ${key}:`, e);
                    }
                }
                // If everything failed or returned undefined, return the first arg for range/distance modifiers
                // or just the last result.
                return last !== undefined ? last : args[0];
            };
        }
    }

    return result as RuleModifiers;
}

export function definePact<TBonus = Record<string, unknown>, TMalus = Record<string, unknown>>(id: string): PactBuilder<TBonus, TMalus> {
    return new PactBuilder<TBonus, TMalus>(id);
}

export interface TurnCounter {
    id: string;
    label: string; // Internal name or key for translation
    value: number;
    pactId: string; // The pact ID to get the icon from registry
    type: 'cooldown' | 'counter' | 'uses';
    maxValue?: number; // Optional for progress bars
    subLabel?: string; // Optional sub-label (e.g. "turns left")
}
