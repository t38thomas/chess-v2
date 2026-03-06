import { PactEffect, PactContextWithState } from '../PactLogic';
import { GameEvent, GameEventPayloads } from '../../GameTypes';

/** Minimal state shape required by StateEffects: a plain record of primitive/object values. */
type StateRecord = Record<string, unknown>;

export interface CounterOptions<T extends StateRecord = StateRecord> {
    key: string;
    maxValue: number;
    incrementOn: Array<keyof GameEventPayloads | GameEvent | string>;
    resetOn?: Array<keyof GameEventPayloads | GameEvent | string>;
    onMax: (context: PactContextWithState<T>, payload: unknown) => void;
    /** Optional filter to restrict which events trigger increment/reset */
    filter?: (event: string, payload: unknown, context: PactContextWithState<T>) => boolean;
    // Optional callbacks
    onIncrement?: (context: PactContextWithState<T>, value: number) => void;
    onReset?: (context: PactContextWithState<T>) => void;
}

export const StateEffects = {
    /**
     * Creates a generic counter that increments on specific events and resets on others.
     * When it hits maxValue, it triggers onMax and resets to 0.
     */
    counter: <T extends StateRecord = StateRecord>(options: CounterOptions<T>): PactEffect<T> => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<T>;
                let currentVal = ((ctx.state as StateRecord)[options.key] as number | undefined) ?? 0;

                if (options.filter && !options.filter(event, payload, ctx)) return;

                // Check reset first
                if (options.resetOn && options.resetOn.includes(event)) {
                    if (currentVal !== 0) {
                        ctx.updateState({ [options.key]: 0 } as Partial<T>);
                        options.onReset?.(ctx);
                        currentVal = 0;
                    }
                }

                // Check increment
                if (options.incrementOn.includes(event)) {
                    currentVal += 1;
                    if (currentVal >= options.maxValue) {
                        ctx.updateState({ [options.key]: 0 } as Partial<T>);
                        options.onMax(ctx, payload);
                    } else {
                        ctx.updateState({ [options.key]: currentVal } as Partial<T>);
                        options.onIncrement?.(ctx, currentVal);
                    }
                }
            }
        };
    },

    /**
     * Creates a streak counter. Typically used when you want something to happen after N turns
     * without breaking the streak (e.g. going 5 turns without capturing).
     */
    onStreak: <T extends StateRecord = StateRecord>(options: Omit<CounterOptions<T>, 'key'> & { key?: string }): PactEffect<T> => {
        return StateEffects.counter<T>({
            ...options,
            key: options.key || 'streak_counter'
        });
    },

    /**
     * Stores data (globally or by a specific recordKey like piece ID) that automatically 
     * expires after a set number of turns.
     * Access the data in other hooks via `ctx.state[options.key][recordKey].data`.
     */
    temporaryState: <TData = unknown, T extends StateRecord = StateRecord>(options: {
        key: string;
        durationInTurns: number;
        triggerOn: Array<keyof GameEventPayloads | GameEvent | string>;
        extractData: (payload: unknown, event: string) => { recordKey?: string, data: TData } | null;
        onExpire?: (context: PactContextWithState<T>, recordKey: string, data: TData) => void;
    }): PactEffect<T> => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<T>;
                type ExpiringRecord = Record<string, { data: TData; expiresAtTurn: number }>;
                let currentState = ((ctx.state as StateRecord)[options.key] ?? {}) as ExpiringRecord;
                let changed = false;

                // 1. Cleanup expired
                if (event === 'turn_start') {
                    const updated = { ...currentState };
                    for (const id in updated) {
                        if (ctx.game.totalTurns > updated[id].expiresAtTurn) {
                            options.onExpire?.(ctx, id, updated[id].data);
                            delete updated[id];
                            changed = true;
                        }
                    }
                    if (changed) currentState = updated;
                }

                // 2. Add new data if triggered
                if (options.triggerOn.includes(event)) {
                    const extracted = options.extractData(payload, event);
                    if (extracted) {
                        const recKey = extracted.recordKey || 'global';
                        // Copy state to avoid direct mutation
                        if (!changed) currentState = { ...currentState };
                        currentState[recKey] = {
                            data: extracted.data,
                            expiresAtTurn: ctx.game.totalTurns + options.durationInTurns
                        };
                        changed = true;
                    }
                }

                if (changed) {
                    ctx.updateState({ [options.key]: currentState } as Partial<T>);
                }
            }
        };
    },

    /**
     * Executes the given callback exactly once per match when the trigger condition is met.
     */
    oncePerMatch: <T extends StateRecord = StateRecord>(options: {
        key: string;
        triggerOn: Array<keyof GameEventPayloads | GameEvent | string>;
        filter?: (event: string, payload: unknown, context: PactContextWithState<T>) => boolean;
        onTrigger: (context: PactContextWithState<T>, payload: unknown) => void;
    }): PactEffect<T> => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<T>;
                if (((ctx.state as StateRecord)[options.key])) return;

                if (options.triggerOn.includes(event)) {
                    if (options.filter && !options.filter(event, payload, ctx)) return;

                    ctx.updateState({ [options.key]: true } as Partial<T>);
                    options.onTrigger(ctx, payload);
                }
            }
        };
    }
};
