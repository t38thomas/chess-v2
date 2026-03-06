import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Heavy Cavalry Pact
 * Bonus (Trample): Knights trample (remove) adjacent enemy pawns upon landing.
 * Malus (Heavy Armor): Knights cannot jump over friendly pawns (Mao-style blocking).
 */
export const TheHeavyCavalry = definePact('heavy_cavalry')
    .bonus('trample', {
        target: 'self',
        modifiers: {
            onExecuteMove: (game, move) => {
                if (move.piece.type !== 'knight') return;

                const directions = [
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
                ];

                for (const dir of directions) {
                    const nx = move.to.x + dir.dx;
                    const ny = move.to.y + dir.dy;

                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        const coord = new Coordinate(nx, ny);
                        const square = game.board.getSquare(coord);

                        if (square?.piece && square.piece.color !== move.piece.color && square.piece.type === 'pawn') {
                            game.board.removePiece(coord);
                            PactUtils.notifyPactEffect(game, 'heavy_cavalry', 'trample', 'bonus', 'horse-variant');
                        }
                    }
                }
            }
        }
    })
    .malus('heavy_armor', {
        target: 'self',
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from }) => {
                if (piece.type !== 'knight') return currentMoves;

                return currentMoves.filter(m => {
                    if (m.piece.type !== 'knight') return true;
                    const dx = m.to.x - from.x;
                    const dy = m.to.y - from.y;

                    let bx = from.x;
                    let by = from.y;

                    if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
                        by += Math.sign(dy);
                    } else if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
                        bx += Math.sign(dx);
                    } else {
                        return true;
                    }

                    const blockCoord = new Coordinate(bx, by);
                    const blockSquare = board.getSquare(blockCoord);

                    if (blockSquare?.piece && blockSquare.piece.color === piece.color && blockSquare.piece.type === 'pawn') {
                        return false;
                    }

                    return true;
                });
            }
        }
    })
    .build();

