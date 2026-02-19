import { definePact } from '../PactLogic';

/**
 * The Hawk Pact
 * Bonus (High Flyer): Bishops can jump over friendly pieces.
 * Malus (Distant Predator): Bishops cannot capture adjacent pieces.
 */
export const TheHawk = definePact('hawk')
    .bonus('high_flyer', {
        modifiers: {
            canMoveThroughFriendlies: (mover, obstacle) => {
                return mover.type === 'bishop' && mover.color === obstacle.color;
            }
        }
    })
    .malus('distant_predator', {
        modifiers: {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type === 'bishop') {
                    const dx = Math.abs(to.x - from.x);
                    const dy = Math.abs(to.y - from.y);
                    if (dx === 1 && dy === 1) return false;
                }
                return true;
            }
        }
    })
    .build();

