import { PactLogic, RuleModifiers } from '../PactLogic';
import { PieceType } from '../../models/Piece';

export class SaboteurBonus extends PactLogic {
    id = 'diagonal_dash';

    getRuleModifiers(): RuleModifiers {
        return {
            canDiagonalDash: (piece) => piece.type === 'pawn'
        };
    }
}

export class SaboteurMalus extends PactLogic {
    id = 'cut_supplies';

    getRuleModifiers(): RuleModifiers {
        return {
            getAllowedPromotionTypes: (piece) => {
                // Cannot promote to Queen
                return ['rook', 'bishop', 'knight'];
            }
        };
    }
}
