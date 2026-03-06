import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Necromancer Pact
 * Bonus (Reclaimer): Active ability to resurrect the last captured piece at its starting square (once).
 * Malus (Ascension Cost): When you promote a piece, your opponent gets an extra turn.
 */
export const TheNecromancer = definePact('necromancer')
    .bonus('reclaimer', {
        activeAbility: {
            id: 'reclaimer',
            name: 'reclaimer',
            description: 'desc_reclaimer',
            icon: 'refresh',
            maxUses: 1,
            targetType: 'none',
            execute: (context) => {
                const { game, playerId } = context;
                let lostPiece = null;
                for (let i = game.history.length - 1; i >= 0; i--) {
                    const move = game.history[i];
                    if (move.capturedPiece?.color === playerId) {
                        lostPiece = move.capturedPiece;
                        break;
                    }
                }

                if (!lostPiece) return false;

                const startSquare = PactUtils.getEmptyStartingSquare(game, lostPiece.type, lostPiece.color);
                if (!startSquare) return false;

                game.board.placePiece(startSquare, lostPiece);
                return true;
            }
        }
    })
    .malus('ascension_cost', {
        modifiers: {
            modifyNextTurn: (params, context) => {
                if (params.eventType === 'promotion') {
                    const opponent = params.currentTurn === 'white' ? 'black' : 'white';
                    params.game.extraTurns[opponent] = (params.game.extraTurns[opponent] || 0) + 1;
                    PactUtils.notifyPactEffect(params.game, 'necromancer', 'cost', 'malus', 'trending-up');
                }
                return null;
            }
        }
    })
    .build();

