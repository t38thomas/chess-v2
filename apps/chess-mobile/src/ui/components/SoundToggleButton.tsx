import React from 'react';
import { useSoundContext } from '../context/SoundContext';
import { IconButton } from './IconButton';

export const SoundToggleButton: React.FC = () => {
    const { isEnabled, toggleSound } = useSoundContext();

    return (
        <IconButton
            icon={isEnabled ? 'volume-high' : 'volume-mute'}
            onPress={toggleSound}
        />
    );
};
