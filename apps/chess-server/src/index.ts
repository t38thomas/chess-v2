import { WebSocketServer } from 'ws';
import { createHttpServer } from './transport/http';
import { setupWebSocket } from './transport/ws';
import { MatchService } from './application/MatchService';
import { InMemoryMatchStore } from './infrastructure/InMemoryMatchStore';
import { config } from './config';
import packageJson from '../package.json';

const store = new InMemoryMatchStore();
const matchService = new MatchService(store);

const server = createHttpServer(matchService);
// WebSocketServer is initialized with noServer: true to handle upgrade manually
const wss = new WebSocketServer({ noServer: true, path: "/ws", maxPayload: config.WS.MAX_PAYLOAD });

setupWebSocket(wss, server, matchService);

server.listen(config.PORT, "0.0.0.0", () => {
    console.log(` authoritative chess server v${packageJson.version} running on port ${config.PORT}`);
    console.log(` allowed origins: ${config.ALLOWED_ORIGINS.join(', ')}`);
    console.log("run: cloudflared tunnel --protocol http2 run pactchess-home to expose the server to the internet")
});
