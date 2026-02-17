import { describe, it, expect } from 'vitest';
import { PactDraftService } from './PactDraftService';
import { PACT_CARDS } from '../models/Pact';

describe('PactDraftService', () => {
    describe('generateChoices', () => {
        it('should return the requested number of choices', () => {
            const choices = PactDraftService.generateChoices(3);
            expect(choices.length).toBe(3);
        });

        it('should return unique choices within a single call', () => {
            const choices = PactDraftService.generateChoices(5);
            const ids = new Set(choices.map(c => c.id));
            expect(ids.size).toBe(choices.length);
        });

        it('should respect the excludeIds parameter', () => {
            const allPacts = PACT_CARDS;
            const exclude = [allPacts[0].id, allPacts[1].id];

            // Request enough choices to force a collision if exclusion wasn't working, 
            // or just check that none of the excluded ones are present.
            const choices = PactDraftService.generateChoices(5, undefined, exclude);

            choices.forEach(choice => {
                expect(exclude).not.toContain(choice.id);
            });
        });

        it('should produce different results for different seeds', () => {
            const choices1 = PactDraftService.generateChoices(3, 'seed1');
            const choices2 = PactDraftService.generateChoices(3, 'seed2');

            // It's possible but unlikely they are identical. 
            // Better to check if the sets are different.
            const ids1 = choices1.map(c => c.id).join(',');
            const ids2 = choices2.map(c => c.id).join(',');
            expect(ids1).not.toBe(ids2);
        });

        it('should produce deterministic results for the same seed', () => {
            const choices1 = PactDraftService.generateChoices(3, 'seed1');
            const choices2 = PactDraftService.generateChoices(3, 'seed1');

            const ids1 = choices1.map(c => c.id).join(',');
            const ids2 = choices2.map(c => c.id).join(',');
            expect(ids1).toBe(ids2);
        });

        it('should produce different results if excludeIds changes with same seed', () => {
            // This is testing that the exclusion happens *before* or impacts the RNG consumption flow 
            // OR effectively changes the pool. 
            // Our implementation filters first, then picks. 
            // So if we exclude the card that WOULD have been picked, we pick another.
            // If we exclude a card that wouldn't have been picked, the result might be the same 
            // IF the pool index logic remains consistent relative to available cards.
            // But since available array length changes, the indices from RNG might point to different cards.

            const choices1 = PactDraftService.generateChoices(1, 'fixed-seed');
            const pickedId = choices1[0].id;

            const choices2 = PactDraftService.generateChoices(1, 'fixed-seed', [pickedId]);
            expect(choices2[0].id).not.toBe(pickedId);
        });
    });
});
