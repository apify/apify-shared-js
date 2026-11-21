import { getEventListeners } from 'node:events';
import { setTimeout } from 'node:timers/promises';

import { beforeEach, describe, expect, it } from 'vitest';

import type { ExtendTimeoutOptions } from '@apify/timeout';
import { addTimeoutToPromise, extendTimeout, storage, suspendTimeout, tryCancel } from '@apify/timeout';

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

    it('does not cancel the enclosing handler when a nested one times out', async () => {
        let outerSignal: AbortSignal | undefined;

        const res = await addTimeoutToPromise(
            async () => {
                outerSignal = storage.getStore()!.cancelTask.signal;
                await addTimeoutToPromise(async () => setTimeout(100), 20, 'inner timed out').catch(() => {});
                tryCancel();

                return 123;
            },
            200,
            'outer timed out',
        );

        expect(res).toBe(123);
        expect(outerSignal!.aborted).toBe(false);
    });

    it('cancels the nested handlers when the enclosing one times out', async () => {
        let innerSignal: AbortSignal | undefined;

        const promise = addTimeoutToPromise(
            async () =>
                addTimeoutToPromise(
                    async () => {
                        innerSignal = storage.getStore()!.cancelTask.signal;
                        await handler();
                    },
                    1000,
                    'inner timed out',
                ),
            100,
            'outer timed out',
        );

        await expect(promise).rejects.toThrow('outer timed out');
        expect(innerSignal!.aborted).toBe(true);
        await setTimeout(60);
        expect(position).toBe(3);
    });

    it('cancels work left behind by an already finished nested handler', async () => {
        let background: Promise<void> | undefined;
        let finished = false;

        const promise = addTimeoutToPromise(
            async () => {
                await addTimeoutToPromise(
                    async () => {
                        background = (async () => {
                            await setTimeout(80);
                            tryCancel();
                            finished = true;
                        })();
                    },
                    1000,
                    'inner timed out',
                );
                await setTimeout(200);
            },
            40,
            'outer timed out',
        );

        await expect(promise).rejects.toThrow('outer timed out');
        await background!.catch(() => {});
        expect(finished).toBe(false);
    });

    it('releases the enclosing signal once a nested handler settles', async () => {
        await addTimeoutToPromise(
            async () => {
                const outerSignal = storage.getStore()!.cancelTask.signal;

                for (let i = 0; i < 5; i++) {
                    await addTimeoutToPromise(async () => setTimeout(1), 1000, 'inner timed out');
                }

                // the cleanup runs a few microtasks after the nested call resolves
                await setTimeout(0);
                expect(getEventListeners(outerSignal, 'abort')).toHaveLength(0);
            },
            1000,
            'outer timed out',
        );
    });

    it('releases the enclosing signal once a nested handler that never settles timed out', async () => {
        await addTimeoutToPromise(
            async () => {
                const outerSignal = storage.getStore()!.cancelTask.signal;

                for (let i = 0; i < 5; i++) {
                    await addTimeoutToPromise(async () => new Promise(() => {}), 5, 'inner timed out').catch(() => {});
                }

                expect(getEventListeners(outerSignal, 'abort')).toHaveLength(0);
            },
            1000,
            'outer timed out',
        );
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
        // each call has a store of its own, but it must still inherit from the enclosing one
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

    it('does not extend the enclosing timeouts once the handler timed out', async () => {
        // no `tryCancel()`, so the inner handler keeps running after it timed out - the extension it
        // asks for then must not push back the outer timeout that is still bounding it
        const promise = addTimeoutToPromise(
            async () => {
                await addTimeoutToPromise(
                    async () => {
                        await setTimeout(60);
                        extendTimeout(5000);
                    },
                    30,
                    'inner timed out',
                ).catch(() => {});

                await setTimeout(120);

                return 123;
            },
            100,
            'outer timed out',
        );

        await expect(promise).rejects.toThrow('outer timed out');
    });
});

