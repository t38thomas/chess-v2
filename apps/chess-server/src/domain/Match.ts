import { Player } from './Player';
import { ChessGame, PieceColor, DEFAULT_MATCH_CONFIG } from 'chess-core';

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

    variantConfig: Record<string, unknown>;
    createdAt: number;
    lastActivity: number;
}

export const MAX_PLAYERS = 2;

export function createMatch(id: string, joinCode: string, variantConfig?: Record<string, unknown>): Match {
    const config = {
        ...DEFAULT_MATCH_CONFIG,
        ...(variantConfig?.matchConfig || {})
    };

    if (!config.seed) {
        config.seed = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const game = new ChessGame(config);

    return {
        id,
        joinCode,
        players: [],
        spectators: [],
        game,
        variantConfig: { ...variantConfig, matchConfig: config },
        createdAt: Date.now(),
        lastActivity: Date.now(),
    };
}
