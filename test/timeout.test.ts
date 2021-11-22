describe('timeout with abort controller', () => {
    it('empty', async () => {
        // empty test so jest won't fail in node < 15 due to no tests being executed
    });

    const [nodeVersion] = process.versions.node.split('.', 1);

    if (+nodeVersion < 15) {
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

    it('timeouts with nesting', async () => {
        // this will timeout and cause failure, but it will happen sooner than in 200ms, so err 1 will be thrown
        async function handler2() {
            await addTimeoutToPromise(
                () => handler(),
                100,
                'err 1',
            );
        }

        await expect(addTimeoutToPromise(
            () => handler2(),
            200,
            'err 2',
        )).rejects.toThrowError('err 1');
        expect(position).toBe(3);
    });
});
