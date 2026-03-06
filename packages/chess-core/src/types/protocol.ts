import { IconName } from '../domain/models/Icon';
import { MatchConfig } from '../domain/models/MatchConfig';
import { PieceType, PieceColor } from '../domain/models/Piece';

export interface IActivePactDto {
    id: string;
    name: string;
    description: string;
    icon: IconName;
}

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
    // WHY: params is an opaque bag whose structure is known only by each ability. 
    // It enters the system here (WS boundary) and gets hydrated/narrowed in the domain.
    params?: unknown;
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
    pacts: {
        white: Array<{ id: string; bonus: IActivePactDto; malus: IActivePactDto }>;
        black: Array<{ id: string; bonus: IActivePactDto; malus: IActivePactDto }>;
    };
    perkUsage: { white: string[], black: string[] };
    board?: Array<[string, { coordinate: { x: number; y: number }; piece: { type: string; color: string; id: string } | null }]>;
    lastMove?: { from: { x: number; y: number }; to: { x: number; y: number } } | null;
    players: {
        white: { connected: boolean; username?: string };
        black: { connected: boolean; username?: string };
    };
    matchConfig?: MatchConfig;
    orientation?: number;
    totalTurns: number;
    winner?: 'white' | 'black' | null;
    pieceCooldowns: Record<string, number>;
    extraTurns: { white: number; black: number };
    enPassantTarget: { x: number; y: number } | null;
    capturedPieces: {
        white: Array<{ type: PieceType; color: PieceColor; id: string }>;
        black: Array<{ type: PieceType; color: PieceColor; id: string }>;
    };
    pactState: Record<string, unknown>;
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
    // WHY: params is an opaque bag whose structure is known only by each ability. 
    params?: unknown;
}
