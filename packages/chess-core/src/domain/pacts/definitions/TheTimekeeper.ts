import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Timekeeper Pact
 * Bonus (Time Stop): Once per match, grant yourself an extra turn at the cost of 3 specific pawns (deterministic). UI counter active.
 * Malus (Paradox): Associated with the Time Stop cost.
 */
export const TheTimekeeper = definePact<{}, {}>('timekeeper')
    .bonus('time_stop', {
        icon: 'clock-remove',
        ranking: 5,
        category: 'Action',
        activeAbility: {
            id: 'time_stop',
            name: 'time_stop',
            description: 'desc_time_stop',
            icon: 'clock-fast',
            maxUses: 1,
            targetType: 'none',
            execute: (context) => {
                const { game, playerId } = context;
                game.grantExtraTurn!(playerId, 1);
                PactUtils.notifyPactEffect(game, 'timekeeper', 'time_stop', 'bonus', 'clock-stop');

                const pawns = context.query.pieces().ofTypes(['pawn']);
                const victims = [...pawns].sort((a, b) => {
                    const dy = playerId === 'white' ? a.coord.y - b.coord.y : b.coord.y - a.coord.y;
                    if (dy !== 0) return dy;
                    return a.coord.x - b.coord.x;
                }).slice(0, 3);
                victims.forEach(v => PactUtils.removePiece(game, v.coord));

                if (victims.length > 0) {
                    PactUtils.notifyPactEffect(game, 'timekeeper', 'paradox', 'malus', 'nuke');
                }
                return true;
            }
        }
    })
    .malus('paradox', {
        icon: 'infinity',
        ranking: -4,
        category: 'Board Transform',
    })
    .build();
