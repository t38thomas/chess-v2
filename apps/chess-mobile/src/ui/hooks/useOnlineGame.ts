import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameFacade, BoardViewModel, MatchConfig, DEFAULT_MATCH_CONFIG } from 'chess-core';
import { ChessClient } from '../../infrastructure/ChessClient';
import {
    StateSyncPayload, MatchJoinedPayload, MatchCreatedPayload
} from 'chess-core';

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSoundContext } from '../context/SoundContext';
import { GameEvent as SoundEvent } from '../../services/SoundManager';


const PROD_WS = "wss://server.pactchess.com";
const DEV_WS_WEB = "ws://localhost:8080";
const DEV_WS_ANDROID = "ws://10.0.2.2:8080";
const DEV_WS_IOS = "ws://localhost:8080";

// Expo/React Native define __DEV__ in dev
export const SERVER_URL = (() => {
    if (!__DEV__) return PROD_WS;

    return Platform.select({
        android: DEV_WS_ANDROID,
        ios: DEV_WS_IOS,
        default: DEV_WS_WEB, // web
    })!;
})();


export const useOnlineGame = () => {
    const { playGameEvent } = useSoundContext();

    // 1. Client & Facade
    const [client] = useState(() => new ChessClient(SERVER_URL));

    // We need facade to know about client's move handling and game events
    const [facade] = useState(() => new GameFacade(
        DEFAULT_MATCH_CONFIG,
        (move) => {
            client.makeMove(move.from, move.to, move.promotion).catch((err: any) => {
                console.error("Move rejected by server", err);
            });
        },
        (event) => {
            // Handle game events for sounds/vibrations
            playGameEvent(event as any);
        }
    ));

    const [viewModel, setViewModel] = useState<BoardViewModel>(facade.getViewModel());
    const [isConnected, setIsConnected] = useState(false);
    const [matchId, setMatchId] = useState<string | null>(null);
    const [joinCode, setJoinCode] = useState<string | null>(null);
    const [reversed, setReversed] = useState(false);
    const [username, setUsername] = useState<string>('');
    const [players, setPlayers] = useState<{
        white?: { username: string; connected: boolean };
        black?: { username: string; connected: boolean };
    }>({});
    const [playerColor, setPlayerColor] = useState<'white' | 'black' | null>(null);
    const [availableAbilities, setAvailableAbilities] = useState<string[]>([]);

    // 2. Connection Effect
    useEffect(() => {
        // Load username only
        const initConnection = async () => {
            const storedUsername = await AsyncStorage.getItem('chess_username');

            if (storedUsername) setUsername(storedUsername);

            client.connect(storedUsername || undefined)
                .then(() => setIsConnected(true))
                .catch((err: any) => console.error("Connection failed", err));
        };

        initConnection();

        // Listeners
        const unsubState = client.on('stateSync', (payload: StateSyncPayload) => {
            console.log('[useOnlineGame] Received stateSync, orientation:', payload.orientation);
            facade.syncState(payload);
            const newVm = facade.getViewModel();
            console.log('[useOnlineGame] New ViewModel orientation:', newVm.orientation);
            setViewModel(newVm);
            setAvailableAbilities(facade.getAvailableAbilities());
            setPlayers({
                white: {
                    username: payload.players?.white?.username || 'White',
                    connected: !!payload.players?.white?.connected
                },
                black: {
                    username: payload.players?.black?.username || 'Black',
                    connected: !!payload.players?.black?.connected
                }
            });
        });

        const unsubJoined = client.on('matchJoined', (payload: MatchJoinedPayload) => {
            setMatchId(payload.matchId);
            setPlayerColor(payload.color);
            facade.setPlayerColor(payload.color);
            if (payload.color === 'black') {
                setReversed(true);
            }
        });

        const unsubCreated = client.on('matchCreated', (payload: MatchCreatedPayload) => {
            setMatchId(payload.matchId);
            setJoinCode(payload.joinCode);
        });

        // Facade subscription for local UI updates
        const unsubFacade = facade.subscribe(() => {
            setViewModel(facade.getViewModel());
            setAvailableAbilities(facade.getAvailableAbilities());
        });

        return () => {
            unsubState();
            unsubJoined();
            unsubCreated();
            unsubFacade();
            client.disconnect();
        };
    }, [client, facade]);

    // 3. Actions
    const handleSquarePress = useCallback((x: number, y: number) => {
        facade.handleSquarePress(x, y);
    }, [facade]);

    const createMatch = async (config?: MatchConfig) => {
        try {
            const payload = await client.createMatch(config);
            setMatchId(payload.matchId);
            setJoinCode(payload.joinCode);
            setPlayerColor('white');
            setReversed(false);
        } catch (e) {
            console.error(e);
        }
    };

    const joinMatch = async (code: string) => {
        try {
            const payload = await client.joinMatch(code);
            setMatchId(payload.matchId);
            setPlayerColor(payload.color);

            if (payload.color === 'black') {
                setReversed(true);
            } else {
                setReversed(false);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const updateUsername = async (newUsername: string) => {
        setUsername(newUsername);
        await AsyncStorage.setItem('chess_username', newUsername);
        // Re-send hello if connected to update on server
        if (isConnected) {
            client.connect(newUsername).catch(() => { });
        }
    };

    const toggleOrientation = useCallback(() => {
        setReversed(prev => !prev);
    }, []);

    const turn = viewModel.turn;
    const isCheck = useMemo(() => viewModel.squares.some(s => s.isCheck), [viewModel]);
    const pendingPromotion = viewModel.pendingPromotion;

    const completePromotion = useCallback((pieceType: any) => {
        facade.completePromotion(pieceType);
    }, [facade]);

    const assignPact = useCallback((pact: any) => {
        client.assignPact(pact.id).catch(err => {
            console.error("Failed to assign pact online", err);
        });
    }, [client]);

    const rotateBoard = useCallback(async () => {
        try {
            await client.rotateBoard();
            // Optimistic update?
            // The server will send a stateSync or boardRotated event.
            // For now, wait for server.
        } catch (e) {
            console.error("Failed to rotate board", e);
        }
    }, [client]);

    const resign = useCallback(async () => {
        try {
            await client.resign();
        } catch (e) {
            console.error("Failed to resign online", e);
        }
    }, [client]);

    return {
        isConnected,
        matchId,
        joinCode,
        viewModel,
        turn,
        isCheck,
        reversed,
        handleSquarePress,
        createMatch,
        joinMatch,
        rotateBoard,
        resign,
        username,
        updateUsername,
        players,
        playerColor,
        completePromotion,
        pendingPromotion,
        assignPact,
        useAbility: (id: string, params?: any) => client.useAbility(id, params),
        availableAbilities,
        phase: viewModel.phase,
        pacts: viewModel.pacts,
        orientation: viewModel.orientation || 0,
        leaveMatch: async () => {
            setMatchId(null);
            setJoinCode(null);
            setPlayerColor(null);
            setPlayers({});
            setReversed(false);

            // Reset facade and view model
            facade.reset();
            setViewModel(facade.getViewModel());

            // No async storage removal needed as we don't save anymore
        }
    };
};
