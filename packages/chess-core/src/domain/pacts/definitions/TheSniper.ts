import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { BoardModel } from '../../models/BoardModel';
import { PactUtils } from '../PactUtils';

/**
 * The Sniper Pact
 * Bonus (Long Sight): Rooks can capture pieces behind exactly one obstacle.
 * Malus (Reload): Rooks get a 2-turn cooldown after capturing.
 */
export const TheSniper = definePact('sniper')
    .bonus('long_sight', {
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from }) => {
                if (piece.type !== 'rook') return currentMoves;

                const newMoves = [...currentMoves];
                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                dirs.forEach(([dx, dy]) => {
                    let x = from.x + dx;
                    let y = from.y + dy;
                    let obstaclesFound = 0;

                    while (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE) {
                        const coord = new Coordinate(x, y);
                        const target = board.getSquare(coord);

                        if (target?.piece) {
                            obstaclesFound++;
                            if (obstaclesFound === 2) {
                                // Can capture the second piece if it's an enemy
                                if (target.piece.color !== piece.color && !newMoves.some(m => m.to.equals(coord))) {
                                    newMoves.push(new Move(from, coord, piece, target.piece));
                                }
                                break; // Line of sight blocked by second obstacle
                            }
                        } else if (obstaclesFound === 1) {
                            // Empty square behind 1 obstacle
                            if (!newMoves.some(m => m.to.equals(coord))) {
                                newMoves.push(new Move(from, coord, piece, null));
                            }
                        }

                        x += dx;
                        y += dy;
                    }
                });
                return newMoves;
            }
        }
    })
    .malus('reload', {
        modifiers: {
            onExecuteMove: (game, move) => {
                if (move.piece.type === 'rook' && (move.capturedPiece || move.isEnPassant)) {
                    // Apply cooldown through domain command
                    game.applyCooldown!(move.piece.id, 2);
                    PactUtils.notifyPactEffect(game, 'sniper', 'reload', 'malus', 'reload');
                }
            }
        },
        getTurnCounters: (context) => {
            const { game, playerId } = context;
            let maxCooldown = 0;
            game.pieceCooldowns.forEach((cd, id) => {
                if (id.startsWith(playerId) && cd > maxCooldown) maxCooldown = cd;
            });

            if (maxCooldown > 0) {
                return [{
                    id: 'reload_counter',
                    label: 'reloading',
                    value: maxCooldown,
                    pactId: 'sniper',
                    type: 'cooldown'
                }];
            }
            return [];
        }
    })
    .build();


