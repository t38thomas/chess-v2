import { PactEffect } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { PieceType } from '../../models/Piece';

export const CombatEffects = {
    /**
     * Makes pieces on dark squares immune to pawn captures.
     */
    immuneToPawnCapturesOnDarkSquares: (): PactEffect => ({
        modifiers: {
            canBeCaptured: (game, attacker, victim, to) => {
                return !(PactUtils.isBlackSquare(to) && attacker.type === 'pawn');
            }
        }
    }),

    /**
     * Restricts the types of pieces a pawn can promote to.
     */
    restrictPromotion: (allowedTypes: PieceType[] = []): PactEffect => ({
        modifiers: {
            getAllowedPromotionTypes: () => allowedTypes
        }
    }),

    /**
     * Prevents a piece from capturing diagonally.
     */
    restrictDiagonalCapture: (attackerType: PieceType): PactEffect => ({
        modifiers: {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type !== attackerType) return true;
                const dx = Math.abs(to.x - from.x);
                const dy = Math.abs(to.y - from.y);
                return !(dx > 0 && dy > 0);
            }
        }
    }),

    /**
     * Restricts a piece from capturing pieces that are adjacent (king-range).
     */
    restrictAdjacentCapture: (attackerType: PieceType): PactEffect => ({
        modifiers: {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type === attackerType) {
                    const dx = Math.abs(to.x - from.x);
                    const dy = Math.abs(to.y - from.y);
                    if (dx <= 1 && dy <= 1) return false;
                }
                return true;
            }
        }
    }),

    /**
     * Protects the King against captures from more than N squares away.
     */
    protectKingAgainstRanged: (maxRange: number): PactEffect => ({
        modifiers: {
            canBeCaptured: (game, attacker, victim, to, from) => {
                if (victim.type !== 'king') return true;
                return from.distanceTo(to) <= maxRange;
            }
        }
    }),

    /**
     * Instantly ends the match in defeat if a specific piece type is captured.
     */
    loseOnPieceCapture: (pieceType: PieceType, notificationId: string = 'fatality', sound: string = 'skull', pactIdOverride?: string): PactEffect => ({
        onEvent: (event, payload, context) => {
            const move = payload as any;
            const isCapture = event === 'capture' || (move && move.capturedPiece);
            if (isCapture && move) {
                const { game, playerId } = context;
                const capturedPiece = move.capturedPiece;
                if (capturedPiece?.type === pieceType && capturedPiece.color === playerId) {
                    game.status = 'checkmate';
                    PactUtils.notifyPactEffect(game, pactIdOverride || context.pactId, notificationId, 'malus', sound);
                }
            }
        }
    })
};
