import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/** State for the pickpocket bonus: tracks when each pawn-enemy pair last triggered a stun. */
type ThiefBonusState = Record<string, number>;

/**
 * The Thief Pact
 * Bonus (Pickpocket): Friendly pawns stun adjacent enemy major pieces for 2 turns.
 * Malus (Wanted): Pawns cannot promote.
 */
export const TheThief = definePact<ThiefBonusState, {}>('thief')
    .bonus('pickpocket', {
        initialState: () => ({}),
        onMove: (move, context) => {
            const { game, playerId } = context;
            const friendlyPawns = context.query.pieces().friendly().ofTypes(['pawn']);

            friendlyPawns.forEach(pawnInfo => {
                const pawn = pawnInfo.piece;
                const pawnCoord = pawnInfo.coord;

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = new Coordinate(pawnCoord.x + dx, pawnCoord.y + dy);
                        if (neighbor.isValid()) {
                            const enemySquare = game.board.getSquare(neighbor);
                            const enemyPiece = enemySquare?.piece;
                            if (enemyPiece && enemyPiece.color !== playerId && (enemyPiece.type === 'rook' || enemyPiece.type === 'queen')) {
                                const historyKey = `pickpocket_${pawn.id}_${enemyPiece.id}`;
                                const lastTurn = context.state[historyKey] ?? -10;
                                if (game.totalTurns - lastTurn > 2 && (game.pieceCooldowns.get(enemyPiece.id) ?? 0) < 2) {
                                    game.applyCooldown!(enemyPiece.id, 2);
                                    context.updateState({ [historyKey]: game.totalTurns });
                                    PactUtils.notifyPactEffect(game, 'thief', 'pickpocket', 'bonus', 'hand-coin');
                                }
                            }
                        }
                    }
                }
            });
        },
        getTurnCounters: (context) => {
            const { game, playerId } = context;
            let stunnedCount = 0;
            const enemyColor = playerId === 'white' ? 'black' : 'white';

            game.pieceCooldowns.forEach((cd, id) => {
                if (id.startsWith(enemyColor) && cd > 0) stunnedCount++;
            });

            if (stunnedCount > 0) {
                return [{
                    id: 'pickpocket_stun_counter',
                    label: 'pickpocket_stun_label',
                    value: stunnedCount,
                    pactId: 'thief',
                    type: 'counter'
                }];
            }
            return [];
        }
    })
    .malus('wanted', {
        icon: 'handcuffs',
        ranking: -4,
        category: 'Promotion',
        effects: [Effects.rules.restrictPromotion(['knight'])]
    })
    .build();
