import React, { useState, useEffect } from 'react';
import { I18nManager } from 'react-native';
import { en, Translations } from './locales/en';
import { it } from './locales/it';
import { Locale, RecursiveKeyOf } from './types';
import { saveLanguage, loadLanguage } from './storage';

// 1. Registry of locales
const translations: Record<Locale, Translations> = {
    en,
    it,
};

// 2. Helper to resolve nested keys: "home.playOnline" -> "Play Online"
const getNestedValue = (obj: Record<string, unknown>, key: string): string | undefined => {
    const result = key.split('.').reduce<unknown>((acc, part) => {
        if (acc !== null && typeof acc === 'object') {
            return (acc as Record<string, unknown>)[part];
        }
        return undefined;
    }, obj);
    return typeof result === 'string' ? result : undefined;
};

// 3. Current locale state (module-level for non-hook usage)
let currentLocale: Locale = 'en';
const listeners = new Set<(locale: Locale) => void>();

// 4. Update locale
export const setLocale = async (locale: Locale) => {
    currentLocale = locale;
    await saveLanguage(locale);
    listeners.forEach((listener) => listener(locale));
};

export const getLocale = () => currentLocale;

// 5. Initializer
export const initI18n = async () => {
    const saved = await loadLanguage();
    if (saved && (saved === 'en' || saved === 'it')) {
        currentLocale = saved as Locale;
    } else {
        // Default to 'en' if no saved preference or invalid
        currentLocale = 'en';
    }
    listeners.forEach((listener) => listener(currentLocale));
};

// 6. Pluralization & Interpolation
export type TranslationParams = Record<string, string | number>;
export type TxKeyPath = RecursiveKeyOf<Translations>;

export const t = (key: TxKeyPath, params?: TranslationParams): string => {
    let localeData = translations[currentLocale];

    // Pluralization logic: "key" + "_zero" | "_one" | "_other"
    // If params.count is present, we try to modify the key suffix.
    let finalKey = key as string;
    if (params && typeof params.count === 'number') {
        const count = params.count;
        let suffix = 'other';
        if (count === 0) suffix = 'zero';
        else if (count === 1) suffix = 'one';

        const possiblePluralKey = `${key}_${suffix}`;
        // We check if the plural key exists in the current locale (or fallback en)
        if (getNestedValue(localeData, possiblePluralKey) || getNestedValue(translations['en'], possiblePluralKey)) {
            finalKey = possiblePluralKey;
        }
    }

    let value = getNestedValue(localeData, finalKey);

    // Fallback to English if missing
    if (!value) {
        value = getNestedValue(translations['en'], finalKey);
    }

    // Final fallback
    if (!value) {
        console.warn(`Missing translation for key: ${key}`);
        return key as string;
    }

    // Interpolation: "Hello {name}" -> value.replace(/{name}/g, params.name)
    if (params) {
        return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
            // Clean safety: ensure paramValue is string or number
            return str.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        }, value);
    }

    return value;
};

// 7. React Hook
export const useTranslation = () => {
    const [locale, setLocaleState] = useState<Locale>(currentLocale);

    useEffect(() => {
        const listener = (newLocale: Locale) => {
            setLocaleState(newLocale);
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    return {
        t,
        locale,
        setLocale,
    };
};

// 8. Provider Component (for consistency)
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return children as React.ReactElement;
};
