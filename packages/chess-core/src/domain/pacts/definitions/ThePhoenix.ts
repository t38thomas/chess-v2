import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';

export class PhoenixBonus extends PactLogic {
    id = 'rebirth';

    getRuleModifiers(): RuleModifiers {
        return {};
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'capture' && payload) {
            const move = payload as any;
            const capturedPiece = move.capturedPiece;

            // If the captured piece is OUR Queen
            if (capturedPiece && capturedPiece.color === playerId && capturedPiece.type === 'queen') {

                // Check if already used
                const stateKey = `phoenix_rebirth_used_${playerId}`;
                if (game.pactState[stateKey]) return;

                // Find all friendly pawns
                const myPawns = game.board.getAllSquares()
                    .filter(s => s.piece && s.piece.color === playerId && s.piece.type === 'pawn')
                    .map(s => s.coordinate);

                if (myPawns.length > 0) {
                    // Pick a random pawn
                    const randomIndex = Math.floor(Math.random() * myPawns.length);
                    const pawnCoord = myPawns[randomIndex];
                    const square = game.board.getSquare(pawnCoord);

                    if (square && square.piece) {
                        // Promote to Queen
                        square.piece.type = 'queen';

                        // Mark as used
                        game.pactState[stateKey] = true;

                        // Notification
                        game.emit('pact_effect', {
                            pactId: this.id,
                            title: 'pact.toasts.phoenix.rebirth.title',
                            description: 'pact.toasts.phoenix.rebirth.desc',
                            icon: 'fire',
                            type: 'bonus'
                        });
                    }
                }
            }
        }
    }
}

export class PhoenixMalus extends PactLogic {
    id = 'wingless';

    // Remove rooks immediately when assigned
    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'pact_assigned') {
            const rooks = game.board.getAllSquares()
                .filter(s => s.piece && s.piece.color === playerId && s.piece.type === 'rook')
                .map(s => s.coordinate);

            for (const coord of rooks) {
                game.board.removePiece(coord);
            }
        }
    }
}
