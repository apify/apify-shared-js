describe('SPLIT_PATH_REGEX', () => {
    if (Number(process.version.match(/v(\d+)/)?.[1] ?? null) < 15) {
        // skip tests as this package requires node 15+
        return;
    }

    // we need to import via require after the above check to not fail on node < 15
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
    const { addTimeoutToPromise, tryCancel } = require('@apify/timeout');
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
    const { setTimeout } = require('timers/promises');

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
            () => handler(),
            200,
            'timed out',
        );
        expect(res).toBe(123);
        expect(position).toBe(5);
    });

    it('timeouts in the middle', async () => {
        await expect(addTimeoutToPromise(
            () => handler(),
            100,
            'timed out',
        )).rejects.toThrowError();
        expect(position).toBe(3);
    });

    it('timeouts with given error instance', async () => {
        const err = new Error('123');
        await expect(addTimeoutToPromise(
            () => handler(),
            100,
            err,
        )).rejects.toThrowError(err);
        expect(position).toBe(3);
    });
});
