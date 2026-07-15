import { setTimeout } from 'node:timers/promises';

import { beforeEach, describe, expect, it } from 'vitest';

import type { ExtendTimeoutOptions } from '@apify/timeout';
import { addTimeoutToPromise, extendTimeout, storage, tryCancel } from '@apify/timeout';

describe('timeout with abort controller', () => {
    let position = 0;

    async function handler() {
        await setTimeout(30);
        tryCancel();
        position++;
        await setTimeout(30);
        tryCancel();
        position++;
        await setTimeout(30);
        tryCancel();
        position++;
        await setTimeout(30);
        tryCancel();
        position++;
        await setTimeout(30);
        tryCancel();
        position++;

        return 123;
    }

    beforeEach(() => {
        position = 0;
    });

    it('passes without timeouting', async () => {
        const res = await addTimeoutToPromise(async () => handler(), 200, 'timed out');
        expect(res).toBe(123);
        expect(position).toBe(5);
    });

    it('timeouts in the middle', async () => {
        await expect(addTimeoutToPromise(async () => handler(), 100, 'timed out')).rejects.toThrow();
        expect(position).toBe(3);
    });

    it('timeouts with given error instance', async () => {
        const err = new Error('123');
        await expect(addTimeoutToPromise(async () => handler(), 100, err)).rejects.toThrow(err);
        expect(position).toBe(3);
    });

    it('reports the timer frame in the stack trace', async () => {
        // consumers (crawlee) match on this frame when logging timeout errors, so it must not be
        // replaced by the name of whatever function we happen to hand over to `setTimeout`
        const err = await addTimeoutToPromise(async () => handler(), 50, 'timed out').catch((e: Error) => e);

        expect(err.stack).toMatch(/at Timeout\._onTimeout/);
    });

    it('timeouts with nesting', async () => {
        // this will timeout and cause failure, but it will happen sooner than in 200ms, so err 1 will be thrown
        async function handler2() {
            await addTimeoutToPromise(async () => handler(), 100, 'err 1');
        }

        await expect(addTimeoutToPromise(async () => handler2(), 200, 'err 2')).rejects.toThrow('err 1');
        expect(position).toBe(3);
    });
});

describe('extendTimeout', () => {
    // needs 160ms in total, so it only finishes if the timeout gets extended
    async function slowHandler(extraMillis: number, options?: ExtendTimeoutOptions) {
        await setTimeout(60);
        tryCancel();
        extendTimeout(extraMillis, options);
        await setTimeout(100);
        tryCancel();

        return 123;
    }

    it('extends a running timeout', async () => {
        const res = await addTimeoutToPromise(async () => slowHandler(200), 100, 'timed out');
        expect(res).toBe(123);
    });

    it('still times out when the extension is not enough', async () => {
        await expect(addTimeoutToPromise(async () => slowHandler(20), 100, 'timed out')).rejects.toThrow('timed out');
    });

    it('extends the enclosing timeouts too', async () => {
        // the outer 150ms would kill the extended inner handler (160ms) if it was not extended as well
        const res = await addTimeoutToPromise(
            async () => addTimeoutToPromise(async () => slowHandler(200), 100, 'inner timed out'),
            150,
            'outer timed out',
        );
        expect(res).toBe(123);
    });

    it('leaves the enclosing timeouts alone with `propagate: false`', async () => {
        // the inner handler extends itself to 300ms, but the outer 150ms stays a hard limit
        await expect(
            addTimeoutToPromise(
                async () =>
                    addTimeoutToPromise(async () => slowHandler(200, { propagate: false }), 100, 'inner timed out'),
                150,
                'outer timed out',
            ),
        ).rejects.toThrow('outer timed out');
    });

    it('is a no-op outside of a timeout handler', () => {
        expect(() => extendTimeout(100)).not.toThrow();
    });

    it('keeps the enclosing context readable from a nested one', async () => {
        // nested calls used to share a single store object, so anything put on the context of an outer
        // handler was readable from an inner one - each call has its own store now, and this makes sure
        // it still inherits from the enclosing one
        await addTimeoutToPromise(
            async () => {
                (storage.getStore() as Record<string, unknown>).marker = 'from-outer';

                await addTimeoutToPromise(
                    async () => {
                        expect((storage.getStore() as Record<string, unknown>).marker).toBe('from-outer');
                    },
                    100,
                    'inner timed out',
                );
            },
            200,
            'outer timed out',
        );
    });

    it('is ignored once the handler timed out', async () => {
        let extended = false;

        // no `tryCancel()`, so the handler keeps running after it timed out
        const promise = addTimeoutToPromise(
            async () => {
                await setTimeout(60);
                extendTimeout(1000);
                extended = true;

                return 123;
            },
            30,
            'timed out',
        );

        await expect(promise).rejects.toThrow('timed out');

        // the extension must not resurrect the timer or turn the rejection into a resolution
        await setTimeout(60);
        expect(extended).toBe(true);
    });
});
