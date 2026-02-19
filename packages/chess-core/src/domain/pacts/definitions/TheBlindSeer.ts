import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Blind Seer Pact
 * Bonus (Echolocation): Sliding pieces can see through other pieces.
 * Malus (Darkness): All pieces have a maximum move/view range of 3 squares.
 */
export const TheBlindSeer = definePact('blind_seer')
    .bonus('echolocation', {
        effects: [Effects.movement.hasEcholocation()]
    })
    .malus('darkness', {
        effects: [Effects.movement.maxRange(3)]
    })
    .build();

