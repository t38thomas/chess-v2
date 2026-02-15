import { PactLogic, RuleModifiers, PactContext } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Move } from '../../models/Move';
import { PactUtils } from '../PactUtils';
import { PieceType } from '../../models/Piece';

/**
 * Life Thirst: Capturing the enemy Queen resurrects a minor piece (Bishop or Knight).
 */
export class LifeThirstBonus extends PactLogic {
    id = 'life_thirst';

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game, move: Move) => {
                // Check if a capture happened and the victim was a Queen
                if (move.capturedPiece && move.capturedPiece.type === 'queen') {
                    const myColor = move.piece.color;

                    // Try to resurrect a random captured Bishop or Knight
                    const resurrected = PactUtils.resurrectRandomPiece(game, myColor, ['bishop', 'knight']);

                    if (resurrected) {
                        PactUtils.emitPactEffect(game, {
                            pactId: this.id,
                            title: 'pact.toasts.vampire.life_thirst.title',
                            description: 'pact.toasts.vampire.life_thirst.desc',
                            icon: 'blood-bag',
                            type: 'bonus'
                        });
                    }
                }
            }
        };
    }
}

/**
 * Vampire Curse: The King can never castle.
 */
export class VampireCurseMalus extends PactLogic {
    id = 'vampire_curse';

    getRuleModifiers(): RuleModifiers {
        return {
            canCastle: () => false
        };
    }
}
