export class MatchLock {
    private locks: Map<string, Promise<unknown>> = new Map();

    async runExclusive<T>(matchId: string, task: () => Promise<T>): Promise<T> {
        // Get the current tail of the queue for this matchId
        const currentLock = this.locks.get(matchId) || Promise.resolve();

        // Create a new promise that chains onto the current lock
        // We want to execute the task regardless of previous failure, but we must wait for it.
        const nextLock = currentLock
            .catch(() => { }) // Ignore previous errors to keep the chain alive
            .then(() => task());

        // Update the lock map with the new tail (handle potential rejection of task itself for next waiter)
        this.locks.set(matchId, nextLock);

        return nextLock;
    }
}
