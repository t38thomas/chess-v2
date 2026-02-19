import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Tidecaller Pact
 * Bonus (Flow): Pawns can move backward one square (no capture).
 * Malus (Ebb): Pawns cannot capture diagonally.
 */
export const TheTidecaller = definePact('tidecaller')
    .bonus('flow', {
        effects: [Effects.pawn.backwardMovement()]
    })
    .malus('ebb', {
        effects: [Effects.combat.restrictDiagonalCapture('pawn')]
    })
    .build();

