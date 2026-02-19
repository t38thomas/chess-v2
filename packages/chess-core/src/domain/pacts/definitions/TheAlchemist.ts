import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Alchemist Pact
 * Bonus (Transmutation): Active ability to swap two friendly non-king pieces.
 * Malus (Volatile Reagents): Capturing or promoting a piece stuns it for 1 turn cycle.
 */
export const TheAlchemist = definePact('alchemist')
    .bonus('transmutation', {
        activeAbility: {
            id: 'transmutation',
            name: 'transmutation',
            description: 'desc_transmutation',
            icon: 'swap-horizontal',
            maxUses: 1,
            targetType: 'square',
            consumesTurn: true,
            execute: (context, params?: { from: Coordinate, to: Coordinate }) => {
                const { game, playerId } = context;
                if (!params || !params.from || !params.to) return false;

                const fromCoord = new Coordinate(params.from.x, params.from.y);
                const toCoord = new Coordinate(params.to.x, params.to.y);

                const sq1 = game.board.getSquare(fromCoord);
                const sq2 = game.board.getSquare(toCoord);

                if (!sq1 || !sq2 || !sq1.piece || !sq2.piece) return false;
                if (sq1.piece.color !== playerId || sq2.piece.color !== playerId) return false;
                if (sq1.piece.type === 'king' || sq2.piece.type === 'king') return false;

                return PactUtils.swapPieces(game, fromCoord, toCoord);
            }
        }
    })
    .malus('volatile_reagents', {
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            const move = payload as any;
            const isRelevantEvent = ['move', 'capture', 'check', 'checkmate', 'promotion'].includes(event);

            if (isRelevantEvent && move && move.piece && move.piece.color === playerId) {
                const isCapture = move.capturedPiece || event === 'capture';
                const isPromotion = move.promotion || event === 'promotion';

                if (isCapture || isPromotion) {
                    game.pieceCooldowns.set(move.piece.id, 2);
                    PactUtils.notifyPactEffect(game, 'alchemist', 'stun', 'malus', 'flask');
                }
            }
        },
        getTurnCounters: (context) => {
            const { game, playerId } = context;
            let maxCooldown = 0;

            game.pieceCooldowns.forEach((cd, id) => {
                if (id.startsWith(playerId) && cd > 0) {
                    if (cd > maxCooldown) maxCooldown = cd;
                }
            });

            if (maxCooldown > 0) {
                return [{
                    id: 'volatile_reagents_counter',
                    label: 'volatile_reagents_cooldown',
                    value: maxCooldown,
                    pactId: 'volatile_reagents',
                    type: 'cooldown'
                }];
            }
            return [];
        }
    })
    .build();

