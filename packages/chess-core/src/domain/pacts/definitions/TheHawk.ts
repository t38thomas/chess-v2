import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Hawk Pact
 * Bonus (High Flyer): Bishops can jump over friendly pieces.
 * Malus (Distant Predator): Bishops cannot capture adjacent pieces.
 */
export const TheHawk = definePact('hawk')
    .bonus('high_flyer', {
        target: 'self',
        effects: [Effects.movement.canMoveThroughFriendlies('bishop')]
    })
    .malus('distant_predator', {
        target: 'self',
        effects: [Effects.combat.restrictAdjacentCapture('bishop')]
    })
    .build();

