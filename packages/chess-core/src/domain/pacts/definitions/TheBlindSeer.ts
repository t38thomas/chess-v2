import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Blind Seer Pact
 * Bonus (Echolocation): Sliding pieces can see through other pieces.
 * Malus (Darkness): Sliding pieces (Rook, Bishop, Queen) have a maximum move/view range of 3 squares.
 */
export const TheBlindSeer = definePact<{}, {}>('blind_seer')
    .bonus('echolocation', {
        icon: 'radar',
        ranking: 3,
        category: 'Visibility',
        effects: [Effects.movement.hasEcholocation()]
    })
    .malus('darkness', {
        icon: 'eye-off',
        ranking: -4,
        category: 'Visibility',
        effects: [Effects.movement.maxRange(3, (p) => ['rook', 'bishop', 'queen', 'queen'].includes(p.type))]
    })
    .build();

