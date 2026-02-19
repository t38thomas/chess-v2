import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Golem Pact
 * Bonus (Stone Skin): King is immune to attacks from more than 3 squares away.
 * Malus (Lead Feet): King cannot move diagonally.
 */
export const TheGolem = definePact('golem')
    .bonus('stone_skin', {
        effects: [Effects.combat.protectKingAgainstRanged(3)]
    })
    .malus('lead_feet', {
        effects: [Effects.movement.disableDiagonal('king')]
    })
    .build();

