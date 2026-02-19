import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { MoveGenerator } from '../../rules/MoveGenerator';

/**
 * The Tidecaller Pact
 * Bonus (Flow): Pawns can move backward one square (no capture).
 * Malus (Ebb): Pawns cannot capture diagonally.
 */
export const TheTidecaller = definePact('tidecaller')
    .bonus('flow', {
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'pawn') return;
                const baseDy = piece.color === 'white' ? 1 : -1;
                const backward = MoveGenerator.rotateVector(0, -baseDy, orientation ?? 0);
                const targetCoord = new Coordinate(from.x + backward.dx, from.y + backward.dy);
                if (targetCoord.isValid() && !board.getSquare(targetCoord)?.piece) {
                    moves.push(new Move(from, targetCoord, piece, null));
                }
            }
        }
    })
    .malus('ebb', {
        modifiers: {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type !== 'pawn') return true;
                const dx = Math.abs(to.x - from.x);
                const dy = Math.abs(to.y - from.y);
                return !(dx > 0 && dy > 0);
            }
        }
    })
    .build();

