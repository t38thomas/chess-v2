import { PactLogic, RuleModifiers } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';

export class VeteranBonus extends PactLogic {
    id = 'bayonet';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves }) => {
                if (piece.type !== 'pawn') return;

                const direction = piece.color === 'white' ? 1 : -1;
                const forwardY = from.y + direction;

                // Check bounds
                if (forwardY < 0 || forwardY > 7) return;

                const forwardCoord = new Coordinate(from.x, forwardY);
                const targetSquare = board.getSquare(forwardCoord);

                // Bayonet: Capture enemy forward
                if (targetSquare && targetSquare.piece && targetSquare.piece.color !== piece.color) {
                    moves.push(new Move(from, forwardCoord, piece, targetSquare.piece));
                }
            },
            canCapture: (attacker, victim, to, from, board) => {
                if (attacker.type !== 'pawn') return true;

                const isForward = attacker.color === 'white' ? to.y > from.y : to.y < from.y;
                const isDiagonal = Math.abs(to.x - from.x) === 1;
                const isStraight = to.x === from.x;

                // Bayonet: Allow forward capture (which we generated above)
                if (isStraight && isForward) return true;

                // Bayonet: Forbid diagonal capture
                if (isDiagonal) return false;

                return true;
            }
        };
    }
}

export class VeteranMalus extends PactLogic {
    id = 'old_guard';

    getRuleModifiers(): RuleModifiers {
        return {
            canDoubleMove: (piece, y, startY) => false
        };
    }
}
