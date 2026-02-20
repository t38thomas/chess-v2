import { PactEffect } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { Coordinate } from '../../models/Coordinate';

export const BoardEffects = {
    /**
     * Swaps two pieces on the board.
     */
    swap: (from: Coordinate, to: Coordinate): PactEffect => ({
        onEvent: (event, payload, context) => {
            // This is an imperative effect that triggers on a specific event
            // Usually used in active abilities
            PactUtils.swapPieces(context.game, from, to);
        }
    }),

    /**
     * Pushes a piece in a specified direction.
     */
    push: (target: Coordinate, dx: number, dy: number): PactEffect => ({
        onEvent: (event, payload, context) => {
            PactUtils.pushPiece(context.game, target, dx, dy);
        }
    })
};
