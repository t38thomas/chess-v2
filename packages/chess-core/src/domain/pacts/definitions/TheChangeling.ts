import { PactLogic, RuleModifiers, PactContext, MoveParams } from '../PactLogic';
import { PieceType, Piece } from '../../models/Piece';
import { GameEvent } from '../../ChessGame';
import { Move } from '../../models/Move';
import { MoveGenerator } from '../../rules/MoveGenerator';

export class ChangelingBonus extends PactLogic {
    id = 'mimicry';
    // Map<pieceId, { type: PieceType, expiresAtTurn: number }>
    private activeMimics: Map<string, { type: PieceType, expiresAtTurn: number }> = new Map();

    getRuleModifiers(): RuleModifiers {
        return {
            onGetPseudoMoves: (params: MoveParams) => {
                const mimicData = this.activeMimics.get(params.piece.id);
                if (mimicData) {
                    // Create a phantom piece with the mimicked type
                    const phantomPiece = params.piece.clone();
                    phantomPiece.type = mimicData.type;

                    // Generate moves for the phantom piece
                    // Critical: Filter out 'mimicry' perk to prevent recursion
                    // logic: The MoveGenerator will call this hook again. 
                    // We need to ensure we don't handle it again or MoveGenerator doesn't call it.
                    // MoveGenerator calls RuleEngine.onGetPseudoMoves at the END.
                    // If we call MoveGenerator.getPseudoLegalMoves, it will run standard logic for the NEW type
                    // and then call this hook again.
                    // To avoid infinite loop, we should check if we are already handling this piece/type combination?
                    // Or simpler: Pass empty perks to getPseudoLegalMoves. 
                    // If we pass empty perks, we lose other bonuses (like Flight), but maybe that's acceptable for the mimic turn?
                    // "Assumes the movement of the victim" -> usually implies base movement.
                    // Let's stick to base movement for safety and simplicity.
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
                            // Fix the move's piece reference back to the original by creating a new Move
                            // Since properties are readonly, we must instantiate a new object
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

                    // Duration: Current turn (capture) -> Opponent Move -> My Move (USE IT) -> End of My Move.
                    // So it needs to expire at the end of my NEXT turn.
                    // game.totalTurns is incremented after move execution.
                    // Current turn is T. Next is T+1 (opponent). Next is T+2 (mine).
                    // I want it to expire AFTER T+2. So at Start of T+3? 
                    // Let's set expireAtTurn = game.totalTurns + 2. (Current is N, next mine is N+2).
                    // We check expiration at turn start?

                    this.activeMimics.set(move.piece.id, {
                        type: randomType,
                        expiresAtTurn: game.totalTurns + 2
                    });
                }
            }
        };
    }

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'turn_start') {
            // Clean up expired mimics
            // Context.game.totalTurns is the current turn count.
            for (const [id, data] of this.activeMimics.entries()) {
                if (context.game.totalTurns > data.expiresAtTurn) {
                    this.activeMimics.delete(id);
                }
            }
        }
    }
}

export class ChangelingMalus extends PactLogic {
    id = 'unstable_identity';
    private turnsSinceLastCapture: number = 0;
    private readonly THRESHOLD = 5;

    onEvent(event: GameEvent, payload: any, context: PactContext): void {
        if (event === 'capture') {
            const move = payload as Move;
            if (move.piece.color === context.playerId) {
                this.turnsSinceLastCapture = 0;
            }
        } else if (event === 'turn_start' && payload === context.playerId) {
            // Only increment on my turn start
            this.turnsSinceLastCapture++;

            if (this.turnsSinceLastCapture >= this.THRESHOLD) {
                this.triggerDemotion(context);
                this.turnsSinceLastCapture = 0; // Reset after penalty? Or keep punishing? Description says "perdi un pezzo". usually resets.
            }
        }
    }

    private triggerDemotion(context: PactContext) {
        const board = context.game.board;
        const myPieces = board.getAllSquares()
            .map(s => s.piece)
            .filter(p => p && p.color === context.playerId && p.type !== 'pawn' && p.type !== 'king') as Piece[];

        if (myPieces.length > 0) {
            const victim = myPieces[Math.floor(Math.random() * myPieces.length)];
            victim.type = 'pawn';
            // Optional: visual notification? 
            // context.game.emit('message', `Unstable Identity detected! ${victim.id} became a pawn.`);
        }
    }
}
