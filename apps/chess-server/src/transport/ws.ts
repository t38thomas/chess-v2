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

                switch (message.type) {
                    case 'join':
                        const { matchId, playerId, username } = message.payload;
                        const match = await matchService.joinMatch(matchId, playerId, username);
                        currentMatchId = matchId;
                        currentPlayerId = playerId;

                        if (!clients.has(matchId)) clients.set(matchId, []);
                        clients.get(matchId)!.push(ws);

                        broadcast(matchId, {
                            type: 'stateSync',
                            payload: DtoMapper.toMatchDto(match)
                        });
                        break;

                    case 'action':
                        if (!currentMatchId || !currentPlayerId) return;
                        const action: Action = {
                            ...message.payload,
                            playerId: currentPlayerId
                        };
                        await matchService.applyAction(currentMatchId, action);
                        const updatedMatch = await matchService.getMatch(currentMatchId);
                        if (updatedMatch) {
                            broadcast(currentMatchId, {
                                type: 'stateSync',
                                payload: DtoMapper.toMatchDto(updatedMatch)
                            });
                        }
                        break;
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
