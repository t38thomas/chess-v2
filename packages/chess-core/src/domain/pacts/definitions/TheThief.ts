import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Thief Pact
 * Bonus (Pickpocket): Friendly pawns stun adjacent enemy major pieces for 2 turns.
 * Malus (Wanted): Pawns cannot promote.
 */
export const TheThief = definePact('thief')
    .bonus('pickpocket', {
        onMove: (move, context) => {
            const { game, playerId } = context;
            const friendlyPawns = game.board.getAllSquares().filter(sq => sq.piece?.color === playerId && sq.piece.type === 'pawn');
            friendlyPawns.forEach(pawnSq => {
                const pawn = pawnSq.piece!;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const neighbor = new Coordinate(pawnSq.coordinate.x + dx, pawnSq.coordinate.y + dy);
                        if (neighbor.isValid()) {
                            const targetPiece = game.board.getSquare(neighbor)?.piece;
                            if (targetPiece && targetPiece.color !== playerId && (targetPiece.type === 'rook' || targetPiece.type === 'queen')) {
                                const historyKey = `pickpocket_${pawn.id}_${targetPiece.id}`;
                                const ctx = context;
                                const state = ctx.state || {};
                                if (game.totalTurns - (state[historyKey] || -10) > 2 && game.pieceCooldowns.get(targetPiece.id) !== 2) {
                                    game.pieceCooldowns.set(targetPiece.id, 2);
                                    ctx.updateState({ [historyKey]: game.totalTurns });
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
            game.pieceCooldowns.forEach((cd, id) => {
                if (!id.startsWith(playerId) && cd > 0) stunnedCount++;
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
        effects: [Effects.rules.restrictPromotion([])]
    })
    .build();

