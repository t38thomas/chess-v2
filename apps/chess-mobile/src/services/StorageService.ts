import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * A centralized storage service that abstracts away the underlying storage mechanism
 * (AsyncStorage for native, localStorage for web).
 */
export const StorageService = {
    /**
     * Save a string value to storage.
     */
    async setItem(key: string, value: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem(key, value);
            } else {
                await AsyncStorage.setItem(key, value);
            }
        } catch (error) {
            console.warn(`[StorageService] Failed to set item: ${key}`, error);
        }
    },

    /**
     * Get a string value from storage.
     */
    async getItem(key: string): Promise<string | null> {
        try {
            if (Platform.OS === 'web') {
                return localStorage.getItem(key);
            } else {
                return await AsyncStorage.getItem(key);
            }
        } catch (error) {
            console.warn(`[StorageService] Failed to get item: ${key}`, error);
            return null;
        }
    },

    /**
     * Remove an item from storage.
     */
    async removeItem(key: string): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(key);
            } else {
                await AsyncStorage.removeItem(key);
            }
        } catch (error) {
            console.warn(`[StorageService] Failed to remove item: ${key}`, error);
        }
    },

    /**
     * Save a boolean value to storage.
     */
    async setBoolean(key: string, value: boolean): Promise<void> {
        await this.setItem(key, value ? 'true' : 'false');
    },

    /**
     * Get a boolean value from storage.
     */
    async getBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
        const item = await this.getItem(key);
        if (item === null) return defaultValue;
        return item === 'true';
    }
};

export const STORAGE_KEYS = {
    LANGUAGE: 'user_language',
    THEME_MODE: 'user_theme_mode',
    SOUND_ENABLED: 'user_sound_enabled',
    ROTATE_PIECES: 'user_rotate_pieces',
};
