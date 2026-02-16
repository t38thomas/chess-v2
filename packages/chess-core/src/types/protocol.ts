import { MatchConfig } from '../domain/models/MatchConfig';

export type MessageType =
    | 'hello'
    | 'createMatch'
    | 'joinMatch'
    | 'makeMove'
    | 'rotateBoard'
    | 'assignPact'
    | 'useAbility'
    | 'resign'
    | 'ping';

export interface AssignPactPayload {
    pactId: string;
}

export interface UseAbilityPayload {
    abilityId: string;
    params?: any;
}

export type ServerMessageType =
    | 'helloAck'
    | 'matchCreated'
    | 'matchJoined'
    | 'stateSync'
    | 'moveAccepted'
    | 'moveRejected'
    | 'turnChanged'
    | 'matchEnded'
    | 'playerDisconnected'
    | 'playerReconnected'
    | 'pactAssigned'
    | 'abilityActivated'
    | 'pong'
    | 'error';

export interface PactAssignedPayload {
    pactId: string;
    color: 'white' | 'black';
}

export interface Envelope<T = unknown> {
    type: MessageType;
    requestId?: string;
    payload?: T;
}

export interface ServerEnvelope<T = unknown> {
    type: ServerMessageType;
    requestId?: string;
    payload?: T;
}

export interface ErrorPayload {
    code: string;
    message: string;
}

// Client -> Server Payloads
export interface CreateMatchPayload {
    variantConfig?: Record<string, unknown>;
}

export interface JoinMatchPayload {
    joinCode: string;
}

export interface MakeMovePayload {
    from: { x: number; y: number };
    to: { x: number; y: number };
    promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
}

export interface HelloPayload {
    sessionToken?: string;
    username?: string;
}

// Server -> Client Payloads
export interface HelloAckPayload {
    sessionToken: string;
}

export interface MatchCreatedPayload {
    matchId: string;
    joinCode: string;
}

export interface MatchJoinedPayload {
    matchId: string;
    color: 'white' | 'black';
}

export interface StateSyncPayload {
    matchId: string;
    status: 'active' | 'checkmate' | 'stalemate' | 'draw';
    phase: 'setup' | 'playing' | 'game_over';
    turn: 'white' | 'black';
    pacts: { white: any[], black: any[] };
    perkUsage: { white: string[], black: string[] };
    board?: Array<[string, { coordinate: { x: number; y: number }; piece: { type: string; color: string; id: string } | null }]>;
    lastMove?: { from: { x: number; y: number }; to: { x: number; y: number } };
    players: {
        white: { connected: boolean; username?: string };
        black: { connected: boolean; username?: string };
    };
    matchConfig?: MatchConfig;
}

export interface MoveAcceptedPayload {
    move: MakeMovePayload;
    nextTurn: 'white' | 'black';
}

export interface MatchEndedPayload {
    winner?: 'white' | 'black';
    reason: string;
}

export interface AbilityActivatedPayload {
    playerId: string;
    abilityId: string;
    params?: any;
}
