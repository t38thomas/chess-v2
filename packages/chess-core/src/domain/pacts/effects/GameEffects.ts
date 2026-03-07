import { IconName } from '../../models/Icon';
import { PactEffect } from '../PactLogic';
import { PactUtils } from '../PactUtils';

export const GameEffects = {
    /**
     * Stuns a piece for a number of turns.
     */
    stunPiece: (pieceId: string, turns: number = 2): PactEffect => ({
        onEvent: (event, payload, context) => {
            PactUtils.stunPiece(context.game, pieceId, turns);
        }
    }),

    /**
     * Grants extra turns to a player.
     */
    grantExtraTurn: (count: number = 1): PactEffect => ({
        onEvent: (event, payload, context) => {
            PactUtils.grantExtraTurn(context.game, context.playerId, count);
        }
    }),

    /**
     * Emits a visual pact effect notification.
     */
    notify: (eventKey: string, type: 'bonus' | 'malus', icon: IconName): PactEffect => ({
        onEvent: (event, payload, context) => {
            PactUtils.notifyPactEffect(context.game, context.pactId, eventKey, type, icon);
        }
    }),

    /**
     * Lifecycle trigger: on turn start.
     */
    onTurnStart: <T>(action: (context: any) => void): PactEffect<T> => ({
        onEvent: (event, payload, context) => {
            if (event === 'turn_start') action(context);
        }
    }),

    /**
     * Lifecycle trigger: on capture.
     */
    onCapture: <T>(action: (payload: any, context: any) => void): PactEffect<T> => ({
        onEvent: (event, payload, context) => {
            if (event === 'capture') action(payload, context);
        }
    })
};