describe('suspendTimeout', () => {
    it('does not count the suspended time', async () => {
        const res = await addTimeoutToPromise(
            async () => {
                await setTimeout(40);
                await suspendTimeout(async () => setTimeout(150));
                await setTimeout(30);

                return 123;
            },
            100,
            'timed out',
        );

        expect(res).toBe(123);
    });

    it('returns what the handler returns and rethrows what it throws', async () => {
        await addTimeoutToPromise(
            async () => {
                await expect(suspendTimeout(async () => 123)).resolves.toBe(123);
                await expect(
                    suspendTimeout(async () => {
                        throw new Error('handler failed');
                    }),
                ).rejects.toThrow('handler failed');
            },
            100,
            'timed out',
        );
    });

    it('still times out once the clock runs again', async () => {
        const promise = addTimeoutToPromise(
            async () => {
                await setTimeout(40);
                await suspendTimeout(async () => setTimeout(100));
                await setTimeout(150);
            },
            100,
            'timed out',
        );

        await expect(promise).rejects.toThrow('timed out');
    });

    it('starts the clock again when the handler throws', async () => {
        const promise = addTimeoutToPromise(
            async () => {
                await suspendTimeout(async () => {
                    await setTimeout(150);
                    throw new Error('handler failed');
                }).catch(() => {});
                await setTimeout(200);
            },
            100,
            'timed out',
        );

        await expect(promise).rejects.toThrow('timed out');
    });

    it('suspends the enclosing timeouts too', async () => {
        const res = await addTimeoutToPromise(
            async () =>
                addTimeoutToPromise(
                    async () => {
                        await suspendTimeout(async () => setTimeout(200));

                        return 123;
                    },
                    100,
                    'inner timed out',
                ),
            150,
            'outer timed out',
        );

        expect(res).toBe(123);
    });

    it('leaves the enclosing timeouts running with `propagate: false`', async () => {
        const promise = addTimeoutToPromise(
            async () =>
                addTimeoutToPromise(
                    async () => suspendTimeout(async () => setTimeout(200), { propagate: false }),
                    100,
                    'inner timed out',
                ),
            150,
            'outer timed out',
        );

        await expect(promise).rejects.toThrow('outer timed out');
    });

    it('keeps the timeouts started inside the handler running', async () => {
        const res = await addTimeoutToPromise(
            async () =>
                suspendTimeout(async () =>
                    addTimeoutToPromise(async () => setTimeout(200), 50, 'nested timed out').catch(
                        (e: Error) => e.message,
                    ),
                ),
            1000,
            'timed out',
        );

        expect(res).toBe('nested timed out');
    });

    it('restarts the clock only after the last overlapping suspension ends', async () => {
        const res = await addTimeoutToPromise(
            async () => {
                await setTimeout(60);
                // resuming after the shorter one would leave ~40ms for the remaining ~100ms of the longer one
                await Promise.all([
                    suspendTimeout(async () => setTimeout(40)),
                    suspendTimeout(async () => setTimeout(140)),
                ]);

                return 123;
            },
            100,
            'timed out',
        );

        expect(res).toBe(123);
    });

    it('applies an extension made while suspended without restarting the clock', async () => {
        const res = await addTimeoutToPromise(
            async () => {
                await setTimeout(30);
                await suspendTimeout(async () => {
                    extendTimeout(100);
                    // well past the extended deadline, which would have fired had the clock been restarted
                    await setTimeout(250);
                });
                // only fits into the remaining ~70ms thanks to the extension
                await setTimeout(120);

                return 123;
            },
            100,
            'timed out',
        );

        expect(res).toBe(123);
    });

    it('just runs the handler outside of a timeout handler', async () => {
        await expect(suspendTimeout(async () => 123)).resolves.toBe(123);
    });

    it('does not suspend the enclosing timeouts once the handler timed out', async () => {
        // no `tryCancel()`, so the inner handler keeps running after it timed out
        const promise = addTimeoutToPromise(
            async () => {
                await addTimeoutToPromise(
                    async () => {
                        await setTimeout(60);
                        await suspendTimeout(async () => setTimeout(300));
                    },
                    30,
                    'inner timed out',
                ).catch(() => {});

                await setTimeout(120);

                return 123;
            },
            100,
            'outer timed out',
        );

        await expect(promise).rejects.toThrow('outer timed out');
    });
});
