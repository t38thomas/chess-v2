import { PactLogic, RuleModifiers } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { MoveGenerator } from '../../rules/MoveGenerator';

export class TidecallerBonus extends PactLogic {
    id = 'flow';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'pawn') return;

                // Flow: Pawns can move backward 1 square (movement only, no capture).
                // Backward = opposite of forward, both relative to current board orientation.
                const baseDy = piece.color === 'white' ? 1 : -1;
                const backward = MoveGenerator.rotateVector(0, -baseDy, orientation ?? 0);

                const targetX = from.x + backward.dx;
                const targetY = from.y + backward.dy;

                // Check bounds
                if (targetX < 0 || targetX > 7 || targetY < 0 || targetY > 7) return;

                const targetCoord = new Coordinate(targetX, targetY);
                const targetSquare = board.getSquare(targetCoord);

                // Must be empty to move
                if (targetSquare && !targetSquare.piece) {
                    moves.push(new Move(from, targetCoord, piece, null));
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
