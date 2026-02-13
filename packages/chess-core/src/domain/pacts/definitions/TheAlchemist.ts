import { PactLogic, ActiveAbilityConfig, PactContext, RuleModifiers } from '../PactLogic';
import { GameEvent } from '../../ChessGame';
import { Coordinate } from '../../models/Coordinate';
import { PieceColor, PieceType } from '../../models/Piece';

export class AlchemistBonus extends PactLogic {
    id = 'transmutation';

    readonly activeAbility: ActiveAbilityConfig = {
        id: 'transmutation',
        name: 'transmutation',
        description: 'desc_transmutation',
        icon: 'swap-horizontal',
        maxUses: 1,
        targetType: 'square', // Actually used for target picking in UI, but we expect from/to in params
        consumesTurn: true,
        execute: (context: PactContext, params?: { from: Coordinate, to: Coordinate }) => {
            const { game, playerId } = context;

            // If params are missing or incomplete, we can't execute.
            // In a real UI, we might need a two-step process.
            if (!params || !params.from || !params.to) return false;

            const fromCoord = new Coordinate(params.from.x, params.from.y);
            const toCoord = new Coordinate(params.to.x, params.to.y);

            const sq1 = game.board.getSquare(fromCoord);
            const sq2 = game.board.getSquare(toCoord);

            if (!sq1 || !sq2 || !sq1.piece || !sq2.piece) return false;

            // Both pieces must belong to the player
            if (sq1.piece.color !== playerId || sq2.piece.color !== playerId) return false;

            // Cannot swap King
            if (sq1.piece.type === 'king' || sq2.piece.type === 'king') return false;

            // Swap pieces
            const p1 = sq1.piece;
            const p2 = sq2.piece;

            game.board.removePiece(fromCoord);
            game.board.removePiece(toCoord);

            game.board.placePiece(fromCoord, p2);
            game.board.placePiece(toCoord, p1);

            return true;
        }
    };
}

export class AlchemistMalus extends PactLogic {
    id = 'volatile_reagents';

    getRuleModifiers(): RuleModifiers {
        return {
            canMovePiece: (game, from) => {
                const square = game.board.getSquare(from);
                if (square && square.piece) {
                    const cooldown = game.pieceCooldowns.get(square.piece.id);
                    if (cooldown && cooldown > 0) return false;
                }
                return true;
            }
        };
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        const { game, playerId } = context;

        if ((event === 'capture' || event === 'promotion') && payload) {
            const move = payload as any;
            // Check if the piece that moved (the attacker) belongs to the Alchemist player
            if (move.piece && move.piece.color === playerId && (event === 'promotion' || move.capturedPiece)) {
                // The capturing piece is stunned for 1 full turn cycle.
                // We set it to 2 because it's decremented at the start of the Alchemist's turn.
                // Turn N: Capture -> stun = 2
                // Start of Turn N+1: stun = 1 (piece cannot move)
                // Start of Turn N+2: stun = 0 (piece can move)
                game.pieceCooldowns.set(move.piece.id, 2);

                game.emit('pact_effect', {
                    pactId: this.id,
                    title: 'pact.toasts.alchemist.stun.title',
                    description: 'pact.toasts.alchemist.stun.desc',
                    icon: 'flask',
                    type: 'malus'
                });
            }
        }

        // Handle turn start to decrement cooldowns
        if (event === ('turn_start' as GameEvent)) {
            const currentTurnPlayer = payload as PieceColor;
            if (currentTurnPlayer === playerId) {
                // It's the Alchemist's turn. Decrement cooldowns for their pieces.
                game.pieceCooldowns.forEach((cd, id) => {
                    if (cd > 0 && id.startsWith(playerId)) {
                        game.pieceCooldowns.set(id, cd - 1);
                    }
                });
            }
        }
    }

    getTurnCounters(context: PactContext): any[] {
        const { game, playerId } = context;
        let maxCooldown = 0;

        game.pieceCooldowns.forEach((cd, id) => {
            if (id.startsWith(playerId) && cd > 0) {
                if (cd > maxCooldown) maxCooldown = cd;
            }
        });

        if (maxCooldown > 0) {
            return [{
                id: 'volatile_reagents_counter',
                label: 'volatile_reagents_cooldown',
                value: maxCooldown,
                pactId: this.id,
                type: 'cooldown'
            }];
        }
        return [];
    }
}
