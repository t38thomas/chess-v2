import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Jester Pact
 * Bonus (Chaos): Bishops move like Knights.
 * Malus (Jester): Knights move like Bishops.
 */
export const TheJester = definePact('jester')
    .bonus('chaos', {
        effects: [Effects.movement.swapMovement('bishop', 'knight')]
    })
    .malus('jester', {
        effects: [Effects.movement.swapMovement('knight', 'bishop')]
    })
    .build();
