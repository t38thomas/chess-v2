import { definePact } from '../PactLogic';

/**
 * The Blind Seer Pact
 * Bonus (Echolocation): Sliding pieces can see through other pieces.
 * Malus (Darkness): All pieces have a maximum move/view range of 3 squares.
 */
export const TheBlindSeer = definePact('blind_seer')
    .bonus('echolocation', {
        modifiers: {
            hasEcholocation: (piece) => ['rook', 'bishop', 'queen'].includes(piece.type)
        }
    })
    .malus('darkness', {
        modifiers: {
            getMaxRange: () => 3
        }
    })
    .build();

