import { describe, expect, it } from 'vitest';

import type { ActorCategoryDefinition } from '@apify/actor-categories';
import {
    ALL_CATEGORIES,
    CATEGORY_BY_ID,
    CATEGORY_GROUP,
    CATEGORY_ID,
    expandWithAncestorIds,
    getCategoryWithAncestorIds,
    isCategoryId,
} from '@apify/actor-categories';

describe('actor categories', () => {
    it('has unique ids', () => {
        const ids = ALL_CATEGORIES.map(({ id }) => id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('nests use cases one level below their parent; other groups have no depth', () => {
        for (const category of ALL_CATEGORIES) {
            if (category.group !== CATEGORY_GROUP.USE_CASE) {
                expect(category.depth, category.id).toBeNull();
                continue;
            }
            const parent = category.parentCategoryId ? CATEGORY_BY_ID.get(category.parentCategoryId) : undefined;
            expect(category.depth, category.id).toBe((parent?.depth ?? 0) + 1);
        }
    });

    it('has no parent loops', () => {
        for (const category of ALL_CATEGORIES) {
            const seen = new Set<string>();
            let current: ActorCategoryDefinition | undefined = category;
            while (current) {
                expect(seen.has(current.id), `loop through ${category.id}`).toBe(false);
                seen.add(current.id);
                current = current.parentCategoryId ? CATEGORY_BY_ID.get(current.parentCategoryId) : undefined;
            }
        }
    });
});

describe('isCategoryId', () => {
    it('accepts a known id', () => {
        expect(isCategoryId('GENERATE_LEADS')).toBe(true);
    });

    it('rejects an unknown or differently cased id', () => {
        expect(isCategoryId('generate_leads')).toBe(false);
        expect(isCategoryId('NOT_A_CATEGORY')).toBe(false);
    });
});

describe('getCategoryWithAncestorIds', () => {
    it('lists the category first, then each ancestor up to the root', () => {
        expect(getCategoryWithAncestorIds(CATEGORY_ID.ENRICH_COMPANY_PROFILES)).toEqual([
            CATEGORY_ID.ENRICH_COMPANY_PROFILES,
            CATEGORY_ID.PROFILE_COMPANIES_AND_DUE_DILIGENCE,
            CATEGORY_ID.RESEARCH_MARKETS_AND_COMPETITORS,
        ]);
    });

    it('returns just the category for a root', () => {
        expect(getCategoryWithAncestorIds(CATEGORY_ID.GENERATE_LEADS)).toEqual([CATEGORY_ID.GENERATE_LEADS]);
    });

    it('follows a domain up to its industry', () => {
        expect(getCategoryWithAncestorIds(CATEGORY_ID.GOOGLE_MAPS)).toEqual([
            CATEGORY_ID.GOOGLE_MAPS,
            CATEGORY_ID.MAPS_AND_LOCAL_BUSINESSES,
        ]);
    });
});

describe('expandWithAncestorIds', () => {
    it('adds shared ancestors once', () => {
        expect(
            expandWithAncestorIds([CATEGORY_ID.ENRICH_COMPANY_PROFILES, CATEGORY_ID.RESEARCH_FUNDING_AND_FINANCIALS]),
        ).toEqual([
            CATEGORY_ID.ENRICH_COMPANY_PROFILES,
            CATEGORY_ID.PROFILE_COMPANIES_AND_DUE_DILIGENCE,
            CATEGORY_ID.RESEARCH_MARKETS_AND_COMPETITORS,
            CATEGORY_ID.RESEARCH_FUNDING_AND_FINANCIALS,
        ]);
    });

    it('keeps an ancestor that was already passed in only once', () => {
        expect(expandWithAncestorIds([CATEGORY_ID.GOOGLE_MAPS, CATEGORY_ID.MAPS_AND_LOCAL_BUSINESSES])).toEqual([
            CATEGORY_ID.GOOGLE_MAPS,
            CATEGORY_ID.MAPS_AND_LOCAL_BUSINESSES,
        ]);
    });

    it('returns nothing for no categories', () => {
        expect(expandWithAncestorIds([])).toEqual([]);
    });
});
