import dotenv from 'dotenv';

dotenv.config();

export const config = {
    PORT: parseInt(process.env.PORT || '8080', 10),
    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'https://pactchess.com,https://www.pactchess.com').split(','),
    TOKEN_SECRET: process.env.TOKEN_SECRET || 'dev-secret-do-not-use-in-prod',

    // WebSocket Limits
    WS: {
        MAX_PAYLOAD: parseInt(process.env.WS_MAX_PAYLOAD || '65536', 10), // 64KB
        HEARTBEAT_INTERVAL: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10), // 30s
    },

    // Rate Limiting
    RATE_LIMIT: {
        CONNECTION: {
            WINDOW_MS: 60000,
            MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_CONN_PER_MIN || '60', 10),
        },
        MESSAGE: {
            WINDOW_MS: 1000,
            MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MSG_PER_SEC || '20', 10), // Burst allowed
        },
        JOIN_MATCH: {
            WINDOW_MS: 60000,
            MAX_REQUESTS: 10
        },
        CREATE_MATCH: {
            WINDOW_MS: 60000,
            MAX_REQUESTS: 5
        }
    }
};
