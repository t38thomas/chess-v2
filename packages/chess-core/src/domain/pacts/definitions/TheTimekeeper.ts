import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Timekeeper Pact
 * Bonus (Time Stop): Once per match, grant yourself an extra turn at the cost of 3 pawns.
 * Malus (Paradox): Associated with the Time Stop cost.
 */
export const TheTimekeeper = definePact('timekeeper')
    .bonus('time_stop', {
        activeAbility: {
            id: 'time_stop',
            name: 'time_stop',
            description: 'desc_time_stop',
            icon: 'clock-stop',
            maxUses: 1,
            targetType: 'none',
            execute: (context) => {
                const { game, playerId } = context;
                game.extraTurns[playerId] = (game.extraTurns[playerId] || 0) + 1;
                PactUtils.notifyPactEffect(game, 'timekeeper', 'time_stop', 'bonus', 'clock-stop');

                const pawns = PactUtils.findPieces(game, playerId, 'pawn');
                const victims = PactUtils.pickRandom(pawns, Math.min(pawns.length, 3));
                victims.forEach(v => PactUtils.removePiece(game, v.coord));

                if (victims.length > 0) {
                    PactUtils.notifyPactEffect(game, 'timekeeper', 'paradox', 'malus', 'nuke');
                }
                return true;
            }
        }
    })
    .malus('paradox', {})
    .build();

