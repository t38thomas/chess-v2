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
    // Add other event types as needed
}

export interface PactDefinition {
    id: string; // The UI/Meta ID for the pact (e.g. 'berserker')
    bonus: PactLogic;
    malus: PactLogic;
}

export interface ActiveAbilityConfig {
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
    execute: (context: PactContext, params: any) => boolean;
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

export interface RuleModifiers {
    // Movement Hooks
    onGetPseudoMoves?: (params: MoveParams) => void;

    // Movement overrides
    getMaxRange?: (piece: Piece) => number;
    getFixedDistances?: (piece: Piece) => number[] | null;
    canDoubleMove?: (piece: Piece, y: number, startY: number) => boolean;
    canDiagonalDash?: (piece: Piece) => boolean;
    canSidewaysMove?: (piece: Piece) => boolean;
    canMoveThroughFriendlies?: (mover: Piece, obstacle: Piece) => boolean;
    canMoveLikeKnight?: (pieceType: PieceType) => boolean;
    hasEcholocation?: (piece: Piece) => boolean;
    canMovePiece?: (game: IChessGame, from: Coordinate, board?: BoardModel) => boolean;

    // Promotion overrides
    getAllowedPromotionTypes?: (piece: Piece) => PieceType[];

    // Capture overrides
    canCapture?: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board?: BoardModel) => boolean;

    // King Safety
    canCastleWhileMoved?: (piece: Piece) => boolean;
    canCastle?: (piece: Piece) => boolean;
    mustMoveKingInCheck?: (color: PieceColor) => boolean;

    // Turn Economy & Special Rules
    modifyNextTurn?: (game: IChessGame, currentTurn: PieceColor, eventType: GameEvent) => PieceColor | null;
    onExecuteMove?: (game: IChessGame, move: Move) => void;

    // Attack/Defense modifiers
    canBeCaptured?: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate, board?: BoardModel) => boolean;
    isImmuneToCheckmate?: (game: IChessGame) => boolean;
}

export abstract class PactLogic<T = any> {
    abstract id: string;

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
            game.pactState[key] = this.getInitialState();
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

    // Hooks primarily for RuleEngine integration
    getRuleModifiers(): RuleModifiers {
        return {};
    }

    // Typed Event Handling (Supports both new and legacy styles)
    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: any,
        context: PactContext
    ): void { }



    // Turn Hooks
    onTurnStart(pactContext: PactContext): void { }
    onTurnEnd(pactContext: PactContext): void { }

    // Ability configuration
    readonly activeAbility?: ActiveAbilityConfig;



    // UI Helpers
    getTurnCounters(context: PactContext): TurnCounter[] {
        return [];
    }
}

/**
 * A concrete implementation of PactLogic that accepts functions to define its behavior.
 */
class GenericPact<T = any> extends PactLogic<T> {
    readonly activeAbility?: ActiveAbilityConfig;

    constructor(
        public readonly id: string,
        private readonly modifiers?: RuleModifiers,
        private readonly eventHandler?: <K extends keyof GameEventPayloads>(event: K | GameEvent | string, payload: any, context: PactContext) => void,
        private readonly turnStart?: (context: PactContext) => void,
        private readonly turnEnd?: (context: PactContext) => void,
        private readonly initialState?: () => T,
        activeAbility?: ActiveAbilityConfig,
        private readonly turnCounters?: (context: PactContext) => TurnCounter[]
    ) {
        super();
        this.activeAbility = activeAbility;
    }

    getInitialState(): T | null {
        return this.initialState ? this.initialState() : null;
    }

    getRuleModifiers(): RuleModifiers {
        return this.modifiers || {};
    }

    onEvent<K extends keyof GameEventPayloads>(
        event: K | GameEvent | string,
        payload: any,
        context: PactContext
    ): void {
        if (this.eventHandler) {
            this.eventHandler(event as any, payload, context);
        }
    }

    onTurnStart(context: PactContext): void {
        if (this.turnStart) {
            this.turnStart(context);
        }
    }

    onTurnEnd(context: PactContext): void {
        if (this.turnEnd) {
            this.turnEnd(context);
        }
    }

    getTurnCounters(context: PactContext): TurnCounter[] {
        return this.turnCounters ? this.turnCounters(context) : [];
    }
}


/**
 * Builder for defining pacts declaratively.
 */
export interface PactLogicOptions<T = any> {
    effects?: PactEffect[];
    modifiers?: RuleModifiers;
    onEvent?: <K extends keyof GameEventPayloads>(event: K | GameEvent | string, payload: any, context: PactContext) => void;
    onTurnStart?: (context: PactContext) => void;
    onTurnEnd?: (context: PactContext) => void;
    initialState?: () => T;
    activeAbility?: ActiveAbilityConfig;
    getTurnCounters?: (context: PactContext) => TurnCounter[];
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

    private createGenericPact(logic: { id: string } & PactLogicOptions<any>): GenericPact {
        const modifiers: RuleModifiers = { ...(logic.modifiers || {}) };
        const eventHandlers: Array<PactLogicOptions['onEvent']> = [];
        if (logic.onEvent) eventHandlers.push(logic.onEvent as any);

        if (logic.effects) {
            for (const effect of logic.effects) {
                if (effect.modifiers) {
                    Object.assign(modifiers, effect.modifiers);
                }
                if (effect.onEvent) {
                    eventHandlers.push(effect.onEvent as any);
                }
            }
        }

        const compositeEventHandler = eventHandlers.length > 0
            ? (event: any, payload: any, context: PactContext) => {
                for (const handler of eventHandlers) {
                    handler?.(event, payload, context);
                }
            }
            : undefined;

        return new GenericPact(
            logic.id,
            modifiers,
            compositeEventHandler as any,
            logic.onTurnStart,
            logic.onTurnEnd,
            logic.initialState,
            logic.activeAbility,
            logic.getTurnCounters
        );
    }

    build(): PactDefinition {
        if (!this.bonusLogic || !this.malusLogic) {
            throw new Error(`Pact ${this.pactId} must have both a bonus and a malus defined.`);
        }

        return {
            id: this.pactId,
            bonus: this.createGenericPact(this.bonusLogic),
            malus: this.createGenericPact(this.malusLogic),
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

