
import { PactLogic, RuleModifiers } from '../PactLogic';
import { Piece } from '../../models/Piece';
import { IChessGame } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';

export class HawkBonus extends PactLogic {
    id = 'high_flyer';

    getRuleModifiers(): RuleModifiers {
        return {
            canMoveThroughFriendlies: (mover: Piece, obstacle: Piece) => {
                // Bishops can jump over friendly pieces
                return mover.type === 'bishop' && mover.color === obstacle.color;
            }
        };
    }
}

export class HawkMalus extends PactLogic {
    id = 'distant_predator';

    getRuleModifiers(): RuleModifiers {
        return {
            canCapture: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate) => {
                // Bishops cannot capture at range 1 (adjacent diagonally)
                if (attacker.type === 'bishop') {
                    const dx = Math.abs(to.x - from.x);
                    const dy = Math.abs(to.y - from.y);
                    if (dx === 1 && dy === 1) {
                        return false;
                    }
                }
                return true;
            }
        };
    }
}
