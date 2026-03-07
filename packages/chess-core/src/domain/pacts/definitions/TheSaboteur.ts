import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Saboteur Pact
 * Bonus (Diagonal Dash): Pawns can move and capture diagonally.
 * Malus (Cut Supplies): Cannot promote to Queen.
 */
export const TheSaboteur = definePact<{}, {}>('saboteur')
    .bonus('diagonal_dash', {
        icon: 'arrow-top-right',
        ranking: 3,
        category: 'Movement',
        effects: [Effects.pawn.canDiagonalDash()]
    })
    .malus('cut_supplies', {
        icon: 'package-variant-closed-minus',
        ranking: -3,
        category: 'Promotion',
        effects: [Effects.rules.restrictPromotion(['rook', 'bishop', 'knight'])]
    })
    .build();

