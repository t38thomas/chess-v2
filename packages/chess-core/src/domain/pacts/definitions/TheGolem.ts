import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Golem Pact
 * Bonus (Stone Skin): King is immune to attacks from more than 3 squares away. 
 *                    Every 3 King moves, grant an extra turn. UI counter tracks progress.
 * Malus (Lead Feet): King cannot move diagonally.
 */
export const TheGolem = definePact('golem')
    .bonus('stone_skin', {
        target: 'self',
        effects: [
            Effects.combat.protectKingAgainstRanged(3),
            Effects.state.onStreak({
                key: 'king_moves',
                maxValue: 3,
                incrementOn: ['move'],
                filter: (event, payload, context) => {
                    const move = payload as any;
                    return move.piece.type === 'king' && move.piece.color === context.playerId;
                },
                onMax: (context) => {
                    context.game.grantExtraTurn!(context.playerId, 1);
                    PactUtils.notifyPactEffect(context.game, 'golem', 'extra_turn', 'bonus', 'run');
                }
            })
        ],
        getTurnCounters: (context) => {
            const val = (context.state['king_moves'] as number) || 0;
            return [{
                id: 'golem_king_moves',
                label: 'king_moves_streak',
                value: val,
                pactId: 'golem',
                type: 'counter',
                maxValue: 3,
                subLabel: `${val}/3`
            }];
        }
    })
    .malus('lead_feet', {
        target: 'self',
        effects: [Effects.movement.disableDiagonal('king')]
    })
    .build();

