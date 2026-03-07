import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils, isCoordinate } from '../PactUtils';

interface VoidJumpParams {
    from: Coordinate;
    to: Coordinate;
}

/**
 * The Void Jumper Pact
 * Bonus (Void Jump): Swap positions of two friendly pieces. Max uses: 3.
 * Malus (Ritual Sacrifice): To jump, you must sacrifice your currently most advanced piece.
 */
export const TheVoidJumper = definePact<{}, {}>('void_jumper')
    .bonus('void_jump', {
        icon: 'axis-arrow',
        ranking: 5,
        category: 'Action',
        activeAbility: {
            id: 'void_jump',
            name: 'void_jump',
            description: 'desc_void_jump',
            icon: 'swap-vertical-bold',
            targetType: 'square',
            consumesTurn: true,
            maxUses: 3,
            validateParams: (p): p is VoidJumpParams => {
                if (!p || typeof p !== 'object') return false;
                const params = p as Record<string, unknown>;
                return isCoordinate(params.from) && isCoordinate(params.to);
            },
            execute: (context, params) => {
                const { game, playerId } = context;
                const p = params as Record<string, unknown>;
                if (!p || !isCoordinate(p.from) || !isCoordinate(p.to)) return false;
                const { from, to } = params as VoidJumpParams;

                const fromCoord = new Coordinate(from.x, from.y);
                const toCoord = new Coordinate(to.x, to.y);

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
    .malus('ritual_sacrifice', {
        icon: 'skull',
        ranking: -5,
        category: 'Board Transform',
    })
    .build();
