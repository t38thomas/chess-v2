import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Vampire Pact
 * Bonus (Life Thirst): Capturing the enemy Queen or Rook resurrects a friendly minor piece.
 * Malus (Vampire Curse): The King can never castle.
 */
export const TheVampire = definePact('vampire')
    .bonus('life_thirst', {
        icon: 'blood-bag',
        ranking: 5,
        category: 'Capture Rules',
        onCapture: (params, context) => {
            const victim = params.capturedPiece;
            const attacker = params.piece;
            if (victim && (victim.type === 'queen' || victim.type === 'rook')) {
                if (PactUtils.resurrectRandomPiece(context.game, context.playerId, ['bishop', 'knight'])) {
                    PactUtils.notifyPactEffect(context.game, 'vampire', 'life_thirst', 'bonus', 'blood-bag');
                }
            }
        }
    })

    .malus('vampire_curse', {
        icon: 'cross',
        ranking: -5,
        category: 'King Safety',
        effects: [Effects.rules.disableCastling()]
    })
    .build();

