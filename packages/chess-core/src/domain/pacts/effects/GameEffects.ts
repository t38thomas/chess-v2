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
    notify: (eventKey: string, type: 'bonus' | 'malus', icon: string): PactEffect => ({
        onEvent: (event, payload, context) => {
            PactUtils.notifyPactEffect(context.game, context.pactId, eventKey, type, icon);
        }
    })
};
