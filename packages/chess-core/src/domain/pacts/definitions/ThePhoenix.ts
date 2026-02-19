import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Phoenix Pact
 * Bonus (Rebirth): Once per match, if your Queen is captured, a random pawn is promoted to a Queen.
 * Malus (Wingless): Start the match without rooks.
 */
export const ThePhoenix = definePact('phoenix')
    .bonus('rebirth', {
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            if (event === 'capture' && payload) {
                const capturedPiece = (payload as any).capturedPiece;
                if (capturedPiece?.color === playerId && capturedPiece.type === 'queen') {
                    const stateKey = `phoenix_rebirth_used_${playerId}`;
                    if (game.pactState[stateKey]) return;

                    const pawns = PactUtils.findPieces(game, playerId, 'pawn');
                    if (pawns.length > 0) {
                        const [victim] = PactUtils.pickRandom(pawns, 1);
                        if (victim) {
                            PactUtils.promotePiece(game, victim.coord, 'queen');
                            game.pactState[stateKey] = true;
                            PactUtils.notifyPactEffect(game, 'phoenix', 'rebirth', 'bonus', 'fire');
                        }
                    }
                }
            }
        }
    })
    .malus('wingless', {
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            if (event === 'pact_assigned') {
                const rooks = PactUtils.findPieces(game, playerId, 'rook');
                for (const { coord } of rooks) {
                    PactUtils.removePiece(game, coord);
                }
            }
        }
    })
    .build();

