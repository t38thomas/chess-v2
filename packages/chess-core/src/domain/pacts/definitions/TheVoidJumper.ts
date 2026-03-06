import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Void Jumper Pact
 * Bonus (Void Jump): Swap positions of two friendly pieces at the cost of your most advanced piece.
 * Malus (Ritual Sacrifice): Associated with the Void Jump cost.
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
            repeatable: true,
            execute: (context, params?: { from: Coordinate, to: Coordinate }) => {
                const { game, playerId } = context;
                if (!params?.from || !params?.to) return false;

                const fromCoord = new Coordinate(params.from.x, params.from.y);
                const toCoord = new Coordinate(params.to.x, params.to.y);

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


