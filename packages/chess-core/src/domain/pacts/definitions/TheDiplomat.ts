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
        target: 'self',
        modifiers: {
            canBeCaptured: (params, context) => {
                if (params.victim.type !== 'queen') return true;

                const hasCaptured = (context.state || {})['has_captured'];
                return !!(hasCaptured || params.attacker.type !== 'pawn');
            }
        },
        effects: [
            Effects.state.oncePerMatch({
                key: 'has_captured',
                triggerOn: ['capture'],
                filter: (event, payload, context) => {
                    const move = payload as any;
                    return move && move.piece && move.piece.color === context.playerId && move.piece.type === 'queen';
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
        target: 'self',
        modifiers: {
            canMovePiece: (params, context) => {
                const b = params.board;
                const piece = b.getSquare(params.from)?.piece;
                if (piece?.type === 'knight') {
                    const sharedState = context.getSiblingState<any>() || {};
                    return !!(sharedState['has_captured']);
                }
                return true;
            }
        }
    })
    .build();


