import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { StorageService, STORAGE_KEYS } from '../services/StorageService';

interface GameSettingsContextValue {
    rotatePieces: boolean;
    toggleRotatePieces: () => void;
}

const GameSettingsContext = createContext<GameSettingsContextValue | undefined>(undefined);

interface GameSettingsProviderProps {
    children: ReactNode;
}

export const GameSettingsProvider: React.FC<GameSettingsProviderProps> = ({ children }) => {
    // Default to true on native, false on web
    const defaultRotatePieces = Platform.OS !== 'web';
    const [rotatePieces, setRotatePieces] = useState(defaultRotatePieces);

    useEffect(() => {
        // Load rotate pieces preference
        const loadRotatePiecesPreference = async () => {
            const saved = await StorageService.getBoolean(STORAGE_KEYS.ROTATE_PIECES, defaultRotatePieces);
            setRotatePieces(saved);
        };
        loadRotatePiecesPreference();
    }, []);

    useEffect(() => {
        // Save preference when changed
        StorageService.setBoolean(STORAGE_KEYS.ROTATE_PIECES, rotatePieces);
    }, [rotatePieces]);

    const toggleRotatePieces = () => {
        setRotatePieces((prev) => !prev);
    };

    const value: GameSettingsContextValue = {
        rotatePieces,
        toggleRotatePieces,
    };

    return <GameSettingsContext.Provider value={value}>{children}</GameSettingsContext.Provider>;
};

export const useGameSettings = (): GameSettingsContextValue => {
    const context = useContext(GameSettingsContext);
    if (!context) {
        throw new Error('useGameSettings must be used within a GameSettingsProvider');
    }
    return context;
};
