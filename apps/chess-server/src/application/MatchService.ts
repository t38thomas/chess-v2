import { v4 as uuidv4 } from 'uuid';
import { InMemoryMatchStore } from '../infrastructure/InMemoryMatchStore';
import { Match, createMatch } from '../domain/Match';
import { Action, GameEngine } from '../domain/GameEngine';

export class MatchService {
    constructor(private store: InMemoryMatchStore) { }

    async createMatch(variantConfig?: Record<string, unknown>): Promise<Match> {
        const id = uuidv4();
        const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const match = createMatch(id, joinCode, variantConfig);
        await this.store.save(match);
        return match;
    }

    async getMatch(id: string): Promise<Match | undefined> {
        return this.store.get(id);
    }

    async getMatchByJoinCode(joinCode: string): Promise<Match | undefined> {
        return this.store.getByJoinCode(joinCode);
    }

    async applyAction(matchId: string, action: Action): Promise<void> {
        const match = await this.store.get(matchId);
        if (!match) throw new Error("Match not found");

        GameEngine.applyAction(match, action);
        match.lastActivity = Date.now();
        await this.store.save(match);
    }

    async joinMatch(matchId: string, playerId: string, username: string): Promise<Match> {
        const match = await this.store.get(matchId);
        if (!match) throw new Error("Match not found");

        if (match.players.length >= 2 && !match.players.find(p => p.id === playerId)) {
            throw new Error("Match is full");
        }

        const existingPlayer = match.players.find(p => p.id === playerId);
        if (!existingPlayer) {
            const color = match.players.length === 0 ? 'white' : 'black';
            match.players.push({
                id: playerId,
                username,
                color,
                isConnected: true,
                lastActivity: Date.now(),
            });
        }

        match.lastActivity = Date.now();
        await this.store.save(match);
        return match;
    }
}
