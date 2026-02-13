import { PactLogic, PactContext, RuleModifiers } from '../PactLogic';
import { Coordinate } from '../../models/Coordinate';
import { GameEvent } from '../../ChessGame';

export class ThiefBonus extends PactLogic {
    id = 'pickpocket';

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if (event === 'move' || event === 'capture') {
            // After any move, check all friendly pawns (belonging to Thief)
            const allSquares = game.board.getAllSquares();
            const friendlyPawns = allSquares.filter(sq =>
                sq.piece?.color === playerId && sq.piece.type === 'pawn'
            );

            friendlyPawns.forEach(pawnSq => {
                const pawn = pawnSq.piece!;
                const neighbors = this.getNeighbors(pawnSq.coordinate);
                neighbors.forEach(neighborCoord => {
                    const targetSq = game.board.getSquare(neighborCoord);
                    // Check for enemy major pieces (Rook/Queen)
                    if (targetSq?.piece && targetSq.piece.color !== playerId) {
                        const targetPiece = targetSq.piece;
                        if (targetPiece.type === 'rook' || targetPiece.type === 'queen') {
                            // Check history to avoid consecutive stuns
                            const historyKey = `pickpocket_${pawn.id}_${targetPiece.id}`;
                            const lastTriggerTurn = game.pactState[historyKey] || -10;

                            // game.totalTurns increments every turn. 
                            // If we stunned at turn N, we want to skip turn N+2 (next player turn)
                            if (game.totalTurns - lastTriggerTurn > 2) {
                                // Only set if not already stunned to avoid refreshing within the same turn cycle
                                if (game.pieceCooldowns.get(targetPiece.id) !== 2) {
                                    game.pieceCooldowns.set(targetPiece.id, 2);
                                    game.pactState[historyKey] = game.totalTurns;

                                    game.emit('pact_effect', {
                                        pactId: this.id,
                                        title: 'pact.toasts.thief.pickpocket.title',
                                        description: 'pact.toasts.thief.pickpocket.desc',
                                        icon: 'hand-coin',
                                        type: 'bonus'
                                    });
                                }
                            }
                        }
                    }
                });
            });
        }
    }

    getRuleModifiers(): RuleModifiers {
        return {}; // Everything is handled in onEvent
    }

    getTurnCounters(context: PactContext): any[] {
        const { game, playerId } = context;
        let stunnedCount = 0;

        game.pieceCooldowns.forEach((cd, id) => {
            // Check if piece belongs to opponent
            if (!id.startsWith(playerId) && cd > 0) {
                stunnedCount++;
            }
        });

        if (stunnedCount > 0) {
            return [{
                id: 'pickpocket_stun_counter',
                label: 'pickpocket_stun_label',
                value: stunnedCount,
                pactId: this.id,
                type: 'counter'
            }];
        }
        return [];
    }

    private getNeighbors(coord: Coordinate): Coordinate[] {
        const neighbors: Coordinate[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                const x = coord.x + dx;
                const y = coord.y + dy;
                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    neighbors.push(new Coordinate(x, y));
                }
            }
        }
        return neighbors;
    }
}

export class ThiefMalus extends PactLogic {
    id = 'wanted';

    getRuleModifiers(): RuleModifiers {
        return {
            getAllowedPromotionTypes: () => {
                // Pawns cannot promote
                return [];
            }
        };
    }
}
