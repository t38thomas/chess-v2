import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';
import { Effects } from '../PactEffects';

const DISPLACE_COOLDOWN = 3;

/**
 * The Illusionist Pact
 * Bonus (Displace): Active ability to move a piece to an adjacent empty square (user choice).
 * Malus (Vanished Illusion): Start the match with a random pawn removed.
 */
export const TheIllusionist = definePact('illusionist')
    .bonus('displace', {
        target: 'self',
        activeAbility: {
            id: 'displace',
            name: 'perks.displace.name',
            description: 'perks.displace.description',
            icon: 'shimmer',
            cooldown: DISPLACE_COOLDOWN,
            targetType: 'square',
            execute: (context, params) => {
                const { game } = context;
                const p = params as { from: Coordinate; to: Coordinate } | undefined;
                if (!p?.from || !p?.to) return false;

                const fromPos = new Coordinate(p.from.x, p.from.y);
                const toPos = new Coordinate(p.to.x, p.to.y);

                const sourceSquare = game.board.getSquare(fromPos);
                const destSquare = game.board.getSquare(toPos);

                if (!sourceSquare?.piece || destSquare?.piece) return false;

                // Check adjacency
                const dx = Math.abs(fromPos.x - toPos.x);
                const dy = Math.abs(fromPos.y - toPos.y);
                if (dx > 1 || dy > 1) return false;

                game.board.movePiece(fromPos, toPos);
                PactUtils.notifyPactEffect(game, 'illusionist', 'displace', 'bonus', 'shimmer');
                return true;
            }
        }
    })
    .malus('vanished_illusion', {
        target: 'self',
        effects: [
            Effects.state.oncePerMatch({
                key: 'vanished_illusion_applied',
                triggerOn: ['phase_change'],
                filter: (event, payload, context) => context.game.phase === 'playing',
                onTrigger: (context) => {
                    const { game } = context;
                    const pawns = context.query.pieces().ofTypes(['pawn']);
                    if (pawns.length > 0) {
                        const victim = PactUtils.pickRandom(pawns, 1)[0];
                        if (victim) {
                            PactUtils.removePiece(game, victim.coord);
                            PactUtils.notifyPactEffect(game, 'illusionist', 'vanished_illusion', 'malus', 'ghost-off');
                        }
                    }
                }
            })
        ]
    })
    .build();


