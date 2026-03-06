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
        onCapture: (params, context) => {
            const { victim, attacker } = params;
            if (victim.type === 'queen') {
                if (PactUtils.resurrectRandomPiece(context.game, attacker.color, ['bishop', 'knight'])) {
                    PactUtils.notifyPactEffect(context.game, 'vampire', 'life_thirst', 'bonus', 'blood-bag');
                }
            }
        }
    })

    .malus('vampire_curse', {
        effects: [Effects.rules.disableCastling()]
    })
    .build();

