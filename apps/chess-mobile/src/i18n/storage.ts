import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LANGUAGE_KEY = 'user_language';

export const saveLanguage = async (language: string) => {
    try {
        if (Platform.OS === 'web') {
            localStorage.setItem(LANGUAGE_KEY, language);
        } else {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        }
    } catch (e) {
        console.warn('Failed to save language preference', e);
    }
};

export const loadLanguage = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(LANGUAGE_KEY);
        } else {
            return await AsyncStorage.getItem(LANGUAGE_KEY);
        }
    } catch (e) {
        console.warn('Failed to load language preference', e);
        return null;
    }
};
