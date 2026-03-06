import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Golem Pact
 * Bonus (Stone Skin): King is immune to attacks from more than 3 squares away.
 * Malus (Lead Feet): King cannot move diagonally.
 */
export const TheGolem = definePact('golem')
    .bonus('stone_skin', {
        target: 'self',
        effects: [Effects.combat.protectKingAgainstRanged(3)]
    })
    .malus('lead_feet', {
        target: 'self',
        effects: [Effects.movement.disableDiagonal('king')]
    })
    .build();

