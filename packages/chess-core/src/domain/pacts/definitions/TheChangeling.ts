import { PactLogic, RuleModifiers, PactContext, MoveParams } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { GameEvent } from '../../ChessGame';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';

export class ChangelingBonus extends PactLogic {
    id = 'mimicry';

    private getMimics(context: { game: any }): Map<string, { type: PieceType, expiresAtTurn: number }> {
        if (!context.game || !context.game.pactState) return new Map();

        if (!context.game.pactState.mimicry_activeMimics) {
            context.game.pactState.mimicry_activeMimics = new Map();
        }
        return context.game.pactState.mimicry_activeMimics;
    }

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: (params: MoveParams) => {
                const mimics = this.getMimics({ game: params.game });
                const mimicData = mimics.get(params.piece.id);
                if (mimicData) {
                    // Create a phantom piece with the mimicked type
                    const phantomPiece = params.piece.clone();
                    phantomPiece.type = mimicData.type;

                    // Generate moves for the phantom piece
                    const moves = MoveGenerator.getPseudoLegalMoves(
                        params.board,
                        phantomPiece,
                        params.from,
                        params.game?.enPassantTarget,
                        [] // No perks to avoid recursion
                    );

                    // Add unique moves to the main list
                    moves.forEach(m => {
                        // Ensure we don't duplicate existing moves if any
                        if (!params.moves.some(existing => existing.to.equals(m.to))) {
                            const correctedMove = new Move(
                                m.from,
                                m.to,
                                params.piece,
                                m.capturedPiece,
                                m.isCastling,
                                m.isEnPassant,
                                m.isSwap,
                                m.promotion
                            );
                            params.moves.push(correctedMove);
                        }
                    });
                }
            },
            onExecuteMove: (game, move) => {
                // If it's a pawn capture, trigger mimicry
                if (move.piece.type === 'pawn' && move.capturedPiece) {
                    const possibleTypes: PieceType[] = ['rook', 'knight', 'bishop', 'queen', 'king'];
                    const randomType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];

                    const mimics = this.getMimics({ game });
                    mimics.set(move.piece.id, {
                        type: randomType,
                        expiresAtTurn: game.totalTurns + 2
                    });
                }
            }
        };
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'turn_start') {
            const mimics = this.getMimics(context);
            // Clean up expired mimics
            for (const [id, data] of mimics.entries()) {
                if (context.game.totalTurns > data.expiresAtTurn) {
                    mimics.delete(id);
                }
            }
        }
    }
}

export class ChangelingMalus extends PactLogic {
    id = 'unstable_identity';
    private readonly THRESHOLD = 5;

    private getTurnsSinceCapture(context: PactContext): number {
        const key = `unstable_identity_${context.playerId}`;
        return context.game.pactState[key] || 0;
    }

    private setTurnsSinceCapture(context: PactContext, value: number) {
        const key = `unstable_identity_${context.playerId}`;
        context.game.pactState[key] = value;
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'capture') {
            const move = payload as Move;
            if (move.piece.color === context.playerId) {
                this.setTurnsSinceCapture(context, 0);
            }
        } else if (event === 'turn_start' && payload === context.playerId) {
            // Only increment on my turn start
            let turns = this.getTurnsSinceCapture(context);
            turns++;
            this.setTurnsSinceCapture(context, turns);

            if (turns >= this.THRESHOLD) {
                this.triggerDemotion(context);
                this.setTurnsSinceCapture(context, 0); // Reset after penalty
            }
        }
    }

    getTurnCounters(context: PactContext): any[] {
        const val = this.getTurnsSinceCapture(context);
        return [{
            id: 'unstable_identity_counter',
            label: 'unstable_identity_progress',
            value: val,
            pactId: this.id,
            type: 'counter',
            maxValue: this.THRESHOLD,
            subLabel: `${val}/${this.THRESHOLD}`
        }];
    }

    private triggerDemotion(context: PactContext) {
        const board = context.game.board;
        const myPieces = board.getAllSquares()
            .map(s => s.piece)
            .filter(p => p && p.color === context.playerId && p.type !== 'pawn' && p.type !== 'king') as Piece[];

        if (myPieces.length > 0) {
            const victim = myPieces[Math.floor(Math.random() * myPieces.length)];
            victim.type = 'pawn';
        }
    }
}
