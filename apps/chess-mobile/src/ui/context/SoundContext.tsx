import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SoundManager, SoundType, GameEvent } from '../../services/SoundManager';

interface SoundContextValue {
    isEnabled: boolean;
    toggleSound: () => void;
    playSound: (type: SoundType) => void;
    playGameEvent: (event: GameEvent) => void;
}

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

interface SoundProviderProps {
    children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Initialize sound manager on mount
        SoundManager.initialize()
            .then(() => {
                setIsInitialized(true);
            })
            .catch((error) => {
                console.error('Failed to initialize SoundManager', error);
            });

        // Cleanup on unmount
        return () => {
            SoundManager.cleanup();
        };
    }, []);

    useEffect(() => {
        // Sync enabled state with SoundManager
        SoundManager.setEnabled(isEnabled);
    }, [isEnabled]);

    const toggleSound = () => {
        setIsEnabled((prev) => !prev);
    };

    const playSound = (type: SoundType) => {
        if (isInitialized && isEnabled) {
            SoundManager.playSound(type);
        }
    };

    const playGameEvent = (event: GameEvent) => {
        if (isInitialized && isEnabled) {
            SoundManager.playGameEvent(event);
        }
    };

    const value: SoundContextValue = {
        isEnabled,
        toggleSound,
        playSound,
        playGameEvent,
    };

    return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSoundContext = (): SoundContextValue => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSoundContext must be used within a SoundProvider');
    }
    return context;
};
