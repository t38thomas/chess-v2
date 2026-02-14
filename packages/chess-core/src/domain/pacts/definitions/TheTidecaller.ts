import { PactLogic, RuleModifiers } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';

export class TidecallerBonus extends PactLogic {
    id = 'flow';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
                if (piece.type !== 'pawn') return;

                // Flow: Pawns can move backward 1 square AND capture vertically (forward/backward)
                const forwardDir = piece.color === 'white' ? 1 : -1;
                const backwardDir = -forwardDir;

                // 1. Backward Logic (Move + Capture)
                const backwardY = from.y + backwardDir;
                if (backwardY >= 0 && backwardY <= 7) {
                    const backwardCoord = new Coordinate(from.x, backwardY);
                    const backwardSquare = board.getSquare(backwardCoord);

                    if (backwardSquare) {
                        if (!backwardSquare.piece) {
                            // Move Backward
                            moves.push(new Move(from, backwardCoord, piece, null));
                        } else if (backwardSquare.piece.color !== piece.color) {
                            // Capture Backward
                            moves.push(new Move(from, backwardCoord, piece, backwardSquare.piece));
                        }
                    }
                }

                // 2. Forward Logic (Capture only - movement is standard)
                const forwardY = from.y + forwardDir;
                if (forwardY >= 0 && forwardY <= 7) {
                    const forwardCoord = new Coordinate(from.x, forwardY);
                    const forwardSquare = board.getSquare(forwardCoord);

                    if (forwardSquare && forwardSquare.piece && forwardSquare.piece.color !== piece.color) {
                        // Capture Forward
                        moves.push(new Move(from, forwardCoord, piece, forwardSquare.piece));
                    }
                }
            }
        };
    }
}

export class TidecallerMalus extends PactLogic {
    id = 'ebb';

    getRuleModifiers(): RuleModifiers {
        return {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type !== 'pawn') return true;

                // Ebb: Pawns cannot capture diagonally.
                // Standard capture IS diagonal.
                // So this effectively disables standard captures.

                const dx = Math.abs(to.x - from.x);
                const dy = Math.abs(to.y - from.y);

                // Diagonal move has dx > 0 (usually 1 for pawns)
                if (dx > 0 && dy > 0) {
                    return false;
                }

                return true;
            }
        };
    }
}
