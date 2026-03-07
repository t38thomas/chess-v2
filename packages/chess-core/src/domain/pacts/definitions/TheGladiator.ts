import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Gladiator Pact
 * Bonus (Arena): Pieces on dark squares are immune to pawn and minor piece captures.
 * Malus (Disarmed): Start the match without bishops.
 */
export const TheGladiator = definePact<Record<string, unknown>>('gladiator')
    .bonus('arena', {
        icon: 'stadium',
        ranking: 3,
        category: 'King Safety',
        target: 'self',
        effects: [Effects.combat.immuneToPawnAndMinorCapturesOnDarkSquares()]
    })
    .malus('disarmed', {
        icon: 'sword-cross',
        ranking: -2,
        category: 'Board Transform',
        target: 'self',
        effects: [Effects.rules.removePiecesAtStart('bishop')]
    })
    .build();

