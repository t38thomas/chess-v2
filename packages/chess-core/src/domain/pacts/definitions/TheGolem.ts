import { PactLogic, RuleModifiers } from '../PactLogic';
import { Piece, PieceColor } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';

export class StoneSkinBonus extends PactLogic {
    id = 'stone_skin';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game, attacker, victim, to, from) => {
                // Stone Skin: King is immune to attacks from > 3 squares away
                if (victim.type !== 'king') return true;

                // from: attacker's current square
                // to: victim's current square (king)
                const distance = from.distanceTo(to);
                if (distance > 3) {
                    return false;
                }
                return true;
            }
        };
    }
}

export class LeadFeetMalus extends PactLogic {
    id = 'lead_feet';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ from, piece, moves }) => {
                if (piece.type !== 'king') return;

                // Remove or filter out diagonal moves
                // Diagonal moves have |dx| === |dy|
                for (let i = moves.length - 1; i >= 0; i--) {
                    const m = moves[i];
                    const dx = Math.abs(m.to.x - from.x);
                    const dy = Math.abs(m.to.y - from.y);

                    if (dx > 0 && dy > 0 && dx === dy) {
                        moves.splice(i, 1);
                    }
                }
            }
        };
    }
}
