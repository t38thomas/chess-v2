export interface Player {
    id: string;
    name?: string; // Optional
    username?: string;
    color?: 'white' | 'black'; // Assigned when joining a match
    isConnected: boolean;
    lastActivity: number; // Timestamp for timeout
}
