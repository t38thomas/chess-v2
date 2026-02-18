import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { Socket } from 'net';
import { v4 as uuidv4 } from 'uuid';
import { MatchService } from '../application/MatchService';
import { DtoMapper } from '../infrastructure/DtoMapper';
import { Action } from '../domain/GameEngine';
import { config } from '../config';
import { Logger } from '../utils/logger';
import { TokenBucket, SlidingWindowRateLimiter } from '../utils/rateLimiter';

// Extend WebSocket to include alive status and username
interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    playerId?: string;
    username?: string;
    matchId?: string;
    remoteAddress?: string;
}

export function setupWebSocket(wss: WebSocketServer, httpServer: Server, matchService: MatchService) {
    // Limits
    const connectionLimiter = new SlidingWindowRateLimiter(
        config.RATE_LIMIT.CONNECTION.WINDOW_MS,
        config.RATE_LIMIT.CONNECTION.MAX_REQUESTS
    );

    // Clients map: MatchId -> Map<PlayerId, WebSocket>
    const clients = new Map<string, Map<string, ExtWebSocket>>();

    // Handle Upgrade manually for Origin check and Rate Limiting
    httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
        const origin = request.headers.origin;
        const ip = request.socket.remoteAddress || 'unknown';

        // 1. Origin Check
        if (origin) {
            if (!config.ALLOWED_ORIGINS.includes(origin)) {
                Logger.warn('Connection blocked: Invalid Origin', { origin, ip });
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
                return;
            }
        }

        // 2. Connection Rate Limiting
        if (!connectionLimiter.tryConsume(ip)) {
            Logger.warn('Connection blocked: Rate Limit', { ip });
            socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
            (ws as ExtWebSocket).remoteAddress = ip;
            wss.emit('connection', ws, request);
        });
    });

    wss.on('connection', (ws: ExtWebSocket, req: IncomingMessage) => {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });

        // Per-socket message rate limiter
        const socketMsgLimiter = new TokenBucket(
            config.RATE_LIMIT.MESSAGE.MAX_REQUESTS,
            config.RATE_LIMIT.MESSAGE.MAX_REQUESTS
        );

        ws.on('message', async (data, isBinary) => {
            if (isBinary) {
                // We do not support binary
                ws.close(1003, 'Binary data not supported');
                return;
            }

            // 1. Rate Limit
            if (!socketMsgLimiter.tryConsume()) {
                Logger.warn('Message blocked: Rate Limit', { ip: ws.remoteAddress, playerId: ws.playerId });
                // Optionally close connection if abuse is high
                return;
            }

            try {
                // 2. Safe Parsing
                const message = JSON.parse(data.toString());
                const { type, payload, requestId } = message;

                // Basic validation
                if (!type || typeof type !== 'string') throw new Error("Invalid message type");
                if (payload && typeof payload !== 'object') throw new Error("Invalid payload");

                Logger.info('WS Message', { type, playerId: ws.playerId, matchId: ws.matchId, requestId });

                switch (type) {
                    case 'hello':
                        await handleHello(ws, payload, requestId);
                        break;
                    case 'createMatch':
                        await handleCreateMatch(ws, payload, requestId);
                        break;
                    case 'joinMatch':
                        await handleJoinMatch(ws, payload, requestId);
                        break;
                    case 'makeMove':
                    case 'assignPact':
                    case 'useAbility':
                    case 'rotateBoard':
                    case 'resign':
                        await handleGameAction(ws, type, payload, requestId);
                        break;
                    default:
                        Logger.warn('Unknown message type', { type });
                        sendError(ws, requestId, 'INVALID_TYPE', 'Unknown message type');
                }

            } catch (err) {
                Logger.error('Message handling error', err, { ip: ws.remoteAddress });
                ws.close(1007, 'Invalid Message Format');
            }
        });

        ws.on('close', (code, reason) => {
            Logger.info('Client disconnected', { code, reason: reason.toString(), playerId: ws.playerId, matchId: ws.matchId });
            cleanupClient(ws);
        });

        ws.on('error', (err) => {
            Logger.error('Client error', err);
            cleanupClient(ws);
        });
    });

    // --- Handlers ---

    async function handleHello(ws: ExtWebSocket, payload: any, requestId?: string) {
        // Validate / Generate Session Token
        let playerId = payload.sessionToken;
        if (!playerId || typeof playerId !== 'string') {
            playerId = `p-${uuidv4().substring(0, 8)}`; // Generate new if missing
        }

        ws.playerId = playerId;
        // Capture username if provided (client sends it in hello)
        if (payload.username && typeof payload.username === 'string') {
            ws.username = payload.username;
        }

        ws.send(JSON.stringify({
            type: 'helloAck',
            requestId,
            payload: { sessionToken: playerId }
        }));

        // Auto-reconnect
        const allMatches = await matchService.getAllMatches();
        const activeMatch = allMatches.find(m => m.players.some(p => p.id === playerId));

        if (activeMatch) {
            Logger.info('Player found in active match, reconnecting', { playerId, matchId: activeMatch.id });
            await registerClientToMatch(ws, activeMatch.id, playerId);

            ws.send(JSON.stringify({
                type: 'reconnected',
                payload: {
                    matchId: activeMatch.id,
                    match: DtoMapper.toMatchDto(activeMatch)
                }
            }));
        }
    }

    async function handleCreateMatch(ws: ExtWebSocket, payload: any, requestId?: string) {
        if (!ws.playerId) return sendError(ws, requestId, 'UNAUTHORIZED', 'Say hello first');

        const match = await matchService.createMatch(payload.matchConfig);
        await registerClientToMatch(ws, match.id, ws.playerId);

        // Auto-join creator, prioritize stored username
        const username = ws.username || payload.username || 'Creator';
        await matchService.joinMatch(match.id, ws.playerId, username);

        ws.send(JSON.stringify({
            type: 'matchCreated',
            requestId,
            payload: { matchId: match.id, joinCode: match.joinCode }
        }));

        ws.send(JSON.stringify({
            type: 'matchJoined',
            payload: { matchId: match.id, color: 'white' }
        }));

        broadcastState(match.id, match);
    }

    async function handleJoinMatch(ws: ExtWebSocket, payload: any, requestId?: string) {
        if (!ws.playerId) return sendError(ws, requestId, 'UNAUTHORIZED', 'Say hello first');

        const joinCode = typeof payload.joinCode === 'string' ? payload.joinCode.toUpperCase() : '';
        if (!joinCode) return sendError(ws, requestId, 'BAD_REQUEST', 'Missing joinCode');

        const match = await matchService.getMatchByJoinCode(joinCode);
        if (!match) return sendError(ws, requestId, 'NOT_FOUND', 'Match not found');

        // Try to join
        try {
            const username = ws.username || payload.username || 'Opponent';
            await matchService.joinMatch(match.id, ws.playerId, username);
        } catch (e) {
            return sendError(ws, requestId, 'JOIN_FAILED', (e as Error).message);
        }

        await registerClientToMatch(ws, match.id, ws.playerId);

        const player = match.players.find(p => p.id === ws.playerId);

        ws.send(JSON.stringify({
            type: 'matchJoined',
            requestId,
            payload: { matchId: match.id, color: player?.color }
        }));

        broadcastState(match.id, match);
    }

    async function handleGameAction(ws: ExtWebSocket, type: string, payload: any, requestId?: string) {
        if (!ws.matchId || !ws.playerId) return sendError(ws, requestId, 'UNAUTHORIZED', 'Not joined to a match');

        try {
            const action: Action = {
                type: type as any,
                payload,
                playerId: ws.playerId
            };

            await matchService.applyAction(ws.matchId, action);
            const updatedMatch = await matchService.getMatch(ws.matchId);

            if (updatedMatch) {
                // success ack
                ws.send(JSON.stringify({ type: 'moveAccepted', requestId, payload: {} }));
                broadcastState(ws.matchId, updatedMatch);
            }
        } catch (e) {
            Logger.warn('Game action failed', { error: (e as Error).message, type, matchId: ws.matchId });
            sendError(ws, requestId, 'ACTION_FAILED', (e as Error).message);
        }
    }

    // --- Helpers ---

    async function registerClientToMatch(ws: ExtWebSocket, matchId: string, playerId: string) {
        ws.matchId = matchId;

        if (!clients.has(matchId)) {
            clients.set(matchId, new Map());
        }

        const matchClients = clients.get(matchId)!;

        // Handle Disconnecting Previous Socket for this player (Zombie / Duplicate)
        if (matchClients.has(playerId)) {
            const oldWs = matchClients.get(playerId)!;
            // Only disconnect if it's a different connection
            if (oldWs !== ws && oldWs.readyState === WebSocket.OPEN) {
                Logger.info('Replacing existing connection for player', { playerId, matchId });
                oldWs.close(4000, 'Replaced by new connection');
            }
        }

        matchClients.set(playerId, ws);
    }

    function cleanupClient(ws: ExtWebSocket) {
        if (ws.matchId && ws.playerId) {
            const matchClients = clients.get(ws.matchId);
            if (matchClients) {
                // Only remove if it's strictly THIS socket (avoid removing the REPLACED socket)
                if (matchClients.get(ws.playerId) === ws) {
                    matchClients.delete(ws.playerId);
                }
                if (matchClients.size === 0) {
                    clients.delete(ws.matchId);
                }
            }
        }
    }

    function broadcastState(matchId: string, match: any) {
        const matchClients = clients.get(matchId);
        if (!matchClients) return;

        // Use DtoMapper
        const stateDto = DtoMapper.toMatchDto(match);
        const message = JSON.stringify({
            type: 'stateSync',
            payload: stateDto
        });

        for (const client of matchClients.values()) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        }
    }

    function sendError(ws: WebSocket, requestId: string | undefined, code: string, message: string) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'error',
                requestId,
                payload: { code, message }
            }));
        }
    }

    // --- Heartbeat ---
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const extWs = ws as ExtWebSocket;
            if (extWs.isAlive === false) {
                Logger.info('Terminating inactive client', { playerId: extWs.playerId });
                return ws.terminate();
            }

            extWs.isAlive = false;
            ws.ping();
        });
    }, config.WS.HEARTBEAT_INTERVAL);

    wss.on('close', () => {
        clearInterval(interval);
    });
}
