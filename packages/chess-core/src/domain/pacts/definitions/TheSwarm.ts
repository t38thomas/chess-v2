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
 * Bonus (Hydra): Spawns a new pawn on the starting rank when one of your pawns is captured (deterministic column). UI counter active.
 * Malus (Hive Queen): If your Queen is captured, you instantly lose the match.
 */
export const TheSwarm = definePact<SwarmBonusState>('swarm')
    .bonus('hydra', {
        icon: 'bacteria',
        ranking: 5,
        category: 'Board Transform',
        target: 'self',
        initialState: () => ({ hydraCount: 0 }),
        onCapture: (params, context) => {
            const victim = params.capturedPiece;
            const { game, playerId } = context;
            if (victim && victim.type === 'pawn' && victim.color === playerId) {
                const rank = playerId === 'white' ? 1 : 6;

                for (let x = 0; x < 8; x++) {
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
        icon: 'crown-circle',
        ranking: -5,
        category: 'King Safety',
        target: 'self',
        effects: [Effects.combat.loseOnPieceCapture('queen', 'death', 'crown', 'swarm')]
    })
    .build();

