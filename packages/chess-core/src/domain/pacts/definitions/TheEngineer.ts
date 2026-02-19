import { PactLogic, RuleModifiers } from '../PactLogic';
import { PactUtils } from '../PactUtils';

export class TurretBonus extends PactLogic {
    id = 'turret';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'rook') return;

                const directions = [
                    { dx: 1, dy: 1 }, { dx: 1, dy: -1 },
                    { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
                ];

                PactUtils.addSingleStepMoves(board, piece, from, moves, directions, orientation ?? 0);
            }
        };
    }
}

export class DesignFlawMalus extends PactLogic {
    id = 'design_flaw';

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: ({ piece, from, moves, orientation }) => {
                if (piece.type !== 'rook') return;

                // Design Flaw: Rooks cannot move horizontally (relative to board orientation).
                PactUtils.blockHorizontalMoves(moves, from, orientation ?? 0);
            }
        };
    }
}
