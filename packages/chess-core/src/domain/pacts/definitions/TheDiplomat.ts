import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { Effects } from '../PactEffects';
import { Move } from '../../models/Move';

/**
 * The Diplomat Pact
 * Bonus (Diplomatic Immunity): The Queen cannot be captured by pawns until she crosses the midfield line.
 * Malus (Internal Sabotage): Knights are blocked until the Queen crosses the midfield line.
 */
interface DiplomatBonusState {
    has_crossed_midfield?: boolean;
}

export const TheDiplomat = definePact<DiplomatBonusState, {}>('diplomat')
    .bonus('diplomatic_immunity', {
        icon: 'passport',
        ranking: 5,
        category: 'King Safety',
        target: 'self',
        modifiers: {
            canBeCaptured: (params, context) => {
                if (params.victim.type !== 'queen') return true;

                const hasCrossed = (context.state || {})['has_crossed_midfield'];
                return !!(hasCrossed || params.attacker.type !== 'pawn');
            }
        },
        effects: [
            Effects.state.oncePerMatch({
                key: 'has_crossed_midfield',
                triggerOn: ['move'],
                filter: (event, payload, context) => {
                    const move = payload as Move;
                    if (!move || move.piece.type !== 'queen' || move.piece.color !== context.playerId) return false;

                    const y = move.to.y;
                    return context.playerId === 'white' ? y >= 4 : y <= 3;
                },
                onTrigger: (context) => {
                    PactUtils.notifyPactEffect(context.game, 'diplomat', 'immunity_lost', 'malus', 'shield-off');
                    PactUtils.notifyPactEffect(context.game, 'diplomat', 'sabotage_ended', 'bonus', 'horse-variant');
                }
            })
        ],
        getTurnCounters: (context) => {
            const hasCrossed = (context.state || {})['has_crossed_midfield'];
            return [{
                id: 'diplomatic_immunity_status',
                label: hasCrossed ? 'queen_crossed' : 'queen_protected',
                value: hasCrossed ? 0 : 1,
                pactId: 'diplomat',
                type: 'counter',
                subLabel: hasCrossed ? 'Active' : 'Protected'
            }];
        }
    })
    .malus('internal_sabotage', {
        icon: 'bomb',
        ranking: -4,
        category: 'Movement',
        target: 'self',
        modifiers: {
            canMovePiece: (params, context) => {
                const b = params.board;
                const piece = b.getSquare(params.from)?.piece;
                if (piece?.type === 'knight') {
                    const sharedState = context.getSiblingState() || {};
                    return !!(sharedState.has_crossed_midfield);
                }
                return true;
            }
        }
    })
    .build();


