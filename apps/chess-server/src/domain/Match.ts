import { Player } from './Player';
import { ChessGame, PieceColor } from 'chess-core';

export interface SerializedGameState {
    status: 'active' | 'finished';
    turn: PieceColor;
    whiteKing: { x: number, y: number };
    blackKing: { x: number, y: number };
}

export interface Match {
    id: string;
    joinCode: string;
    players: Player[];
    spectators: Player[];

    game: ChessGame;

    // We can keep a separated state object if needed for serialization or API response 
    // that doesn't map 1:1 to ChessGame, but ideally we use ChessGame properties.
    // For now, let's keep it minimal.
    // state: SerializedGameState; // REMOVED in favor of game.status / game.turn

    variantConfig: Record<string, unknown>;
    createdAt: number;
    lastActivity: number;
}

export const MAX_PLAYERS = 2;

export function createMatch(id: string, joinCode: string, variantConfig?: Record<string, unknown>): Match {
    const game = new ChessGame();
    // game.reset(); // Initial setup done in constructor

    return {
        id,
        joinCode,
        players: [],
        spectators: [],
        game,
        variantConfig: variantConfig || {},
        createdAt: Date.now(),
        lastActivity: Date.now(),
    };
}
