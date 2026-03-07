import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Engineer Pact
 * Bonus (Turret): Rooks can move and capture 1 square diagonally.
 * Malus (Design Flaw): Rooks cannot move horizontally.
 */
export const TheEngineer = definePact<{}, {}>('engineer')
    .bonus('turret', {
        icon: 'cctv',
        ranking: 3,
        category: 'Capture Rules',
        effects: [Effects.movement.addSingleStepMoves('rook', [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }])]
    })
    .malus('design_flaw', {
        icon: 'alert-octagon',
        ranking: -2,
        category: 'Movement',
        effects: [Effects.movement.blockMoves('rook', ['horizontal'])]
    })
    .build();

