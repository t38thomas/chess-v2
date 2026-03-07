import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Heavy Cavalry Pact
 * Bonus (Trample): Knights trample (remove) adjacent enemy pawns upon landing.
 * Malus (Heavy Armor): Knights cannot jump over friendly pawns (Mao-style blocking).
 */
export const TheHeavyCavalry = definePact<Record<string, unknown>>('heavy_cavalry')
    .bonus('trample', {
        icon: 'horse-variant',
        ranking: 4,
        category: 'Capture Rules',
        target: 'self',
        modifiers: {
            onExecuteMove: (game, move) => {
                const dx = move.to.x - move.from.x;
                const dy = move.to.y - move.from.y;
                const sdx = Math.sign(dx);
                const sdy = Math.sign(dy);

                const allDirections = [
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                    { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
                ];

                // Filter for frontal 3 squares based on movement vector
                const frontalDirections = allDirections.filter(d => {
                    const dotX = d.dx * sdx;
                    const dotY = d.dy * sdy;
                    // Condition: must be same side as move vector components
                    if (sdx !== 0 && dotX < 0) return false;
                    if (sdy !== 0 && dotY < 0) return false;
                    return true;
                });

                for (const dir of frontalDirections) {
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
        icon: 'shield-lock',
        ranking: -2,
        category: 'Movement',
        target: 'self',
        modifiers: {
            onModifyMoves: (currentMoves, { board, piece, from }) => {
                if (piece.type !== 'knight' && piece.type !== 'king') return currentMoves;

                return currentMoves.filter(m => {
                    const isKnight = m.piece.type === 'knight';
                    const isKing = m.piece.type === 'king';

                    if (!isKnight && !isKing) return true;

                    const dx = m.to.x - from.x;
                    const dy = m.to.y - from.y;

                    let bx = from.x;
                    let by = from.y;

                    if (isKnight) {
                        if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
                            by += Math.sign(dy);
                        } else if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
                            bx += Math.sign(dx);
                        } else {
                            return true;
                        }
                    } else if (isKing) {
                        // For King, trample means he can step on pawns? No, heavy armor means he is blocked by friendly pawns?
                        // Actually the malus says: "cannot jump over friendly pawns". King doesn't jump.
                        // Wait, maybe for King it means something else.
                        // Let's re-read the malus: "Knights cannot jump over friendly pawns".
                        // If I apply it to King, it doesn't make much sense unless the King jumps.
                        // But the user said: "l'effetto Trample lo vedrei bene anche per il Re".
                        // So Bonus Trample for King. Malus maybe only for Knights.
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

