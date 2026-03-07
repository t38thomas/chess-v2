import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';

/**
 * The Jester Pact
 * Bonus (Chaos): Bishops move like Knights. UI counter active.
 * Malus (Jester): Knights move like Bishops. UI counter active.
 */
export const TheJester = definePact<{}, {}>('jester')
    .bonus('chaos', {
        icon: 'drama-masks',
        ranking: 3,
        category: 'Movement',
        effects: [Effects.movement.swapMovement('bishop', 'knight')],
        getTurnCounters: (context) => [{
            id: 'chaos_swap',
            label: 'movement_swapped',
            value: 1,
            pactId: 'jester',
            type: 'counter',
            subLabel: 'Bishop → Knight'
        }]
    })
    .malus('jester', {
        icon: 'party-popper',
        ranking: -3,
        category: 'Movement',
        effects: [Effects.movement.swapMovement('knight', 'bishop')],
        getTurnCounters: (context) => [{
            id: 'jester_swap',
            label: 'movement_swapped',
            value: 1,
            pactId: 'jester',
            type: 'counter',
            subLabel: 'Knight → Bishop'
        }]
    })
    .build();
