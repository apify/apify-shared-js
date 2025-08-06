import { setTimeout } from 'node:timers/promises';

import { addTimeoutToPromise, tryCancel } from '@apify/timeout';

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
        const res = await addTimeoutToPromise(
            async () => handler(),
            200,
            'timed out',
        );
        expect(res).toBe(123);
        expect(position).toBe(5);
    });

    it('timeouts in the middle', async () => {
        await expect(addTimeoutToPromise(
            async () => handler(),
            100,
            'timed out',
        )).rejects.toThrow();
        expect(position).toBe(3);
    });

    it('timeouts with given error instance', async () => {
        const err = new Error('123');
        await expect(addTimeoutToPromise(
            async () => handler(),
            100,
            err,
        )).rejects.toThrow(err);
        expect(position).toBe(3);
    });

    it('timeouts with nesting', async () => {
        // this will timeout and cause failure, but it will happen sooner than in 200ms, so err 1 will be thrown
        async function handler2() {
            await addTimeoutToPromise(
                async () => handler(),
                100,
                'err 1',
            );
        }

        await expect(addTimeoutToPromise(
            async () => handler2(),
            200,
            'err 2',
        )).rejects.toThrow('err 1');
        expect(position).toBe(3);
    });
});
