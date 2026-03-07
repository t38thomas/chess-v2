import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Alchemist Pact
 * Bonus (Transmutation): Active ability to swap two friendly non-king pieces (2 uses, cooldown 2).
 * Malus (Volatile Reagents): Capturing or promoting a piece stuns it for 2 turns.
 */
export const TheAlchemist = definePact('alchemist')
    .bonus('transmutation', {
        icon: 'flask',
        ranking: 3,
        category: 'Action',
        target: 'self',
        activeAbility: {
            id: 'transmutation',
            name: 'transmutation',
            description: 'desc_transmutation',
            icon: 'swap-horizontal',
            maxUses: 2,
            cooldown: 2,
            targetType: 'square',
            maxTargets: 2,
            consumesTurn: true,
            execute: (context, params) => {
                const { game, playerId } = context;
                const p = params as { from: Coordinate; to: Coordinate } | undefined;
                if (!p || !p.from || !p.to) return false;

                const fromCoord = new Coordinate(p.from.x, p.from.y);
                const toCoord = new Coordinate(p.to.x, p.to.y);

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
        icon: 'flask-outline',
        ranking: -2,
        category: 'Other',
        target: 'self',
        onMove: (move, context) => {
            if (move.capturedPiece || move.promotion) {
                // Use domain command instead of direct pieceCooldowns mutation
                context.game.applyCooldown!(move.piece!.id, 2);
                PactUtils.notifyPactEffect(context.game, 'alchemist', 'stun', 'malus', 'flask');
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
