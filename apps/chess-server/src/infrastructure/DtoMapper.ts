import { Match } from '../domain/Match';

export class DtoMapper {
    static toMatchDto(match: Match) {
        const game = match.game;

        // Convert Map to plain object for JSON serialization
        const pieceCooldowns: Record<string, number> = {};
        game.pieceCooldowns.forEach((turn, id) => {
            pieceCooldowns[id] = turn;
        });

        return {
            id: match.id,
            joinCode: match.joinCode,
            turn: game.turn,
            status: game.status,
            phase: game.phase,
            totalTurns: game.totalTurns,
            pacts: {
                white: game.pacts.white,
                black: game.pacts.black
            },
            perkUsage: {
                white: Array.from(game.perkUsage.white),
                black: Array.from(game.perkUsage.black)
            },
            pieceCooldowns,
            board: Array.from(game.board.getSquaresMap().entries()).map(([key, sq]) => ([
                key,
                {
                    coordinate: { x: sq.coordinate.x, y: sq.coordinate.y },
                    piece: sq.piece ? {
                        type: sq.piece.type,
                        color: sq.piece.color,
                        id: sq.piece.id
                    } : null
                }
            ])),
            players: {
                white: match.players.find(p => p.color === 'white') ? {
                    id: match.players.find(p => p.color === 'white')!.id,
                    username: match.players.find(p => p.color === 'white')!.username,
                    connected: match.players.find(p => p.color === 'white')!.isConnected
                } : { connected: false },
                black: match.players.find(p => p.color === 'black') ? {
                    id: match.players.find(p => p.color === 'black')!.id,
                    username: match.players.find(p => p.color === 'black')!.username,
                    connected: match.players.find(p => p.color === 'black')!.isConnected
                } : { connected: false }
            },
            matchConfig: game.matchConfig,
            orientation: game.orientation,
            lastMove: game.history.length > 0 ? game.history[game.history.length - 1] : null
        };
    }
}
