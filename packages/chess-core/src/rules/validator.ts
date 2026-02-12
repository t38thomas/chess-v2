import { GameState, Move, PieceColor } from '../types';
import { getPseudoLegalMoves } from './movement';

export function validateMove(state: GameState, move: Move): boolean {
    // 1. Basic Turn Check
    if (state.turn !== move.piece.color) return false;

    // 2. Pseudo-legal check (does piece move like that?)
    // Optimization: In real engine, we generate moves once. Here for validation:
    // We double check if the `move` is in the list of pseudo-legal moves for that piece.
    // Ideally, UI calls `getMoves` and passes one back.

    // For now, let's assume the UI sends a valid coordinate and we check against generation
    const square = state.board.get(`${move.from.x},${move.from.y}`);
    if (!square) return false;

    const possibleMoves = getPseudoLegalMoves(state.board, square);
    const isValid = possibleMoves.some(m => m.to.x === move.to.x && m.to.y === move.to.y);

    if (!isValid) return false;

    // 3. King Safety (Check)
    // Simulate move, check if king is under attack.
    // Skipped for MVP Step 1 (allow moving into check to first get rendering working)
    return true;
}
