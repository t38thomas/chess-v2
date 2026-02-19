import { PactEffect } from '../PactLogic';

export const UiEffects = {
    /**
     * Emits a pact effect notification.
     */
    notify: (eventKey: string, type: 'bonus' | 'malus' = 'bonus', icon: string = 'info'): PactEffect => ({
        onEvent: (event, payload, context) => {
            // Placeholder: will implement with PactUtils later
        }
    })
};
