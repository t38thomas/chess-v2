import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

/**
 * The Swarm Pact
 * Bonus (Hydra): Spawns a new pawn on the starting rank when one of your pawns is captured.
 * Malus (Hive Queen): If your Queen is captured, you instantly lose the match.
 */
export const TheSwarm = definePact('swarm')
    .bonus('hydra', {
        onMove: (move, context) => {
            if (move.capturedPiece) {
                const { game, playerId } = context;
                const capturedPiece = move.capturedPiece;
                if (capturedPiece?.type === 'pawn' && capturedPiece.color === playerId) {
                    const rank = playerId === 'white' ? 1 : 6;
                    const cols = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
                    for (const x of cols) {
                        const coord = new Coordinate(x, rank);
                        if (!game.board.getSquare(coord)?.piece) {
                            const id = `${playerId}-pawn-hydra-${Date.now()}-${x}`;
                            game.board.placePiece(coord, new Piece('pawn', playerId, id));
                            PactUtils.notifyPactEffect(game, 'swarm', 'spawn', 'bonus', 'auto-fix');
                            break;
                        }
                    }
                }
            }
        }
    })
    .malus('hive_queen', {
        effects: [Effects.combat.loseOnPieceCapture('queen', 'death', 'crown', 'swarm')]
    })
    .build();

