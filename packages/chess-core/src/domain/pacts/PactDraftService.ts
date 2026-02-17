import { Pact, PACT_CARDS } from '../models/Pact';

export class PactDraftService {
    /**
     * Generates a list of pact choices based on the number requested and a seed.
     * If no seed is provided, it uses Math.random().
     */
    public static generateChoices(count: number, seed?: string, excludeIds: string[] = []): Pact[] {
        if (count <= 0) return [];

        const available = PACT_CARDS.filter(p => !excludeIds.includes(p.id));
        const result: Pact[] = [];
        const rng = this.createRNG(seed);

        for (let i = 0; i < count && available.length > 0; i++) {
            const index = Math.floor(rng() * available.length);
            result.push(available.splice(index, 1)[0]);
        }

        return result;
    }

    /**
     * Automatically assigns pacts to a player.
     */
    public static autoAssign(count: number, seed?: string, excludeIds: string[] = []): Pact[] {
        return this.generateChoices(count, seed, excludeIds);
    }

    /**
     * Simple Seedable RNG (Mulberry32)
     */
    private static createRNG(seed?: string) {
        if (!seed) return Math.random;

        // Simple string to hash for seed
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
        }

        let s = h >>> 0;
        return function () {
            s |= 0; s = s + 0x6D2B79F5 | 0;
            let t = Math.imul(s ^ s >>> 15, 1 | s);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }
}
