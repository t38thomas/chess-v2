import { definePact } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { PactUtils } from '../PactUtils';

const DISPLACE_COOLDOWN = 3;

/**
 * The Illusionist Pact
 * Bonus (Displace): Active ability to move an adjacent empty square.
 * Malus (Vanished Illusion): Lose a random pawn at the start of the game.
 */
export const TheIllusionist = definePact('illusionist')
    .bonus('displace', {
        activeAbility: {
            id: 'displace',
            name: 'perks.displace.name',
            description: 'perks.displace.description',
            icon: 'shimmer',
            cooldown: DISPLACE_COOLDOWN,
            targetType: 'piece',
            maxTargets: 1,
            execute: (context, targetPos) => {
                const { game } = context;
                const targetSquare = game.board.getSquare(targetPos);
                if (!targetSquare?.piece) return false;

                const adjacentSquares: Coordinate[] = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nextCoord = new Coordinate(targetPos.x + dx, targetPos.y + dy);
                        if (nextCoord.isValid()) {
                            const sq = game.board.getSquare(nextCoord);
                            if (sq && !sq.piece) adjacentSquares.push(nextCoord);
                        }
                    }
                }

                if (adjacentSquares.length === 0) return false;

                const destination = PactUtils.pickRandom(adjacentSquares, 1)[0];
                game.board.movePiece(targetPos, destination);
                PactUtils.notifyPactEffect(game, 'illusionist', 'displace', 'bonus', 'shimmer');
                return true;
            }
        }
    })
    .malus('vanished_illusion', {
        onEvent: (event, payload, context) => {
            const { game, playerId } = context;
            if (event === 'phase_change' && game.phase === 'playing') {
                const stateKey = `vanished_illusion_applied_${playerId}`;
                if (game.pactState[stateKey]) return;

                const pawns = PactUtils.findPieces(game, playerId, 'pawn');
                if (pawns.length > 0) {
                    const victim = PactUtils.pickRandom(pawns, 1)[0];
                    if (victim) {
                        PactUtils.removePiece(game, victim.coord);
                        PactUtils.notifyPactEffect(game, 'illusionist', 'vanished_illusion', 'malus', 'ghost-off');
                        game.pactState[stateKey] = true;
                    }
                }
            }
        }
    })
    .build();

