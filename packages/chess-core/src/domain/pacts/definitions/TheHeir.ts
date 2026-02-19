import { definePact } from '../PactLogic';
import { PactUtils } from '../PactUtils';

/**
 * The Heir Pact
 * Bonus (Bloodline): When your Queen is captured, a random minor piece is promoted to a new Queen.
 * Malus (Young Queen): Initial Queen cannot capture any piece except the King. Successor Queens have no such restriction.
 */
export const TheHeir = definePact('heir')
    .bonus('bloodline', {
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            if (event === 'capture' && payload) {
                const capturedPiece = (payload as any).capturedPiece;
                if (capturedPiece?.color === playerId && capturedPiece.type === 'queen') {
                    const minorPieces = PactUtils.findPiecesByTypes(game, playerId, ['rook', 'bishop', 'knight']);
                    if (minorPieces.length > 0) {
                        const [successor] = PactUtils.pickRandom(minorPieces, 1);
                        if (successor) {
                            PactUtils.promotePiece(game, successor.coord, 'queen');
                            game.pactState[`heir_successor_${successor.piece.id}`] = true;

                            PactUtils.notifyPactEffect(game, 'heir', 'bloodline', 'bonus', 'crown');
                        }
                    }
                }
            }
        }
    })
    .malus('young_queen', {
        modifiers: {
            canCapture: (game, attacker, victim) => {
                if (attacker.type === 'queen') {
                    const isSuccessor = game?.pactState[`heir_successor_${attacker.id}`];
                    if (!isSuccessor) return victim.type === 'king';
                }
                return true;
            }
        },
        getTurnCounters: (context) => {
            const { game, playerId } = context;
            const queens = PactUtils.findPieces(game, playerId, 'queen');
            if (queens.length === 0) return [];
            const isSuccessor = queens.some(q => game.pactState[`heir_successor_${q.piece.id}`]);
            return [{
                id: 'queen_status',
                label: isSuccessor ? 'queen_successor' : 'queen_initial',
                value: isSuccessor ? 100 : 0,
                pactId: 'heir',
                type: 'counter'
            }];
        }
    })
    .build();

