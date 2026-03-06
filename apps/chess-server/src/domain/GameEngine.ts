import { Coordinate, PieceType, ChessGame } from 'chess-core';
import { PactRegistry } from 'chess-core';
import { Match } from './Match';

export interface MakeMovePayload {
    from: { x: number; y: number };
    to: { x: number; y: number };
    promotion?: 'queen' | 'rook' | 'bishop' | 'knight';
}

export type ActionType = 'makeMove' | 'resign' | 'rotateBoard' | 'assignPact' | 'useAbility';

export interface MakeMoveAction {
    type: 'makeMove';
    payload: MakeMovePayload;
    playerId: string;
}

export interface ResignAction {
    type: 'resign';
    playerId: string;
}

export interface AssignPactAction {
    type: 'assignPact';
    payload: { pactId: string };
    playerId: string;
}

export interface UseAbilityAction {
    type: 'useAbility';
    payload: { abilityId: string; params?: any };
    playerId: string;
}

export interface RotateBoardAction {
    type: 'rotateBoard';
    playerId: string;
}

export type Action = MakeMoveAction | ResignAction | AssignPactAction | UseAbilityAction | RotateBoardAction;

export interface GameEngineResult {
    events: string[];
}

export class GameEngine {
    static applyAction(match: Match, action: Action): GameEngineResult {
        switch (action.type) {
            case 'makeMove':
                return this.handleMakeMove(match, action.payload, action.playerId);
            case 'assignPact':
                return this.handleAssignPact(match, action.payload.pactId, action.playerId);
            case 'useAbility':
                return this.handleUseAbility(match, action.payload, action.playerId);
            case 'rotateBoard':
                return this.handleRotateBoard(match, action.playerId);
            case 'resign':
                return this.handleResign(match, action.playerId);
        }
    }

    private static handleResign(match: Match, playerId: string): GameEngineResult {
        const { game } = match;
        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");

        game.resign(player.color as any); // cast if needed, but match.players should have color

        return {
            events: ['resignation', 'game_over']
        };
    }

    private static handleAssignPact(match: Match, pactId: string, playerId: string): GameEngineResult {
        const { game } = match;

        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");
        if (!player.color) throw new Error("Player color not assigned");

        const pact = PactRegistry.getInstance().getDefinition(pactId);
        if (!pact) throw new Error("Invalid Pact ID");

        game.assignPact(player.color, pact);

        return {
            events: ['pactAssigned']
        };
    }

    private static handleMakeMove(match: Match, payload: MakeMovePayload, playerId: string): GameEngineResult {
        const { game } = match;

        // 1. Validate owner
        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");
        if (player.color !== game.turn) throw new Error("Not your turn");

        // 2. Hydrate Coords
        const from = new Coordinate(payload.from.x, payload.from.y);
        const to = new Coordinate(payload.to.x, payload.to.y);

        // 3. Delegate to Domain Logic
        const success = game.makeMove(from, to, payload.promotion as PieceType | undefined);

        if (!success) {
            throw new Error("Illegal move");
        }

        return {
            events: ['moveAccepted']
        };
    }

    private static handleUseAbility(match: Match, payload: { abilityId: string; params?: any }, playerId: string): GameEngineResult {
        const { game } = match;
        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");
        if (player.color !== game.turn) throw new Error("Not your turn");

        // Hydrate coordinates in params if any
        const hydratedParams = this.hydrateCoordinates(payload.params);

        const success = game.useAbility(payload.abilityId, hydratedParams);
        if (!success) {
            throw new Error("Failed to use ability");
        }

        return {
            events: ['abilityActivated']
        };
    }

    /**
     * Recursively find {x, y} objects and turn them into Coordinate instances.
     */
    private static hydrateCoordinates(obj: any): any {
        if (!obj || typeof obj !== 'object') return obj;

        if (typeof obj.x === 'number' && typeof obj.y === 'number' && Object.keys(obj).length === 2) {
            return new Coordinate(obj.x, obj.y);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.hydrateCoordinates(item));
        }

        const hydrated: any = {};
        for (const [key, value] of Object.entries(obj)) {
            hydrated[key] = this.hydrateCoordinates(value);
        }
        return hydrated;
    }

    private static handleRotateBoard(match: Match, playerId: string): GameEngineResult {
        const { game } = match;
        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");
        if (player.color !== game.turn) throw new Error("Not your turn");

        if (!game.matchConfig.enableTurnRotate90) {
            throw new Error("Turn rotation not enabled in this match");
        }

        const success = game.rotateBoard();
        if (!success) {
            // Could strictly be "Game rejected it" (e.g. causes check?)
            throw new Error("Illegal rotation");
        }

        return {
            events: ['boardRotated', 'turnChanged'] // 'turnChanged' implicit in stateSync but adding explicit event helps
        };
    }
}
