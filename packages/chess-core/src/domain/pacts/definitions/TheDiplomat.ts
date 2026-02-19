import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

const HAS_CAPTURED_KEY = (playerId: string) => `diplomat_has_captured_${playerId}`;

/**
 * The Diplomat Pact
 * Bonus (Diplomatic Immunity): The Queen cannot be captured by pawns until she captures something.
 * Malus (Internal Sabotage): Knights are blocked until the Queen captures something.
 */
export const TheDiplomat = definePact('diplomat')
    .bonus('diplomatic_immunity', {
        modifiers: {
            canBeCaptured: (game, attacker, victim) => {
                if (!game || !PactUtils.isQueen(victim)) return true;
                const hasCaptured = game.pactState[HAS_CAPTURED_KEY(victim.color)];
                return !!(hasCaptured || !PactUtils.isPawn(attacker));
            }
        },
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            const move = payload as any;
            const isCapture = event === 'capture' || (move && move.capturedPiece);

            if (isCapture && move) {
                if (move.piece && move.piece.color === playerId && PactUtils.isQueen(move.piece)) {
                    if (!game.pactState[HAS_CAPTURED_KEY(playerId)]) {
                        game.pactState[HAS_CAPTURED_KEY(playerId)] = true;
                        PactUtils.notifyPactEffect(game, 'diplomat', 'immunity_lost', 'malus', 'shield-off');
                        PactUtils.notifyPactEffect(game, 'diplomat', 'sabotage_ended', 'bonus', 'horse-variant');
                    }
                }
            }
        },
        getTurnCounters: (context) => {
            const hasCaptured = context.game.pactState[HAS_CAPTURED_KEY(context.playerId)];
            return [{
                id: 'diplomatic_immunity_status',
                label: hasCaptured ? 'queen_successor' : 'queen_initial',
                value: hasCaptured ? 0 : 1,
                pactId: 'diplomatic_immunity',
                type: 'counter',
                subLabel: hasCaptured ? 'Active' : 'Protected'
            }];
        }
    })
    .malus('internal_sabotage', {
        modifiers: {
            canMovePiece: (game, from, board) => {
                const b = board || game.board;
                const piece = b.getSquare(from)?.piece;
                if (piece && PactUtils.isKnight(piece)) {
                    return !!game.pactState[HAS_CAPTURED_KEY(piece.color)];
                }
                return true;
            }
        }
    })
    .build();

