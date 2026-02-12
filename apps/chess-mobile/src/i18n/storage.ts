import { StorageService, STORAGE_KEYS } from '../services/StorageService';

export const saveLanguage = async (language: string) => {
    await StorageService.setItem(STORAGE_KEYS.LANGUAGE, language);
};

export const loadLanguage = async (): Promise<string | null> => {
    return await StorageService.getItem(STORAGE_KEYS.LANGUAGE);
};
