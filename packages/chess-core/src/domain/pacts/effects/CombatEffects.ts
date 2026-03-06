import { PactEffect } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { PieceType } from '../../models/Piece';
import { Move } from '../../models/Move';

export const CombatEffects = {
    /**
     * Makes pieces on dark squares immune to pawn captures.
     */
    immuneToPawnCapturesOnDarkSquares: (): PactEffect => ({
        modifiers: {
            canBeCaptured: (params) => {
                return !(PactUtils.isBlackSquare(params.to) && params.attacker.type === 'pawn');
            }
        }
    }),

    /**
     * Makes pieces on dark squares immune to captures from pawns and minor pieces (knights, bishops).
     */
    immuneToPawnAndMinorCapturesOnDarkSquares: (): PactEffect => ({
        modifiers: {
            canBeCaptured: (params) => {
                if (!PactUtils.isBlackSquare(params.to)) return true;
                const type = params.attacker.type;
                return !(type === 'pawn' || type === 'knight' || type === 'bishop');
            }
        }
    }),

    /**
     * Prevents a piece from capturing diagonally.
     */
    restrictDiagonalCapture: (attackerType: PieceType): PactEffect => ({
        modifiers: {
            canCapture: (params) => {
                if (params.attacker.type !== attackerType) return true;
                const dx = Math.abs(params.to.x - params.from.x);
                const dy = Math.abs(params.to.y - params.from.y);
                return !(dx > 0 && dy > 0);
            }
        }
    }),

    /**
     * Restricts a piece from capturing pieces that are adjacent (king-range).
     */
    restrictAdjacentCapture: (attackerType: PieceType): PactEffect => ({
        modifiers: {
            canCapture: (params) => {
                if (params.attacker.type === attackerType) {
                    const dx = Math.abs(params.to.x - params.from.x);
                    const dy = Math.abs(params.to.y - params.from.y);
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
            canBeCaptured: (params) => {
                if (params.victim.type !== 'king') return true;
                return params.from.distanceTo(params.to) <= maxRange;
            }
        }
    }),

    /**
     * Instantly ends the match in defeat if a specific piece type is captured.
     */
    loseOnPieceCapture: (pieceType: PieceType, notificationId: string = 'fatality', sound: string = 'skull', pactIdOverride?: string): PactEffect => ({
        onEvent: (event, payload, context) => {
            const move = payload as Move;
            const isCapture = event === 'capture' || (move && move.capturedPiece);
            if (isCapture && move) {
                const { game, playerId } = context;
                const capturedPiece = move.capturedPiece;
                if (capturedPiece?.type === pieceType && capturedPiece.color === playerId) {
                    const winner: import('../../models/Piece').PieceColor = playerId === 'white' ? 'black' : 'white';
                    // End match through domain command
                    game.endMatch!(winner, 'checkmate');
                    PactUtils.notifyPactEffect(game, pactIdOverride || context.pactId, notificationId, 'malus', sound);
                }
            }
        }
    }),

    /**
     * Restricts a piece from capturing certain targets based on a predicate.
     */
    restrictCaptureTarget: (attackerType: PieceType, filter: (params: import('../PactLogic').CaptureContext) => boolean): PactEffect => ({
        modifiers: {
            canCapture: (params) => {
                if (params.attacker.type === attackerType) {
                    return filter(params);
                }
                return true;
            }
        }
    })
};

