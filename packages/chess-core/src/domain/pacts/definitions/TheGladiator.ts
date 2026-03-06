import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Gladiator Pact
 * Bonus (Arena): Pieces on dark squares are immune to pawn and minor piece captures.
 * Malus (Disarmed): Start the match without bishops.
 */
export const TheGladiator = definePact('gladiator')
    .bonus('arena', {
        target: 'self',
        effects: [Effects.combat.immuneToPawnAndMinorCapturesOnDarkSquares()]
    })
    .malus('disarmed', {
        target: 'self',
        effects: [Effects.rules.removePiecesAtStart('bishop')]
    })
    .build();

