import { PactLogic, RuleModifiers } from '../PactLogic';
import { PactUtils } from '../PactUtils';
import { IChessGame } from '../../GameTypes';
import { Piece, PieceColor, PieceType } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { BoardModel } from '../../models/BoardModel';

export class VigilanceBonus extends PactLogic {
    id = 'vigilance';

    getRuleModifiers(): RuleModifiers {
        return {
            canBeCaptured: (game: IChessGame | undefined, attacker: Piece, victim: Piece, to: Coordinate, from: Coordinate): boolean => {
                if (!game) return true;

                // Find the victim's King
                const kingInfo = PactUtils.findPieces(game, victim.color, 'king')[0];
                if (!kingInfo) return true;

                // If victim is adjacent to its King, it cannot be captured
                if (PactUtils.isAdjacent(to, kingInfo.coord)) {
                    return false;
                }

                return true;
            }
        };
    }
}

export class AnchoredMalus extends PactLogic {
    id = 'anchored';

    getRuleModifiers(): RuleModifiers {
        return {
            canMovePiece: (game: IChessGame, from: Coordinate, board?: BoardModel): boolean => {
                const effectiveBoard = board || game.board;
                const square = effectiveBoard.getSquare(from);
                const piece = square?.piece;

                if (piece?.type === 'king') {
                    // King cannot move if he has ANY adjacent piece (friendly or enemy)
                    const adjacentPieces = PactUtils.getPiecesAdjacentTo(game, from);
                    if (adjacentPieces.length > 0) {
                        return false;
                    }
                }

                return true;
            }
        };
    }
}
