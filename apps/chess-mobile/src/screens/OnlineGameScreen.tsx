import React, { useState } from 'react';
import { useOnlineGame } from '../ui/hooks/useOnlineGame';
import { useBoardSize } from '../ui/responsive/useBoardSize';
import * as Clipboard from 'expo-clipboard';
import { LobbyView } from '../ui/components/LobbyView';
import { WaitingView } from '../ui/components/WaitingView';
import { ActiveGameView } from '../ui/components/ActiveGameView';
import { MatchConfigScreen } from './MatchConfigScreen';

import { MatchConfig } from 'chess-core';

interface OnlineGameScreenProps {
    onNavigateBack?: () => void;
}

export const OnlineGameScreen: React.FC<OnlineGameScreenProps> = ({ onNavigateBack }) => {
    const {
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
        toggleOrientation,
        players,
        playerColor,
        completePromotion,
        pendingPromotion,
        assignPact,
        phase,
        pacts,
        leaveMatch,
        useAbility,
        availableAbilities
    } = useOnlineGame();

    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [isConfiguring, setIsConfiguring] = useState(false);
    const boardSize = useBoardSize();

    const handleJoinMatch = () => {
        if (joinCodeInput.trim()) {
            joinMatch(joinCodeInput.trim());
        }
    };

    const handleCopyCode = async () => {
        if (joinCode) {
            try {
                await Clipboard.setStringAsync(joinCode);
                // Optional: Add a toast/alert to confirm copy
            } catch (error) {
                console.error('Failed to copy code:', error);
            }
        }
    };

    const handleBack = async () => {
        await leaveMatch();
        if (onNavigateBack) onNavigateBack();
    };

    // CONFIGURATION SCREEN - Triggered when "Create Match" is clicked
    if (isConfiguring) {
        return (
            <MatchConfigScreen
                mode="online"
                onBack={() => setIsConfiguring(false)}
                onConfirm={async (config) => {
                    await createMatch(config);
                    setIsConfiguring(false);
                }}
            />
        );
    }

    // LOBBY SCREEN - If no match exists yet
    if (!matchId) {
        return (
            <LobbyView
                isConnected={isConnected}
                joinCodeInput={joinCodeInput}
                onJoinCodeChange={(text) => setJoinCodeInput(text.toUpperCase())}
                onCreateMatch={() => setIsConfiguring(true)}
                onJoinMatch={handleJoinMatch}
                onBack={onNavigateBack}
            />
        );
    }

    // WAITING SCREEN - Match created but waiting for opponent
    const bothPlayersConnected = !!players.white?.connected && !!players.black?.connected;
    if (matchId && !bothPlayersConnected) {
        return (
            <WaitingView
                joinCode={joinCode}
                players={players}
                onCopyCode={handleCopyCode}
                onLeaveMatch={handleBack}
            />
        );
    }

    // ACTIVE GAME SCREEN
    return (
        <ActiveGameView
            viewModel={viewModel}
            onSquarePress={handleSquarePress}
            reversed={reversed}
            boardSize={boardSize}
            turn={turn}
            isCheck={isCheck}
            players={players}
            pacts={pacts}
            playerColor={playerColor || 'white'}
            phase={phase}
            pendingPromotion={pendingPromotion}
            availableAbilities={availableAbilities}
            onRotate={toggleOrientation}
            onLeaveMatch={handleBack}
            onUseAbility={useAbility}
            onCompletePromotion={completePromotion}
            onAssignPact={assignPact}
        />
    );
};
