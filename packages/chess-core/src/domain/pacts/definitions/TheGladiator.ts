import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Gladiator Pact
 * Bonus (Arena): Pieces on dark squares are immune to pawn captures.
 * Malus (Disarmed): Start the match without bishops.
 */
export const TheGladiator = definePact('gladiator')
    .bonus('arena', {
        effects: [Effects.combat.immuneToPawnCapturesOnDarkSquares()]
    })
    .malus('disarmed', {
        effects: [Effects.rules.removePiecesAtStart('bishop')]
    })
    .build();

