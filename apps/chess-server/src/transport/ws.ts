import { WebSocketServer, WebSocket } from 'ws';
import { MatchService } from '../application/MatchService';
import { DtoMapper } from '../infrastructure/DtoMapper';
import { Action } from '../domain/GameEngine';

export function setupWebSocket(wss: WebSocketServer, matchService: MatchService) {
    const clients = new Map<string, WebSocket[]>(); // matchId -> WebSocket[]

    wss.on('connection', (ws) => {
        let currentMatchId: string | null = null;
        let currentPlayerId: string | null = null;

        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                const { type, payload, requestId } = message;

                switch (type) {
                    case 'hello': {
                        // In a real app, we'd verify the sessionToken
                        // For now, we just acknowledge and assign an ID if needed
                        currentPlayerId = payload.sessionToken || `p-${Math.random().toString(36).substring(2, 6)}`;
                        ws.send(JSON.stringify({
                            type: 'helloAck',
                            requestId,
                            payload: { sessionToken: currentPlayerId }
                        }));

                        // Reconnection Logic: Find if player is in a match
                        // Reconnection Logic: Find if player is in a match
                        const allMatches = await matchService.getAllMatches();
                        const activeMatch = allMatches.find(m => m.players.some(p => p.id === currentPlayerId));

                        if (activeMatch) {
                            currentMatchId = activeMatch.id;
                            if (!clients.has(activeMatch.id)) clients.set(activeMatch.id, []);
                            clients.get(activeMatch.id)!.push(ws);

                            ws.send(JSON.stringify({
                                type: 'reconnected',
                                payload: {
                                    matchId: activeMatch.id,
                                    match: DtoMapper.toMatchDto(activeMatch)
                                }
                            }));
                        }
                        break;
                    }

                    case 'createMatch': {
                        const match = await matchService.createMatch(payload.matchConfig);
                        currentMatchId = match.id;

                        // Automatically join the creator as white
                        await matchService.joinMatch(match.id, currentPlayerId!, payload.username || 'Creator');

                        if (!clients.has(match.id)) clients.set(match.id, []);
                        clients.get(match.id)!.push(ws);

                        ws.send(JSON.stringify({
                            type: 'matchCreated',
                            requestId,
                            payload: { matchId: match.id, joinCode: match.joinCode }
                        }));

                        ws.send(JSON.stringify({
                            type: 'matchJoined',
                            payload: { matchId: match.id, color: 'white' }
                        }));

                        broadcast(match.id, {
                            type: 'stateSync',
                            payload: DtoMapper.toMatchDto(match)
                        });
                        break;
                    }

                    case 'joinMatch': {
                        const match = await matchService.getMatchByJoinCode(payload.joinCode);
                        if (!match) throw new Error("Match not found");

                        await matchService.joinMatch(match.id, currentPlayerId!, payload.username || 'Opponent');
                        currentMatchId = match.id;

                        if (!clients.has(match.id)) clients.set(match.id, []);
                        clients.get(match.id)!.push(ws);

                        const player = match.players.find(p => p.id === currentPlayerId);

                        ws.send(JSON.stringify({
                            type: 'matchJoined',
                            requestId,
                            payload: { matchId: match.id, color: player?.color }
                        }));

                        broadcast(match.id, {
                            type: 'stateSync',
                            payload: DtoMapper.toMatchDto(match)
                        });
                        break;
                    }

                    case 'makeMove':
                    case 'assignPact':
                    case 'useAbility':
                    case 'rotateBoard':
                    case 'resign': {
                        if (!currentMatchId || !currentPlayerId) {
                            throw new Error("Not joined to a match");
                        }

                        const action: Action = {
                            type,
                            payload,
                            playerId: currentPlayerId
                        } as any;

                        await matchService.applyAction(currentMatchId, action);
                        const updatedMatch = await matchService.getMatch(currentMatchId);

                        if (updatedMatch) {
                            // Acknowledge the request
                            ws.send(JSON.stringify({ type: 'moveAccepted', requestId, payload: {} }));

                            broadcast(currentMatchId, {
                                type: 'stateSync',
                                payload: DtoMapper.toMatchDto(updatedMatch)
                            });
                        }
                        break;
                    }
                }
            } catch (err) {
                console.error('WS Error:', err);
                ws.send(JSON.stringify({ type: 'error', message: (err as Error).message }));
            }
        });

        ws.on('close', () => {
            if (currentMatchId && clients.has(currentMatchId)) {
                const matchClients = clients.get(currentMatchId)!;
                clients.set(currentMatchId, matchClients.filter(c => c !== ws));
            }
        });
    });

    function broadcast(matchId: string, message: any) {
        const matchClients = clients.get(matchId);
        if (matchClients) {
            const data = JSON.stringify(message);
            matchClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            });
        }
    }
}
