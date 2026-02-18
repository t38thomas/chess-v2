export class TokenBucket {
    private tokens: number;
    private lastRefill: number;
    private readonly capacity: number;
    private readonly fillRate: number; // tokens per ms

    constructor(capacity: number, fillRatePerSecond: number) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.lastRefill = Date.now();
        this.fillRate = fillRatePerSecond / 1000;
    }

    tryConsume(amount: number = 1): boolean {
        this.refill();
        if (this.tokens >= amount) {
            this.tokens -= amount;
            return true;
        }
        return false;
    }

    private refill() {
        const now = Date.now();
        const delta = now - this.lastRefill;
        const tokensToAdd = delta * this.fillRate;
        this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
        this.lastRefill = now;
    }
}

export class SlidingWindowRateLimiter {
    private hits: Map<string, number[]> = new Map();
    private readonly windowMs: number;
    private readonly maxRequests: number;

    constructor(windowMs: number, maxRequests: number) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
    }

    tryConsume(key: string): boolean {
        const now = Date.now();
        const timestamps = this.hits.get(key) || [];

        // Remove old timestamps
        const validTimestamps = timestamps.filter(t => now - t < this.windowMs);

        if (validTimestamps.length >= this.maxRequests) {
            this.hits.set(key, validTimestamps);
            return false;
        }

        validTimestamps.push(now);
        this.hits.set(key, validTimestamps);
        return true;
    }

    // Cleanup old keys to prevent memory leaks
    cleanup() {
        const now = Date.now();
        for (const [key, timestamps] of this.hits.entries()) {
            const valid = timestamps.filter(t => now - t < this.windowMs);
            if (valid.length === 0) {
                this.hits.delete(key);
            } else {
                this.hits.set(key, valid);
            }
        }
    }
}
