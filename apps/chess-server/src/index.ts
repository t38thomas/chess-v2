import { WebSocketServer } from 'ws';
import { createHttpServer } from './transport/http';
import { setupWebSocket } from './transport/ws';
import { MatchService } from './application/MatchService';
import { InMemoryMatchStore } from './infrastructure/InMemoryMatchStore';

const PORT = 3000;

const server = createHttpServer();
const wss = new WebSocketServer({ server });

const store = new InMemoryMatchStore();
const matchService = new MatchService(store);

setupWebSocket(wss, matchService);

server.listen(PORT, () => {
    console.log(` authoritative chess server running on port ${PORT}`);
});
