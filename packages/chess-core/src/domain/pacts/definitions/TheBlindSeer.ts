import { PactLogic, RuleModifiers } from '../PactLogic';
import { Piece } from '../../models/Piece';

export class BlindSeerBonus extends PactLogic {
    id = 'echolocation';

    getRuleModifiers(): RuleModifiers {
        return {
            hasEcholocation: (piece: Piece) => {
                // Sliding pieces can see through walls
                return piece.type === 'rook' || piece.type === 'bishop' || piece.type === 'queen';
            }
        };
    }
}

export class BlindSeerMalus extends PactLogic {
    id = 'darkness';

    getRuleModifiers(): RuleModifiers {
        return {
            getMaxRange: (piece: Piece) => 3
        };
    }
}
