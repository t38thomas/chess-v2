import { definePact } from '../PactLogic';

/**
 * The Saboteur Pact
 * Bonus (Diagonal Dash): Pawns can move diagonally (without capture).
 * Malus (Cut Supplies): Cannot promote to Queen.
 */
export const TheSaboteur = definePact('saboteur')
    .bonus('diagonal_dash', {
        modifiers: {
            canDiagonalDash: (piece) => piece.type === 'pawn'
        }
    })
    .malus('cut_supplies', {
        modifiers: {
            getAllowedPromotionTypes: () => ['rook', 'bishop', 'knight']
        }
    })
    .build();

