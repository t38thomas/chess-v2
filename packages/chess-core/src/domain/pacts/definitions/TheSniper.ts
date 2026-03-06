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
            onGetPseudoMoves: ({ board, piece, from, moves }, context) => {
                if (context && piece.color !== context.playerId) return;
                if (piece.type !== 'rook') return;

                const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
                dirs.forEach(([dx, dy]) => {
                    let x = from.x + dx;
                    let y = from.y + dy;
                    let obstaclesFound = 0;

                    while (x >= 0 && x < BoardModel.SIZE && y >= 0 && y < BoardModel.SIZE) {
                        const coord = new Coordinate(x, y);
                        const target = board.getSquare(coord);
                        if (!target) break;

                        if (target.piece) {
                            obstaclesFound++;
                            if (obstaclesFound === 1) {
                                x += dx;
                                y += dy;
                                continue;
                            } else if (obstaclesFound === 2) {
                                if (target.piece.color !== piece.color && !moves.some(m => m.to.equals(coord))) {
                                    moves.push(new Move(from, coord, piece, target.piece));
                                }
                                break;
                            }
                        } else if (obstaclesFound === 1) {
                            if (!moves.some(m => m.to.equals(coord))) {
                                moves.push(new Move(from, coord, piece));
                            }
                        }
                        x += dx;
                        y += dy;
                    }
                });
            }
        }
    })
    .malus('reload', {
        modifiers: {
            canMovePiece: (params, context) => {
                const { game, from, board } = params;
                const effectiveBoard = board || game.board;
                const square = effectiveBoard.getSquare(from);
                if (square?.piece) {
                    if (context && square.piece.color !== context.playerId) return true;
                    const cooldown = game.pieceCooldowns.get(square.piece.id);
                    if (cooldown && cooldown > 0) return false;
                }
                return true;
            },
            onExecuteMove: (game, move, context) => {
                if (context && move.piece.color !== context.playerId) return;
                if (move.piece.type === 'rook' && (move.capturedPiece || move.isEnPassant)) {
                    game.pieceCooldowns.set(move.piece.id, 2);
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

