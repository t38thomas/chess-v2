import { PactEffect, CaptureContext, MoveContext } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { PactUtils } from '../PactUtils';

export const RulesEffects = {
    /**
     * Restricts the types of pieces a pawn can promote to.
     */
    restrictPromotion: (allowedTypes: PieceType[] | ((p: Piece) => PieceType[])): PactEffect => ({
        modifiers: {
            getAllowedPromotionTypes: (piece) => typeof allowedTypes === 'function' ? allowedTypes(piece) : allowedTypes
        }
    }),

    /**
     * Disables castling for all pieces.
     */
    disableCastling: (): PactEffect => ({
        modifiers: {
            canCastle: () => false
        }
    }),

    /**
     * Removes all pieces of a specific type for the player at the start of the match.
     */
    removePiecesAtStart: (type: PieceType): PactEffect => ({
        onEvent: (event, payload, context) => {
            if (event === 'pact_assigned') {
                const pieces = PactUtils.findPieces(context.game, context.playerId, type);
                for (const { coord } of pieces) {
                    PactUtils.removePiece(context.game, coord);
                }
            }
        }
    }),

    /**
     * Removes a specified number of random pieces of a specific type at the start of the match.
     */
    removeRandomPiecesAtStart: (type: PieceType, count: number = 1): PactEffect => ({
        onEvent: (event, payload, context) => {
            if (event === 'pact_assigned') {
                const pieces = PactUtils.findPieces(context.game, context.playerId, type);
                const victims = PactUtils.pickRandom(pieces, Math.min(pieces.length, count), context.game.rng);
                for (const { coord } of victims) {
                    PactUtils.removePiece(context.game, coord);
                }
            }
        }
    }),

    /**
     * Allows a mover to pass through an obstacle if both filters match.
     */
    canMoveThrough: (
        moverFilter: (mover: Piece) => boolean,
        obstacleFilter: (obstacle: Piece) => boolean
    ): PactEffect => ({
        modifiers: {
            canMoveThroughFriendlies: (mover, obstacle) => {
                return moverFilter(mover) && obstacleFilter(obstacle);
            }
        }
    }),

    /**
     * Prevents capture of pieces that match a condition.
     */
    preventCapture: (condition: (params: CaptureContext) => boolean): PactEffect => ({
        modifiers: {
            canBeCaptured: (params) => !condition(params)
        }
    }),

    /**
     * Restricts movement based on a condition.
     */
    restrictMovement: (condition: (params: MoveContext) => boolean): PactEffect => ({
        modifiers: {
            canMovePiece: (params) => !condition(params)
        }
    })
};
