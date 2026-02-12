import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

export type SoundType =
    | 'move'
    | 'capture'
    | 'check'
    | 'checkmate'
    | 'castle'
    | 'promotion'
    | 'illegal'
    | 'game-start'
    | 'button-click';

export type GameEvent =
    | 'move'
    | 'capture'
    | 'check'
    | 'checkmate'
    | 'stalemate'
    | 'draw'
    | 'castle'
    | 'promotion'
    | 'illegal-move'
    | 'game-start'
    | 'phase_change'
    | 'pact_assigned'
    | 'ability_activated';

class SoundManagerService {
    private sounds: Map<SoundType, AudioPlayer> = new Map();
    private isEnabled: boolean = true;
    private isLoaded: boolean = false;

    private soundFiles: Record<SoundType, any> = {
        'move': require('../../assets/sounds/move.wav'),
        'capture': require('../../assets/sounds/capture.wav'),
        'check': require('../../assets/sounds/check.wav'),
        'checkmate': require('../../assets/sounds/checkmate.wav'),
        'castle': require('../../assets/sounds/castle.wav'),
        'promotion': require('../../assets/sounds/promotion.wav'),
        'illegal': require('../../assets/sounds/illegal.wav'),
        'game-start': require('../../assets/sounds/game-start.wav'),
        'button-click': require('../../assets/sounds/button-click.wav'),
    };

    async initialize(): Promise<void> {
        if (this.isLoaded) return;

        try {
            // Set audio mode for optimal playback
            await setAudioModeAsync({
                playsInSilentMode: true,
            });

            // Preload all sounds
            const loadPromises = Object.entries(this.soundFiles).map(
                async ([type, source]) => {
                    try {
                        const player = createAudioPlayer(source);
                        this.sounds.set(type as SoundType, player);
                    } catch (error) {
                        console.warn(`Failed to load sound: ${type}`, error);
                    }
                }
            );

            await Promise.all(loadPromises);
            this.isLoaded = true;
            console.log('SoundManager: All sounds loaded successfully');
        } catch (error) {
            console.error('SoundManager: Failed to initialize audio', error);
        }
    }

    async playSound(type: SoundType): Promise<void> {
        if (!this.isEnabled || !this.isLoaded) return;

        const player = this.sounds.get(type);
        if (!player) {
            console.warn(`Sound not found: ${type}`);
            return;
        }

        try {
            // Replay from start
            player.seekTo(0);
            player.play();
        } catch (error) {
            console.warn(`Failed to play sound: ${type}`, error);
        }
    }

    async playGameEvent(event: GameEvent): Promise<void> {
        const soundMap: Record<GameEvent, SoundType | null> = {
            'move': 'move',
            'capture': 'capture',
            'check': 'check',
            'checkmate': 'checkmate',
            'stalemate': 'checkmate', // Reuse checkmate for stalemate
            'draw': 'move', // Reuse move or buttons for draw
            'castle': 'castle',
            'promotion': 'promotion',
            'illegal-move': 'illegal',
            'game-start': 'game-start',
            'phase_change': 'button-click',
            'pact_assigned': 'move',
            'ability_activated': 'button-click',
        };

        const soundType = soundMap[event];
        if (soundType) {
            await this.playSound(soundType);
        }
    }

    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
    }

    isAudioEnabled(): boolean {
        return this.isEnabled;
    }

    async cleanup(): Promise<void> {
        // Remove all players
        const unloadPromises = Array.from(this.sounds.values()).map((player) => {
            try {
                player.remove();
                return Promise.resolve();
            } catch (err) {
                console.warn('Failed to remove player', err);
                return Promise.resolve();
            }
        });

        await Promise.all(unloadPromises);
        this.sounds.clear();
        this.isLoaded = false;
    }
}

export const SoundManager = new SoundManagerService();
