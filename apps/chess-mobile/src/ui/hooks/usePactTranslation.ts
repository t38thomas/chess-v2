import { useCallback } from 'react';
import { Pact, Perk } from 'chess-core';
import { useTranslation } from '../../i18n';

interface TranslatedPact {
    id: string;
    title: string;
    description: string;
    bonus: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
    malus: {
        id: string;
        name: string;
        description: string;
        icon: string;
    };
}

/**
 * Hook to get translated pact and perk information
 */
export const usePactTranslation = () => {
    const { t } = useTranslation();

    const translatePact = useCallback((pact: Pact | null): TranslatedPact | null => {
        if (!pact) return null;

        return {
            id: pact.id,
            title: t(`pacts.${pact.id}.title` as any) || pact.id,
            description: t(`pacts.${pact.id}.description` as any) || '',
            bonus: {
                id: pact.bonus.id,
                name: t(`perks.${pact.bonus.id}.name` as any) || pact.bonus.name,
                description: t(`perks.${pact.bonus.id}.description` as any) || pact.bonus.description,
                icon: pact.bonus.icon,
            },
            malus: {
                id: pact.malus.id,
                name: t(`perks.${pact.malus.id}.name` as any) || pact.malus.name,
                description: t(`perks.${pact.malus.id}.description` as any) || pact.malus.description,
                icon: pact.malus.icon,
            },
        };
    }, [t]);

    return { translatePact };
};
