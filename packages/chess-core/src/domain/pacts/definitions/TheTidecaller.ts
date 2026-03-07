import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Tidecaller Pact
 * Bonus (Flow): Pawns can move backward one square (no capture).
 * Malus (Ebb): Pawns cannot capture diagonally.
 */
export const TheTidecaller = definePact('tidecaller')
    .bonus('flow', {
        icon: 'water',
        ranking: 3,
        category: 'Movement',
        effects: [Effects.pawn.backwardMovement({ canCapture: true })]
    })
    .malus('ebb', {
        icon: 'waves',
        ranking: -2,
        category: 'Capture Rules',
        effects: [Effects.combat.restrictDiagonalCapture('pawn')]
    })
    .build();

