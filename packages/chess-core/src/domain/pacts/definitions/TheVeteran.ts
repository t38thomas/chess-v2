import { definePact } from '../PactLogic';
import { Move } from '../../models/Move';
import { Coordinate } from '../../models/Coordinate';
import { MoveGenerator } from '../../rules/MoveGenerator';

/**
 * The Veteran Pact
 * Bonus (Bayonet): Pawns capture straight forward instead of diagonally.
 * Malus (Old Guard): Pawns cannot double move on their first turn.
 */
export const TheVeteran = definePact('veteran')
    .bonus('bayonet', {
        modifiers: {
            onGetPseudoMoves: ({ board, piece, from, moves, orientation }) => {
                if (piece.type !== 'pawn') return;

                const baseDy = piece.color === 'white' ? 1 : -1;
                const forward = MoveGenerator.rotateVector(0, baseDy, orientation ?? 0);

                const forwardX = from.x + forward.dx;
                const forwardY = from.y + forward.dy;

                if (forwardX < 0 || forwardX > 7 || forwardY < 0 || forwardY > 7) return;

                const forwardCoord = new Coordinate(forwardX, forwardY);
                const targetSquare = board.getSquare(forwardCoord);

                if (targetSquare && targetSquare.piece && targetSquare.piece.color !== piece.color) {
                    moves.push(new Move(from, forwardCoord, piece, targetSquare.piece));
                }
            },
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type !== 'pawn') return true;

                const orientation = game?.orientation ?? 0;
                const baseDy = attacker.color === 'white' ? 1 : -1;
                const forward = MoveGenerator.rotateVector(0, baseDy, orientation);

                const dx = to.x - from.x;
                const dy = to.y - from.y;

                const forwardComponent = dx * forward.dx + dy * forward.dy;
                const lateralComponent = Math.abs(dx * forward.dy - dy * forward.dx);

                const isStraightForward = forwardComponent > 0 && lateralComponent === 0;
                const isDiagonal = forwardComponent > 0 && lateralComponent > 0;

                if (isStraightForward) return true;
                if (isDiagonal) return false;

                return true;
            }
        }
    })
    .malus('old_guard', {
        modifiers: {
            canDoubleMove: (piece, y, startY) => false
        }
    })
    .build();

