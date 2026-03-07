import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Veteran Pact
 * Bonus (Bayonet): Pawns capture straight forward instead of diagonally. UI counter active.
 * Malus (Old Guard): Pawns cannot double move on their first turn.
 */
export const TheVeteran = definePact<Record<string, unknown>>('veteran')
    .bonus('bayonet', {
        icon: 'knife',
        ranking: 3,
        category: 'Capture Rules',
        effects: [Effects.pawn.canCaptureStraight()],
        getTurnCounters: (context) => {
            const pawns = context.query.pieces().friendly().ofTypes(['pawn']);
            if (pawns.length > 0) {
                return [{
                    id: 'bayonets_ready',
                    label: 'bayonets_ready',
                    value: pawns.length,
                    pactId: 'veteran',
                    type: 'counter',
                }];
            }
            return [];
        }
    })
    .malus('old_guard', {
        icon: 'human-cane',
        ranking: -1,
        category: 'Movement',
        effects: [Effects.pawn.disableDoubleMove()]
    })
    .build();

