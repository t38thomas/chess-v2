import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Engineer Pact
 * Bonus (Turret): Rooks can move 1 square diagonally.
 * Malus (Design Flaw): Rooks cannot move horizontally.
 */
export const TheEngineer = definePact('engineer')
    .bonus('turret', {
        effects: [Effects.movement.addSingleStepMoves('rook', [{ dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }])]
    })
    .malus('design_flaw', {
        effects: [Effects.movement.blockMoves('rook', ['horizontal'])]
    })
    .build();

