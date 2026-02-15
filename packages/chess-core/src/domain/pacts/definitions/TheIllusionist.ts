import { PactLogic, PactContext, TurnCounter, ActiveAbilityConfig } from '../PactLogic';
import { GameEvent } from '../../GameTypes';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

const DISPLACE_COOLDOWN = 3;

export class IllusionistBonus extends PactLogic {
    id = 'displace';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'displace',
        name: 'perks.displace.name',
        description: 'perks.displace.description',
        icon: 'shimmer',
        cooldown: DISPLACE_COOLDOWN,
        targetType: 'piece',
        maxTargets: 1,
        execute: (context: PactContext, targetPos: Coordinate) => {
            const { game } = context;

            // Get piece at target position
            const targetSquare = game.board.getSquare(targetPos);
            if (!targetSquare || !targetSquare.piece) return false;

            // Find adjacent empty squares
            const adjacentSquares: Coordinate[] = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;

                    const nextCoord = new Coordinate(targetPos.x + dx, targetPos.y + dy);
                    if (nextCoord.isValid()) {
                        const sq = game.board.getSquare(nextCoord);
                        if (sq && !sq.piece) {
                            adjacentSquares.push(nextCoord);
                        }
                    }
                }
            }

            if (adjacentSquares.length === 0) {
                // No adjacent empty squares, ability fails
                return false;
            }

            // Pick a random adjacent square
            const destination = PactUtils.pickRandom(adjacentSquares, 1)[0];

            // Move the piece
            game.board.movePiece(targetPos, destination);

            // Trigger effect
            PactUtils.emitPactEffect(game, {
                pactId: this.id,
                title: 'perks.displace.name',
                description: 'pact.toasts.illusionist.displace.triggered',
                icon: 'shimmer',
                type: 'bonus'
            });

            return true;
        }
    };
}

export class IllusionistMalus extends PactLogic {
    id = 'vanished_illusion';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        // Trigger at the start of the game (phase change setup -> playing)
        if (event === 'phase_change' && context.game.phase === 'playing') {
            this.applyMalus(context);
        }
    }

    private applyMalus(context: PactContext) {
        const { game, playerId } = context;
        const stateKey = this.id + '_applied_' + playerId;

        // Check if already applied to avoid duplicates
        if (game.pactState[stateKey]) return;

        const pawns = PactUtils.findPieces(game, playerId, 'pawn');
        if (pawns.length === 0) return;

        const victim = PactUtils.pickRandom(pawns, 1)[0];
        if (victim) {
            PactUtils.removePiece(game, victim.coord);

            PactUtils.emitPactEffect(game, {
                pactId: this.id,
                title: 'perks.vanished_illusion.name',
                description: 'pact.toasts.illusionist.vanished_illusion.desc',
                icon: 'ghost-off',
                type: 'malus'
            });

            game.pactState[stateKey] = true;
        }
    }
}
