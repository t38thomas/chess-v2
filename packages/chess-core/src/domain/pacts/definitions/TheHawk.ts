import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Hawk Pact
 * Bonus (High Flyer): Bishops can jump over friendly pieces. Jumping over a piece unlocks adjacent captures this turn.
 * Malus (Distant Predator): Bishops cannot capture adjacent pieces unless they just jumped over a piece.
 */
export const TheHawk = definePact('hawk')
    .bonus('high_flyer', {
        target: 'self',
        effects: [Effects.movement.canMoveThroughFriendlies('bishop')],
        onMove: (move, context) => {
            if (move.piece.type !== 'bishop' || move.piece.color !== context.playerId) return;

            const dx = Math.sign(move.to.x - move.from.x);
            const dy = Math.sign(move.to.y - move.from.y);
            let curX = move.from.x + dx;
            let curY = move.from.y + dy;
            let jumped = false;

            while (curX !== move.to.x || curY !== move.to.y) {
                if (context.game.board.getSquare(new Coordinate(curX, curY))?.piece) {
                    jumped = true;
                    break;
                }
                curX += dx;
                curY += dy;
            }

            if (jumped) {
                context.updateState({ jumpedThisTurn: true });
                PactUtils.notifyPactEffect(context.game, 'hawk', 'high_flyer_boost', 'bonus', 'wing');
            } else {
                context.updateState({ jumpedThisTurn: false });
            }
        }
    })
    .malus('distant_predator', {
        target: 'self',
        modifiers: {
            canCapture: (params, context) => {
                if (params.attacker.type !== 'bishop') return true;
                const dx = Math.abs(params.to.x - params.from.x);
                const dy = Math.abs(params.to.y - params.from.y);

                if (dx <= 1 && dy <= 1) {
                    const sharedState = context.getSiblingState<any>() || {};
                    return !!sharedState['jumpedThisTurn'];
                }
                return true;
            }
        },
        getTurnCounters: (context) => {
            const sharedState = context.getSiblingState<any>() || {};
            if (sharedState['jumpedThisTurn']) {
                return [{
                    id: 'hawk_boost',
                    label: 'claws_ready',
                    value: 1,
                    pactId: 'hawk',
                    type: 'counter',
                }];
            }
            return [];
        }
    })
    .build();

