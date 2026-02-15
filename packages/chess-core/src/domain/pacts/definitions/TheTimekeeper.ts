import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Piece } from '../../models/Piece';

export class TimeStopBonus extends PactLogic {
    id = 'time_stop';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'time_stop',
        name: 'time_stop',
        description: 'desc_time_stop',
        icon: 'clock-fast',
        maxUses: 1,
        targetType: 'none',
        execute: (context: PactContext) => {
            const { game, playerId } = context;

            // 1. Grant extra turn
            game.extraTurns[playerId] = (game.extraTurns[playerId] || 0) + 1;

            game.emit('pact_effect', {
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
        const board = game.board;

        // Find all squares with friendly pawns
        const myPawnSquares = board.getAllSquares()
            .filter(s => s.piece && s.piece.color === playerId && s.piece.type === 'pawn');

        // Select up to 3 random squares
        const countToRemove = Math.min(myPawnSquares.length, 3);
        const squaresToRemove: any[] = [];

        // Shuffle and pick
        const shuffled = [...myPawnSquares].sort(() => Math.random() - 0.5);
        for (let i = 0; i < countToRemove; i++) {
            squaresToRemove.push(shuffled[i]);
        }

        // Remove pieces from selected squares
        squaresToRemove.forEach(square => {
            // we can use removePiece with coordinate
            if (square && square.coordinate) {
                board.removePiece(square.coordinate);
            }
        });

        if (countToRemove > 0) {
            game.emit('pact_effect', {
                pactId: 'paradox', // Associated with the malus ID
                title: 'pact.toasts.timekeeper.paradox.title',
                description: 'pact.toasts.timekeeper.paradox.desc',
                icon: 'nuke', // or 'alert-decagram'
                type: 'malus'
            });
        }
    }
}

export class ParadoxMalus extends PactLogic {
    id = 'paradox';
    // The actual logic is triggered by the Bonus, this class exists for registration and description
}
