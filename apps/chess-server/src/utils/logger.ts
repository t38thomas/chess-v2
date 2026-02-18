export class Logger {
    static info(message: string, context?: Record<string, any>) {
        console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message, ...this.maskContext(context) }));
    }

    static warn(message: string, context?: Record<string, any>) {
        console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message, ...this.maskContext(context) }));
    }

    static error(message: string, error?: any, context?: Record<string, any>) {
        console.error(JSON.stringify({
            level: 'error',
            timestamp: new Date().toISOString(),
            message,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            ...this.maskContext(context)
        }));
    }

    private static maskContext(context?: Record<string, any>): Record<string, any> {
        if (!context) return {};
        const masked = { ...context };

        // Mask specific fields
        if (masked.sessionToken) masked.sessionToken = '***';
        if (masked.joinCode) masked.joinCode = '***';
        if (masked.token) masked.token = '***';

        return masked;
    }
}
