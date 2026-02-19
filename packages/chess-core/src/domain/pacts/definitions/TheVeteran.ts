import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Veteran Pact
 * Bonus (Bayonet): Pawns capture straight forward instead of diagonally.
 * Malus (Old Guard): Pawns cannot double move on their first turn.
 */
export const TheVeteran = definePact('veteran')
    .bonus('bayonet', {
        effects: [Effects.pawn.canCaptureStraight()]
    })
    .malus('old_guard', {
        effects: [Effects.pawn.disableDoubleMove()]
    })
    .build();

