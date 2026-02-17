/** Match configuration for the game. */
export interface MatchConfig {
    activePactsMax: number; // 1..3
    pactChoicesAtStart: number; // 1..5
    seed?: string; // For deterministic raffle (optional for local)
    enableTurnRotate90?: boolean; // New mode: Rotate board 90 deg instead of move
}

export const DEFAULT_MATCH_CONFIG: MatchConfig = {
    activePactsMax: 1,
    pactChoicesAtStart: 3,
    enableTurnRotate90: false,
};
