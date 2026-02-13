import { PactLogic, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Piece, PieceColor } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';

export class SwarmBonus extends PactLogic {
    id = 'hydra';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'capture' && payload) {
            const { game, playerId } = context;
            // Payload is the Move object
            const move = payload as any; // Cast to avoid circular import issues if Move isn't imported, but assuming payload implies Move structure
            const capturedPiece: Piece = move.capturedPiece;

            // Check if it was OUR pawn that died
            if (capturedPiece && capturedPiece.type === 'pawn' && capturedPiece.color === playerId) {
                // Spawn new pawn
                this.spawnPawn(game, playerId);
            }
        }
    }

    private spawnPawn(game: any, color: PieceColor) {
        const rank = color === 'white' ? 1 : 6;

        // Find empty square on starting rank
        const cols = [0, 1, 2, 3, 4, 5, 6, 7];
        // Shuffle cols for randomness
        this.shuffleArray(cols);

        for (const x of cols) {
            const coord = new Coordinate(x, rank);
            const square = game.board.getSquare(coord);
            if (square && !square.piece) {
                // Spawn!
                // Need unique ID.
                const id = `${color}-pawn-hydra-${Date.now()}-${x}`;
                const newPawn = new Piece('pawn', color, id);
                game.board.placePiece(coord, newPawn);
                game.emit('ability_activated', { abilityId: this.id, playerId: color });
                game.emit('pact_effect', {
                    pactId: this.id,
                    title: 'pact.toasts.swarm.spawn.title',
                    description: 'pact.toasts.swarm.spawn.desc',
                    icon: 'auto-fix',
                    type: 'bonus'
                });
                break;
            }
        }
    }

    private shuffleArray(array: number[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

export class SwarmMalus extends PactLogic {
    id = 'hive_queen';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'capture' && payload) {
            const { game, playerId } = context;
            const move = payload as any;
            const capturedPiece: Piece = move.capturedPiece;

            if (capturedPiece && capturedPiece.type === 'queen' && capturedPiece.color === playerId) {
                // Hive Queen died. Instant Loss.
                game.status = 'checkmate';
                game.emit('pact_effect', {
                    pactId: this.id,
                    title: 'pact.toasts.swarm.death.title',
                    description: 'pact.toasts.swarm.death.desc',
                    icon: 'crown',
                    type: 'malus'
                });
                // Setting status to checkmate triggers game over logic.
            }
        }
    }
}
