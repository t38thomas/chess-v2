import { definePact } from '../PactLogic';
import { Effects } from '../PactEffects';
import { Piece } from '../../models/Piece';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

interface SwarmBonusState {
    hydraCount: number;
}

/**
 * The Swarm Pact
 * Bonus (Hydra): Spawns a new pawn on the starting rank when one of your pawns is captured.
 * Malus (Hive Queen): If your Queen is captured, you instantly lose the match.
 */
export const TheSwarm = definePact<SwarmBonusState>('swarm')
    .bonus('hydra', {
        target: 'self',
        initialState: () => ({ hydraCount: 0 }),
        onCapture: (params, context) => {
            const victim = params.capturedPiece;
            const { game, playerId } = context;
            if (victim && victim.type === 'pawn' && victim.color === playerId) {
                const rank = playerId === 'white' ? 1 : 6;
                // Build list of empty columns in random order using game.rng for determinism
                const rng = game.rng ?? Math.random;
                const cols = [0, 1, 2, 3, 4, 5, 6, 7];
                // Fisher-Yates shuffle using game.rng
                for (let i = cols.length - 1; i > 0; i--) {
                    const j = Math.floor(rng() * (i + 1));
                    [cols[i], cols[j]] = [cols[j], cols[i]];
                }

                for (const x of cols) {
                    const coord = new Coordinate(x, rank);
                    if (!game.board.getSquare(coord)?.piece) {
                        // Use pactState counter for a deterministic, serializable ID
                        const count = (context.state.hydraCount ?? 0) + 1;
                        context.updateState({ hydraCount: count });
                        const id = `${playerId}-pawn-hydra-${count}`;
                        game.board.placePiece(coord, new Piece('pawn', playerId, id));
                        PactUtils.notifyPactEffect(game, 'swarm', 'hydra', 'bonus', 'auto-fix');
                        break;
                    }
                }
            }
        }
    })

    .malus('hive_queen', {
        target: 'self',
        effects: [Effects.combat.loseOnPieceCapture('queen', 'death', 'crown', 'swarm')]
    })
    .build();

