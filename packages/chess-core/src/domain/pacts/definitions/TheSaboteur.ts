import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Saboteur Pact
 * Bonus (Diagonal Dash): Pawns can move and capture diagonally.
 * Malus (Cut Supplies): Cannot promote to Queen.
 */
export const TheSaboteur = definePact('saboteur')
    .bonus('diagonal_dash', {
        effects: [Effects.pawn.canDiagonalDash()]
    })
    .malus('cut_supplies', {
        effects: [Effects.rules.restrictPromotion(['rook', 'bishop', 'knight'])]
    })
    .build();

