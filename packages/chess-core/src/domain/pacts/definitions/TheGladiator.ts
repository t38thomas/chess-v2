import { PactLogic, RuleModifiers, PactContext } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { PactUtils } from '../PactUtils';

export class ArenaBonus extends PactLogic {
    id = 'arena';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game, attacker, victim, to, from) => {
                // If the victim is on a dark square
                if (PactUtils.isBlackSquare(to)) {
                    // And the attacker is a pawn
                    if (attacker.type === 'pawn') {
                        return false; // Immune to pawns on dark squares
                    }
                }
                return true;
            }
        };
    }
}

export class DisarmedMalus extends PactLogic {
    id = 'disarmed';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        // At the start of the match (when pact is assigned)
        if (event === 'pact_assigned') {
            const bishops = PactUtils.findPieces(game, playerId, 'bishop');

            for (const { coord } of bishops) {
                PactUtils.removePiece(game, coord);
            }
        }
    }
}
