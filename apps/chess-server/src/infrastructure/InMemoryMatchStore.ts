import { Match } from '../domain/Match';

export class InMemoryMatchStore {
    private matches: Map<string, Match> = new Map();
    private joinCodeIndex: Map<string, string> = new Map(); // joinCode -> matchId

    constructor(private cleanupIntervalMs: number = 60000, private matchTtlMs: number = 30 * 60 * 1000) {
        setInterval(() => this.cleanup(), this.cleanupIntervalMs);
    }

    async save(match: Match): Promise<void> {
        this.matches.set(match.id, match);
        this.joinCodeIndex.set(match.joinCode, match.id);
    }

    async get(matchId: string): Promise<Match | undefined> {
        return this.matches.get(matchId);
    }

    async getByJoinCode(joinCode: string): Promise<Match | undefined> {
        const matchId = this.joinCodeIndex.get(joinCode);
        if (!matchId) return undefined;
        return this.matches.get(matchId);
    }

    async delete(matchId: string): Promise<void> {
        const match = this.matches.get(matchId);
        if (match) {
            this.joinCodeIndex.delete(match.joinCode);
            this.matches.delete(matchId);
        }
    }

    private cleanup() {
        const now = Date.now();
        for (const [id, match] of this.matches) {
            if (now - match.lastActivity > this.matchTtlMs) {
                console.log(`Cleaning up inactive match ${id}`);
                this.delete(id);
            }
        }
    }
}
