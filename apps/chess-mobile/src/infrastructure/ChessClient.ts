import {
    Envelope, ServerEnvelope, MessageType, ServerMessageType,
    MatchCreatedPayload, MatchJoinedPayload, MoveAcceptedPayload,
    MatchConfig
} from 'chess-core';

type MessageHandler<T = any> = (payload: T) => void;

interface PendingRequest {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timer: NodeJS.Timeout;
}

export class ChessClient {
    private ws: WebSocket | null = null;
    private listeners: Map<ServerMessageType, MessageHandler[]> = new Map();
    private sessionToken: string | null = null;
    private requestIdCounter = 0;
    private pendingRequests: Map<string, PendingRequest> = new Map();
    private _isConnected = false;

    constructor(private url: string) { }

    get isConnected(): boolean {
        return this._isConnected;
    }

    connect(username?: string, sessionToken?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.ws) {
                this.ws.close();
            }

            try {
                // Android's React Native WebSocket sends Origin derived from the WSS URL
                // (e.g. https://server.pactchess.com) which is NOT in the server's
                // ALLOWED_ORIGINS list. Explicitly pass an allowed Origin header.
                // React Native's WebSocket accepts a 3rd options arg (not in browser types).
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                this.ws = new (WebSocket as any)(this.url, [], {
                    headers: { Origin: 'https://pactchess.com' }
                });
            } catch (e) {
                reject(new Error(`Invalid URL: ${this.url}`));
                return;
            }

            this.ws.onopen = () => {
                console.log('Connected to Chess Server');
                this._isConnected = true;

                // Use passed token or existing one
                if (sessionToken) this.sessionToken = sessionToken;

                this.send('hello', {
                    sessionToken: this.sessionToken || undefined,
                    username
                });
                resolve();
            };

            this.ws.onmessage = (event) => {
                try {
                    const envelope = JSON.parse(event.data) as ServerEnvelope;
                    this.handleMessage(envelope);
                } catch (e) {
                    console.error('Failed to parse message', e);
                }
            };

            this.ws.onerror = (e) => {
                console.error('WS Error', e);
                // Only reject if we are still connecting
                if (!this._isConnected) {
                    reject(e);
                }
            };

            this.ws.onclose = () => {
                console.log('WS Closed');
                this._isConnected = false;
                this.ws = null;
            };
        });
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this._isConnected = false;
        }
    }

    on<T>(type: ServerMessageType, handler: MessageHandler<T>) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(handler);
        return () => {
            const handlers = this.listeners.get(type);
            if (handlers) {
                this.listeners.set(type, handlers.filter(h => h !== handler));
            }
        };
    }

    async createMatch(config?: MatchConfig): Promise<MatchCreatedPayload> {
        return this.request<MatchCreatedPayload>('createMatch', { matchConfig: config });
    }

    async joinMatch(joinCode: string): Promise<MatchJoinedPayload> {
        return this.request<MatchJoinedPayload>('joinMatch', { joinCode });
    }

    async makeMove(from: { x: number, y: number }, to: { x: number, y: number }, promotion?: string): Promise<MoveAcceptedPayload> {
        return this.request<MoveAcceptedPayload>('makeMove', { from, to, promotion });
    }

    async assignPact(pactId: string): Promise<void> {
        return this.request<void>('assignPact', { pactId });
    }

    async useAbility(abilityId: string, params?: any): Promise<void> {
        return this.request<void>('useAbility', { abilityId, params });
    }

    async rotateBoard(): Promise<void> {
        return this.request<void>('rotateBoard', {});
    }

    async resign(): Promise<void> {
        return this.request<void>('resign', {});
    }

    private send<T>(type: MessageType, payload: T, requestId?: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const envelope: Envelope<T> = { type, payload, requestId };
            this.ws.send(JSON.stringify(envelope));
        } else {
            console.warn('WS not open, cannot send', type);
        }
    }

    private request<TResponse>(type: MessageType, payload: any): Promise<TResponse> {
        const requestId = `${Date.now()}-${this.requestIdCounter++}`;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timed out'));
                }
            }, 5000);

            this.pendingRequests.set(requestId, { resolve, reject, timer });
            this.send(type, payload, requestId);
        });
    }

    private handleMessage(envelope: ServerEnvelope) {
        const { type, payload, requestId } = envelope;

        if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve, reject, timer } = this.pendingRequests.get(requestId)!;
            clearTimeout(timer);
            this.pendingRequests.delete(requestId);

            if (type === 'error') {
                reject(new Error((payload as any).message || 'Unknown server error'));
            } else {
                resolve(payload);
            }
            return;
        }

        if (type === 'helloAck') {
            this.sessionToken = (payload as any).sessionToken;
        }

        const handlers = this.listeners.get(type) || [];
        handlers.forEach(h => h(payload));
    }
}
