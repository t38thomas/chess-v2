import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

export class VoidJumpBonus extends PactLogic {
    id = 'void_jump';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'void_jump',
        name: 'void_jump',
        description: 'desc_void_jump',
        icon: 'swap-vertical-bold',
        targetType: 'square',
        consumesTurn: true,
        execute: (context: PactContext, params?: { from: Coordinate, to: Coordinate }) => {
            const { game, playerId } = context;

            if (!params || !params.from || !params.to) return false;

            const fromCoord = new Coordinate(params.from.x, params.from.y);
            const toCoord = new Coordinate(params.to.x, params.to.y);

            const sq1 = game.board.getSquare(fromCoord);
            const sq2 = game.board.getSquare(toCoord);

            // Validation: Both must be pieces owned by player
            if (!sq1 || !sq2 || !sq1.piece || !sq2.piece) return false;
            if (sq1.piece.color !== playerId || sq2.piece.color !== playerId) return false;

            // Execute Swap
            PactUtils.swapPieces(game, fromCoord, toCoord);

            // Execute Ritual Sacrifice
            // Removes the most advanced piece (excluding King)
            const victim = PactUtils.sacrificeMostAdvancedPiece(game, playerId, []);

            if (victim) {
                game.emit('pact_effect', {
                    pactId: 'ritual_sacrifice', // Using the malus ID here for the toast
                    title: 'pact.toasts.void_jumper.sacrifice.title',
                    description: 'pact.toasts.void_jumper.sacrifice.desc',
                    icon: 'skull',
                    type: 'malus',
                    payload: { victimName: victim.type } // Could be used in dynamic desc if supported
                });
            }

            return true;
        }
    };
}

export class RitualSacrificeMalus extends PactLogic {
    id = 'ritual_sacrifice';
    // Logic is handled in Bonus execute
}
