
import { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutAnimation } from 'react-native';
import { GameFacade, BoardViewModel, MatchConfig } from 'chess-core';
import { useSoundContext } from '../context/SoundContext';

export const useGame = (matchConfig?: MatchConfig) => {
    const { playGameEvent } = useSoundContext();

    // Initialize Facade once (lazy init) with game event handler
    const [facade] = useState(() => new GameFacade(
        matchConfig,
        undefined, // onMove callback
        (event) => playGameEvent(event as any) // onGameEvent callback for sounds
    ));

    // Sync state
    const [viewModel, setViewModel] = useState<BoardViewModel>(facade.getViewModel());

    // UI State
    const [reversed, setReversed] = useState(false);
    const [availableAbilities, setAvailableAbilities] = useState<string[]>([]);

    useEffect(() => {
        const unsubscribe = facade.subscribe(() => {
            // Animate layout changes (piece movement)
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

            const newVm = facade.getViewModel();
            setViewModel(newVm);
            setAvailableAbilities(facade.getAvailableAbilities());
        });
        return unsubscribe;
    }, [facade]);

    const handleSquarePress = useCallback((x: number, y: number) => {
        facade.handleSquarePress(x, y);
    }, [facade]);

    const resetGame = useCallback((newConfig?: MatchConfig) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        facade.reset(newConfig || matchConfig);
        setReversed(false);
    }, [facade, matchConfig]);

    const toggleOrientation = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setReversed(prev => !prev);
    }, []);



    const handleJumpToMove = useCallback((index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        facade.jumpToMove(index);
    }, [facade]);

    const handleResign = useCallback(() => {
        facade.resign();
    }, [facade]);

    // Derived state
    const turn = viewModel.turn;
    const history = viewModel.history;
    const isCheck = useMemo(() => viewModel.squares.some(s => s.isCheck), [viewModel]);
    const pendingPromotion = viewModel.pendingPromotion;

    const completePromotion = useCallback((pieceType: any) => {
        facade.completePromotion(pieceType);
    }, [facade]);

    const assignPact = useCallback((color: any, pact: any) => {
        facade.assignPact(color, pact);
    }, [facade]);

    const phase = viewModel.phase;
    const pacts = viewModel.pacts;

    return {
        viewModel,
        turn,
        history,
        isCheck,
        reversed,
        handleSquarePress,
        resetGame,

        jumpToMove: handleJumpToMove,
        toggleOrientation,
        completePromotion,
        pendingPromotion,
        phase,
        status: viewModel.status,
        winner: viewModel.winner,
        pacts,
        assignPact,
        useAbility: (id: string, params?: any) => facade.useAbility(id, params),
        cancelAbility: () => facade.cancelAbility(),
        availableAbilities,
        activeAbilityId: viewModel.activeAbilityId,
        pendingTargets: viewModel.pendingTargets,
        subscribeToGameEvents: useCallback((listener: (event: any, payload?: any) => void) => facade.subscribeToGameEvents(listener), [facade]),
        orientation: facade.orientation,
        rotateBoard: useCallback(() => {
            facade.rotateBoard();
            // Force update UI since rotation might not trigger board model change directly if not subscribed?
            // Facade should emit change or we should get new ViewModel.
            // setViewModel(facade.getViewModel()); // Should be handled by subscription
        }, [facade]),
        resign: handleResign
    };
}
