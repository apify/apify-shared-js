import { describe, expect, it } from 'vitest';

import { iterableToArray } from '@apify/utilities';

describe('iterableToArray', () => {
    it('collects a synchronous iterable into an array', () => {
        const result = iterableToArray(new Set([1, 2, 3]));

        expect(result).toEqual([1, 2, 3]);
    });

    it('collects an async iterable into an array', async () => {
        async function* gen() {
            yield 'a';
            yield 'b';
            yield 'c';
        }

        const result = await iterableToArray(gen());

        expect(result).toEqual(['a', 'b', 'c']);
    });

    it('propagates errors thrown by an async iterable', async () => {
        async function* gen() {
            yield 1;
            throw new Error('boom');
        }

        await expect(iterableToArray(gen())).rejects.toThrow('boom');
    });
});
