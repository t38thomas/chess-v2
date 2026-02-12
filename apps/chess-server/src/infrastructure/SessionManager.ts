import { v4 as uuidv4 } from 'uuid';

interface Session {
    playerId: string;
    username?: string;
    matchId?: string; // If they were in a match
    createdAt: number;
    lastSeen: number;
}

export class SessionManager {
    private sessions: Map<string, Session> = new Map();

    constructor(private sessionTtlMs: number = 2 * 60 * 1000) { // 2 minutes reconnection window
        setInterval(() => this.cleanup(), 60000);
    }

    createSession(playerId: string, username?: string, matchId?: string): string {
        const token = uuidv4();
        this.sessions.set(token, {
            playerId,
            username,
            matchId,
            createdAt: Date.now(),
            lastSeen: Date.now()
        });
        return token;
    }

    getSession(token: string): Session | undefined {
        const session = this.sessions.get(token);
        if (session) {
            session.lastSeen = Date.now(); // Refresh
            return session;
        }
        return undefined;
    }

    updateSession(token: string, data: Partial<Session>) {
        const session = this.sessions.get(token);
        if (session) {
            Object.assign(session, data);
            session.lastSeen = Date.now();
        }
    }

    private cleanup() {
        const now = Date.now();
        for (const [token, session] of this.sessions) {
            if (now - session.lastSeen > this.sessionTtlMs) {
                this.sessions.delete(token);
            }
        }
    }
}
