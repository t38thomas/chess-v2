import { PactEffect, PactContextWithState } from '../PactLogic';
import { GameEvent, GameEventPayloads } from '../../GameTypes';

export interface CounterOptions {
    key: string;
    maxValue: number;
    incrementOn: Array<keyof GameEventPayloads | GameEvent | string>;
    resetOn?: Array<keyof GameEventPayloads | GameEvent | string>;
    onMax: (context: PactContextWithState<any>, payload: any) => void;
    /** Optional filter to restrict which events trigger increment/reset */
    filter?: (event: string, payload: any, context: PactContextWithState<any>) => boolean;
    // Optional callbacks
    onIncrement?: (context: PactContextWithState<any>, value: number) => void;
    onReset?: (context: PactContextWithState<any>) => void;
}

export const StateEffects = {
    /**
     * Creates a generic counter that increments on specific events and resets on others.
     * When it hits maxValue, it triggers onMax and resets to 0.
     */
    counter: (options: CounterOptions): PactEffect => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<any>;
                let currentVal = (ctx.state || {})[options.key] || 0;

                if (options.filter && !options.filter(event, payload, ctx)) return;

                // Check reset first
                if (options.resetOn && options.resetOn.includes(event)) {
                    if (currentVal !== 0) {
                        ctx.updateState({ [options.key]: 0 });
                        options.onReset?.(ctx);
                        currentVal = 0;
                    }
                }

                // Check increment
                if (options.incrementOn.includes(event)) {
                    currentVal += 1;
                    if (currentVal >= options.maxValue) {
                        ctx.updateState({ [options.key]: 0 });
                        options.onMax(ctx, payload);
                    } else {
                        ctx.updateState({ [options.key]: currentVal });
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
    onStreak: (options: Omit<CounterOptions, 'key'> & { key?: string }): PactEffect => {
        return StateEffects.counter({
            ...options,
            key: options.key || 'streak_counter'
        });
    },

    /**
     * Stores data (globally or by a specific recordKey like piece ID) that automatically 
     * expires after a set number of turns.
     * Access the data in other hooks via `ctx.state[options.key][recordKey].data`.
     */
    temporaryState: <TData = any>(options: {
        key: string;
        durationInTurns: number;
        triggerOn: Array<keyof GameEventPayloads | GameEvent | string>;
        extractData: (payload: any, event: string) => { recordKey?: string, data: TData } | null;
        onExpire?: (context: PactContextWithState<any>, recordKey: string, data: TData) => void;
    }): PactEffect => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<any>;
                let currentState = (ctx.state || {})[options.key] || {};
                let changed = false;

                // 1. Cleanup expired
                if (event === 'turn_start') {
                    for (const id in currentState) {
                        if (ctx.game.totalTurns > currentState[id].expiresAtTurn) {
                            options.onExpire?.(ctx, id, currentState[id].data);
                            delete currentState[id];
                            changed = true;
                        }
                    }
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
                    ctx.updateState({ [options.key]: currentState });
                }
            }
        };
    },

    /**
     * Executes the given callback exactly once per match when the trigger condition is met.
     */
    oncePerMatch: (options: {
        key: string;
        triggerOn: Array<keyof GameEventPayloads | GameEvent | string>;
        filter?: (event: string, payload: any, context: PactContextWithState<any>) => boolean;
        onTrigger: (context: PactContextWithState<any>, payload: any) => void;
    }): PactEffect => {
        return {
            onEvent: (event, payload, context) => {
                const ctx = context as PactContextWithState<any>;
                if ((ctx.state || {})[options.key]) return;

                if (options.triggerOn.includes(event)) {
                    if (options.filter && !options.filter(event, payload, ctx)) return;

                    ctx.updateState({ [options.key]: true });
                    options.onTrigger(ctx, payload);
                }
            }
        };
    }
};
