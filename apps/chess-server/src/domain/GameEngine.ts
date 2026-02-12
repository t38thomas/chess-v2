import { Coordinate, PieceType, PACT_CARDS } from 'chess-core';
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

export type Action = MakeMoveAction | ResignAction | AssignPactAction | UseAbilityAction;

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
            case 'resign':
                throw new Error("Resign not implemented in engine yet");
        }
    }

    private static handleAssignPact(match: Match, pactId: string, playerId: string): GameEngineResult {
        const { game } = match;

        const player = match.players.find(p => p.id === playerId);
        if (!player) throw new Error("Player not in match");
        if (!player.color) throw new Error("Player color not assigned");

        const pact = PACT_CARDS.find(p => p.id === pactId);
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

        const success = game.useAbility(payload.abilityId, payload.params);
        if (!success) {
            throw new Error("Failed to use ability");
        }

        return {
            events: ['abilityActivated']
        };
    }
}
