import { PactLogic, PactContext, RuleModifiers, TurnCounter } from '../PactLogic';
import { GameEvent, IChessGame } from '../../GameTypes';
import { PieceColor, PieceType } from '../../models/Piece';
import { PactUtils } from '../PactUtils';

export class BloodlineBonus extends PactLogic {
    id = 'bloodline';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'capture' && payload) {
            const move = payload as any;
            const capturedPiece = move.capturedPiece;

            // If OUR Queen is captured
            if (capturedPiece && capturedPiece.color === playerId && capturedPiece.type === 'queen') {

                // Track if we need to promote a successor
                // We promote a random minor piece: Rook, Bishop, Knight
                const minorPieces = PactUtils.findPiecesByTypes(game, playerId, ['rook', 'bishop', 'knight']);

                if (minorPieces.length > 0) {
                    const [successor] = PactUtils.pickRandom(minorPieces, 1);

                    if (successor) {
                        PactUtils.setPieceType(game, successor.coord, 'queen');

                        // Mark this Queen as NOT initial (so she can capture)
                        const successorKey = `heir_successor_${successor.piece.id}`;
                        game.pactState[successorKey] = true;

                        PactUtils.emitPactEffect(game, {
                            pactId: this.id,
                            title: 'pact.toasts.heir.bloodline.title',
                            description: 'pact.toasts.heir.bloodline.desc',
                            icon: 'crown',
                            type: 'bonus'
                        });
                    }
                }
            }
        }
    }
}

export class YoungQueenMalus extends PactLogic {
    id = 'young_queen';

    getRuleModifiers(): RuleModifiers {
        return {
            canCapture: (game, attacker, victim, to, from) => {
                if (attacker.type === 'queen') {
                    // Check if this is the initial Queen
                    const isSuccessor = game?.pactState[`heir_successor_${attacker.id}`];

                    if (!isSuccessor) {
                        // Young Queen can reach the King (to give check/mate)
                        // but cannot capture any other piece.
                        return victim.type === 'king';
                    }
                }
                return true;
            }
        };
    }

    getTurnCounters(context: PactContext): TurnCounter[] {
        const { game, playerId } = context;

        // Find if there is an active Queen and if she is a successor
        const queens = PactUtils.findPieces(game, playerId, 'queen');

        if (queens.length === 0) return [];

        const isSuccessor = queens.some(q => game.pactState[`heir_successor_${q.piece.id}`]);

        return [{
            id: 'queen_status',
            label: isSuccessor ? 'queen_successor' : 'queen_initial',
            value: isSuccessor ? 100 : 0,
            pactId: this.id,
            type: 'counter'
        }];
    }
}
