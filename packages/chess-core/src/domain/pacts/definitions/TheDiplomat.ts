import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { Effects } from '../PactEffects';

/**
 * The Diplomat Pact
 * Bonus (Diplomatic Immunity): The Queen cannot be captured by pawns until she captures something.
 * Malus (Internal Sabotage): Knights are blocked until the Queen captures something.
 */
export const TheDiplomat = definePact('diplomat')
    .bonus('diplomatic_immunity', {
        modifiers: {
            canBeCaptured: (game, attacker, victim, to, from, board, context) => {
                if (!game || !PactUtils.isQueen(victim)) return true;
                if (context && victim.color !== context.playerId) return true;

                const hasCaptured = (context?.state || {})['has_captured'];
                return !!(hasCaptured || !PactUtils.isPawn(attacker));
            }
        },
        effects: [
            Effects.state.oncePerMatch({
                key: 'has_captured',
                triggerOn: ['capture'],
                filter: (event, payload, context) => {
                    const move = payload as any;
                    return move && move.piece && move.piece.color === context.playerId && PactUtils.isQueen(move.piece);
                },
                onTrigger: (context) => {
                    PactUtils.notifyPactEffect(context.game, 'diplomat', 'immunity_lost', 'malus', 'shield-off');
                    PactUtils.notifyPactEffect(context.game, 'diplomat', 'sabotage_ended', 'bonus', 'horse-variant');
                }
            })
        ],
        getTurnCounters: (context) => {
            const hasCaptured = (context.state || {})['has_captured'];
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
            canMovePiece: (game, from, board, context) => {
                const b = board || game.board;
                const piece = b.getSquare(from)?.piece;
                if (piece && PactUtils.isKnight(piece)) {
                    if (context && piece.color !== context.playerId) return true;
                    const sharedState = game.pactState[`diplomatic_immunity_${piece.color}`] || {};
                    return !!(sharedState['has_captured']);
                }
                return true;
            }
        }
    })
    .build();

