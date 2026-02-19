import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Vampire Pact
 * Bonus (Life Thirst): Capturing the enemy Queen resurrects a friendly minor piece.
 * Malus (Vampire Curse): The King can never castle.
 */
export const TheVampire = definePact('vampire')
    .bonus('life_thirst', {
        modifiers: {
            onExecuteMove: (game, move) => {
                if (move.capturedPiece?.type === 'queen') {
                    if (PactUtils.resurrectRandomPiece(game, move.piece.color, ['bishop', 'knight'])) {
                        PactUtils.notifyPactEffect(game, 'life_thirst', 'life_thirst', 'bonus', 'blood-bag');
                    }
                }
            }
        }
    })
    .malus('vampire_curse', {
        effects: [Effects.rules.disableCastling()]
    })
    .build();

