import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Necromancer Pact
 * Bonus (Reclaimer): Active ability to resurrect the last captured friendly piece (any except Queen). Cooldown: 5 turns.
 * Malus (Ascension Cost): When you promote a piece, your opponent gets an extra turn.
 */
export const TheNecromancer = definePact('necromancer')
    .bonus('reclaimer', {
        icon: 'refresh',
        ranking: 5,
        category: 'Action',
        target: 'self',
        activeAbility: {
            id: 'reclaimer',
            name: 'reclaimer',
            description: 'desc_reclaimer',
            icon: 'refresh',
            cooldown: 5,
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
                PactUtils.notifyPactEffect(game, 'necromancer', 'reclaimer', 'bonus', 'refresh');
                return true;
            }
        }
    })
    .malus('ascension_cost', {
        icon: 'currency-usd',
        ranking: -4,
        category: 'Turn Economy',
        target: 'self',
        modifiers: {
            modifyNextTurn: (params, context) => {
                if (params.eventType === 'promotion') {
                    const opponentColor = context.playerId === 'white' ? 'black' : 'white';
                    // Use domain command instead of direct mutation of game.extraTurns
                    params.game.grantExtraTurn!(opponentColor, 1);
                    PactUtils.notifyPactEffect(params.game, 'necromancer', 'ascension_cost', 'malus', 'trending-up');
                }
                return null;
            }
        }
    })
    .build();



