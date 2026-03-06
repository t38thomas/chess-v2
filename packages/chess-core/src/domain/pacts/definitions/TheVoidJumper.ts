import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Void Jumper Pact
 * Bonus (Void Jump): Swap positions of two friendly pieces. Max uses: 3.
 * Malus (Ritual Sacrifice): To jump, you must sacrifice your currently most advanced piece.
 */
export const TheVoidJumper = definePact('void_jumper')
    .bonus('void_jump', {
        activeAbility: {
            id: 'void_jump',
            name: 'void_jump',
            description: 'desc_void_jump',
            icon: 'swap-vertical-bold',
            targetType: 'square',
            consumesTurn: true,
            maxUses: 3,
            execute: (context, params) => {
                const { game, playerId } = context;
                const p = params as { from: Coordinate; to: Coordinate } | undefined;
                if (!p?.from || !p?.to) return false;

                const fromCoord = new Coordinate(p.from.x, p.from.y);
                const toCoord = new Coordinate(p.to.x, p.to.y);

                const sq1 = game.board.getSquare(fromCoord);
                const sq2 = game.board.getSquare(toCoord);

                if (sq1?.piece?.color === playerId && sq2?.piece?.color === playerId) {
                    PactUtils.swapPieces(game, fromCoord, toCoord);
                    const victim = PactUtils.sacrificeMostAdvancedPiece(game, playerId, []);
                    if (victim) {
                        PactUtils.notifyPactEffect(game, 'void_jumper', 'sacrifice', 'malus', 'skull');
                    }
                    return true;
                }
                return false;
            }
        }
    })
    .malus('ritual_sacrifice', {})
    .build();


