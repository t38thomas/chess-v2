import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Gladiator Pact
 * Bonus (Arena): Pieces on dark squares are immune to pawn captures.
 * Malus (Disarmed): Start the match without bishops.
 */
export const TheGladiator = definePact('gladiator')
    .bonus('arena', {
        modifiers: {
            canBeCaptured: (game, attacker, victim, to) => {
                return !(PactUtils.isBlackSquare(to) && attacker.type === 'pawn');
            }
        }
    })
    .malus('disarmed', {
        onEvent: (event, payload, context) => {
            if (event === 'pact_assigned') {
                const bishops = PactUtils.findPieces(context.game, context.playerId, 'bishop');
                for (const { coord } of bishops) {
                    PactUtils.removePiece(context.game, coord);
                }
            }
        }
    })
    .build();

