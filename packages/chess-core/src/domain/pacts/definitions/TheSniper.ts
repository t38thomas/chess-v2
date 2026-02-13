import { PactLogic, RuleModifiers, PactContext } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { BoardModel } from '../../models/BoardModel';
import { PieceColor } from '../../models/Piece';
import { GameEvent, ChessGame } from '../../ChessGame';

export class SniperBonus extends PactLogic {
    id = 'long_sight';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
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
                                // First obstacle found, we skip it and continue the loop
                                x += dx;
                                y += dy;
                                continue;
                            } else if (obstaclesFound === 2) {
                                // Second obstacle found
                                if (target.piece.color !== piece.color) {
                                    // It's an enemy, it's a "snipe" move (capture)
                                    // Check if this move is already in the list to avoid duplicates
                                    if (!moves.some(m => m.to.equals(coord))) {
                                        moves.push(new Move(from, coord, piece, target.piece));
                                    }
                                }
                                break; // Blocked after the second obstacle
                            }
                        } else {
                            // Empty square
                            if (obstaclesFound === 1) {
                                // We are behind exactly one obstacle
                                if (!moves.some(m => m.to.equals(coord))) {
                                    moves.push(new Move(from, coord, piece));
                                }
                            }
                        }
                        x += dx;
                        y += dy;
                    }
                });
            }
        };
    }
}

export class SniperMalus extends PactLogic {
    id = 'reload';

    getRuleModifiers(): RuleModifiers {
        return {
            canMovePiece: (game, from) => {
                const square = game.board.getSquare(from);
                if (square && square.piece) {
                    const cooldown = game.pieceCooldowns.get(square.piece.id);
                    if (cooldown && cooldown > 0) return false;
                }
                return true;
            },
            onExecuteMove: (game, move) => {
                // If a Rook captures, it gets the 'reload' cooldown
                if (move.piece.type === 'rook' && (move.capturedPiece || move.isEnPassant)) {
                    // Stun for 1 full turn cycle. 
                    // Decremented at beginning of player's turn.
                    game.pieceCooldowns.set(move.piece.id, 2);
                }
            }
        };
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        // Handle turn start to decrement cooldowns
        if (event === 'turn_start') {
            const currentTurnPlayer = payload as PieceColor;
            if (currentTurnPlayer === playerId) {
                // It's the Sniper's turn. Decrement cooldowns for their pieces.
                game.pieceCooldowns.forEach((cd, id) => {
                    if (cd > 0 && id.startsWith(playerId)) {
                        game.pieceCooldowns.set(id, cd - 1);
                    }
                });
            }
        }
    }
}
