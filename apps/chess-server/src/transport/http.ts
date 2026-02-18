import http from 'http';
import { MatchService } from '../application/MatchService';

export const createHttpServer = (matchService: MatchService) => {
    return http.createServer(async (req, res) => {
        // Basic Security Headers for all responses
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');

        if (req.method === 'GET' && req.url === '/health') {
            const matches = await matchService.getAllMatches();
            const activeMatches = matches.length;
            const activePlayers = matches.reduce((acc, m) => acc + m.players.filter(p => p.isConnected).length, 0);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            });
            res.end(JSON.stringify({
                status: 'ok',
                uptime: process.uptime(),
                activeMatches,
                activePlayers
            }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
};
