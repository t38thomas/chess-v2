import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { PactUtils } from '../PactUtils';

/**
 * The Phoenix Pact
 * Bonus (Rebirth): Once per match, if your Queen is captured, a random pawn is promoted to a Queen.
 * Malus (Wingless): Start the match without rooks.
 */
export const ThePhoenix = definePact('phoenix')
    .bonus('rebirth', {
        effects: [
            Effects.state.oncePerMatch({
                key: 'phoenix_rebirth_used',
                triggerOn: ['capture'],
                filter: (event, payload, context) => {
                    const move = payload as any;
                    const capturedPiece = move.capturedPiece || payload.victim;
                    return capturedPiece?.color === context.playerId && capturedPiece.type === 'queen';
                },
                onTrigger: (context) => {
                    const pawns = context.query.pieces().ofTypes(['pawn']);
                    if (pawns.length > 0) {
                        const [victim] = PactUtils.pickRandom(pawns, 1);
                        if (victim) {
                            PactUtils.promotePiece(context.game, victim.coord, 'queen');
                            PactUtils.notifyPactEffect(context.game, 'phoenix', 'rebirth', 'bonus', 'fire');
                        }
                    }
                }
            })
        ]
    })
    .malus('wingless', {
        effects: [Effects.rules.removePiecesAtStart('rook')]
    })
    .build();

