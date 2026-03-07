import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Spectre Pact
 * Bonus (Incorporeal): Non-pawn pieces can move through friendly pawns.
 * Malus (Possession): Friendy pawns moved through are killed.
 */
export const TheSpectre = definePact<Record<string, unknown>>('spectre')
    .bonus('incorporeal', {
        icon: 'ghost-outline',
        ranking: 4,
        category: 'Movement',
        effects: [Effects.movement.canMoveThrough(m => m.type !== 'pawn', o => o.type === 'pawn')]
    })
    .malus('possession', {
        icon: 'hand-pointing-right',
        ranking: -3,
        category: 'Board Transform',
        modifiers: {
            onExecuteMove: (game, move) => {
                if (move.isCastling || move.isEnPassant || move.isSwap || move.piece.type === 'knight') return;

                const dx = Math.sign(move.to.x - move.from.x);
                const dy = Math.sign(move.to.y - move.from.y);
                let curX = move.from.x + dx;
                let curY = move.from.y + dy;

                let hasConsumed = false;
                while (!hasConsumed && (curX !== move.to.x || curY !== move.to.y)) {
                    const coord = new Coordinate(curX, curY);
                    const square = game.board.getSquare(coord);
                    if (square?.piece && square.piece.color === move.piece.color && square.piece.type === 'pawn') {
                        game.board.removePiece(coord);
                        PactUtils.notifyPactEffect(game, 'spectre', 'possession', 'malus', 'ghost');
                        hasConsumed = true;
                    }
                    curX += dx;
                    curY += dy;
                }
            }
        }
    })
    .build();


