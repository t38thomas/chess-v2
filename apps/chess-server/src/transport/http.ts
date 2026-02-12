import http from 'http';

export const createHttpServer = () => {
    return http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
};
