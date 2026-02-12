import { PactLogic, RuleModifiers } from '../PactLogic';
import { PieceType } from '../../models/Piece';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { ChessGame } from '../../ChessGame';

export class HeavyCavalryBonus extends PactLogic {
    id = 'trample';

    getRuleModifiers(): RuleModifiers {
        return {
            onExecuteMove: (game: ChessGame, move: Move) => {
                // If it's a Knight move
                if (move.piece.type !== 'knight') return;

                const targetPos = move.to;
                const directions = [
                    { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
                    { dx: 0, dy: 1 }, { dx: 0, dy: -1 },
                    { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
                ];

                for (const dir of directions) {
                    const nx = targetPos.x + dir.dx;
                    const ny = targetPos.y + dir.dy;

                    if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
                        const coord = new Coordinate(nx, ny);
                        const square = game.board.getSquare(coord);

                        if (square && square.piece && square.piece.color !== move.piece.color && square.piece.type === 'pawn') {
                            // Trample! Record the capture for history maybe? 
                            // For now just remove and emit event.
                            game.board.removePiece(coord);
                            // We should probably emit an event here to notify UI/history
                            // game.emit('pieceCaptured', { piece: square.piece, coord });
                        }
                    }
                }
            }
        };
    }
}

export class HeavyCavalryMalus extends PactLogic {
    id = 'heavy_armor';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
                if (piece.type !== 'knight') return;

                // Knight armor: cannot jump over own pawns.
                // Interpretation: Mao logic. 
                // Any knight jump is blocked if there's a friendly pawn in the middle of the "L"
                // e.g. from (x,y) to (x+1, y+2) is blocked by (x, y+1)

                // We iterate moves and remove those that are blocked.
                for (let i = moves.length - 1; i >= 0; i--) {
                    const m = moves[i];
                    if (m.piece.type === 'knight') {
                        const dx = m.to.x - from.x;
                        const dy = m.to.y - from.y;

                        // Identify blocking candidate:
                        // If |dx| == 1 and |dy| == 2, the blocker is at (from.x, from.y + sign(dy))
                        // If |dx| == 2 and |dy| == 1, the blocker is at (from.x + sign(dx), from.y)

                        let bx = from.x;
                        let by = from.y;

                        if (Math.abs(dx) === 1 && Math.abs(dy) === 2) {
                            by += Math.sign(dy);
                        } else if (Math.abs(dx) === 2 && Math.abs(dy) === 1) {
                            bx += Math.sign(dx);
                        } else {
                            // Should not happen for standard knight moves
                            continue;
                        }

                        const blockCoord = new Coordinate(bx, by);
                        const blockSquare = board.getSquare(blockCoord);

                        if (blockSquare && blockSquare.piece && blockSquare.piece.color === piece.color && blockSquare.piece.type === 'pawn') {
                            moves.splice(i, 1);
                        }
                    }
                }
            }
        };
    }
}
