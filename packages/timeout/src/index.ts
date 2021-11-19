import { setTimeout } from 'timers/promises';
import { AsyncLocalStorage } from 'async_hooks';

export interface AbortContext {
    cancelTimeout: AbortController;
    cancelTask: AbortController;
}

/**
 * AsyncLocalStorage instance that is used for baring the AbortContext inside user provided handler.
 */
export const storage = new AsyncLocalStorage<AbortContext>();

/**
 * Custom error class to handle tryCancel() checks.
 * This should not be exposed to user land, as it will be caught in.
 */
export class TimeoutError extends Error {
}

/**
 * Checks whether we are inside timeout handler created by this package, and cancels current
 * task execution by throwing `TimeoutError`. This error will be ignored if the promise timed
 * out already, or explicitly skipped in `addTimeoutToPromise`.
 *
 * Use this function after every async call that runs inside the timeout handler:
 *
 * ```ts
 * async function doSomething() {
 *     await doSomethingTimeConsuming();
 *     tryCancel();
 *     await doSomethingElse();
 *     tryCancel();
 * }
 * ```
 */
export function tryCancel() {
    const { signal } = storage.getStore()?.cancelTask ?? {};

    if (signal?.aborted) {
        throw new TimeoutError('Promise handler has been canceled due to a timeout');
    }
}

/**
 * Runs given handler and rejects with the given errorMessage (or Error instance)
 * after given timeoutMillis, unless the original promise resolves or rejects earlier.
 * Use `tryCancel()` function inside the handler after each await to finish its execution
 * early when the timeout appears.
 *
 * ```ts
 * const res = await addTimeoutToPromise(
 *   () => handler(),
 *   200,
 *   'Handler timed out after 200ms!',
 * );
 * ```
 */
export async function addTimeoutToPromise<T>(handler: () => Promise<T>, timeoutMillis: number, errorMessage: string | Error): Promise<T> {
    const cancelTimeout = new AbortController();
    const cancelTask = new AbortController();
    let ret: T;

    const wrap = async () => {
        try {
            ret = await handler();
        } catch (e) {
            if (!(e instanceof TimeoutError)) {
                throw e;
            }
        } finally {
            storage.getStore()?.cancelTimeout.abort();
        }
    };

    const timeout = async () => {
        try {
            await setTimeout(timeoutMillis, undefined, {
                signal: storage.getStore()?.cancelTimeout.signal,
            });
            storage.getStore()?.cancelTask.abort();
        } catch {
            // ignore rejections (task finished and timeout has been cancelled
            return;
        }

        throw errorMessage instanceof Error
            ? errorMessage
            : new TimeoutError(errorMessage);
    };

    await new Promise((resolve, reject) => {
        storage.run({ cancelTimeout, cancelTask }, () => {
            Promise.race([timeout(), wrap()]).then(resolve, reject);
        });
    });

    return ret!;
}
