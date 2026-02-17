import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Piece } from '../../models/Piece';
import { PactUtils } from '../PactUtils';

export class TimeStopBonus extends PactLogic {
    id = 'time_stop';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'time_stop',
        name: 'time_stop',
        description: 'desc_time_stop',
        icon: 'clock-fast',
        maxUses: 1,
        targetType: 'none',
        execute: (context: PactContext, params: any) => {
            const { game, playerId } = context;

            // 1. Grant extra turn
            game.extraTurns[playerId] = (game.extraTurns[playerId] || 0) + 1;

            PactUtils.emitPactEffect(game, {
                pactId: this.id,
                title: 'pact.toasts.timekeeper.time_stop.title',
                description: 'pact.toasts.timekeeper.time_stop.desc',
                icon: 'clock-stop',
                type: 'bonus'
            });

            // 2. Trigger Paradox (Malus effect) immediately
            this.triggerParadox(context);

            return true;
        }
    };

    private triggerParadox(context: PactContext) {
        const { game, playerId } = context;

        // Find all squares with friendly pawns using PactUtils
        const myPawnDetails = PactUtils.findPieces(game, playerId, 'pawn');
        const myPawnSquares = myPawnDetails.map(d => ({ coordinate: d.coord })); // Adapter for existing structure if needed, or just use coords

        // Select up to 3 random items
        const countToRemove = Math.min(myPawnDetails.length, 3);

        // Use PactUtils.pickRandom
        const victims = PactUtils.pickRandom(myPawnDetails, countToRemove);

        // Remove pieces
        victims.forEach(v => {
            PactUtils.removePiece(game, v.coord);
        });

        if (countToRemove > 0) {
            PactUtils.emitPactEffect(game, {
                pactId: 'paradox',
                title: 'pact.toasts.timekeeper.paradox.title',
                description: 'pact.toasts.timekeeper.paradox.desc',
                icon: 'nuke',
                type: 'malus'
            });
        }
    }
}

export class ParadoxMalus extends PactLogic {
    id = 'paradox';
    // The actual logic is triggered by the Bonus, this class exists for registration and description
}
