// eslint-disable-next-line max-classes-per-file
import { setTimeout } from 'timers/promises';
import { AsyncLocalStorage } from 'async_hooks';

export interface AbortContext {
    cancelTimeout: AbortController;
    cancelTask: AbortController;
}

/**
 * `AsyncLocalStorage` instance that is used for baring the AbortContext inside user provided handler.
 * We can use it to access the `AbortContext` instance via `storage.getStore()`, and there we can access
 * both `cancelTimeout` and `cancelTask` instances of `AbortController`.
 */
export const storage = new AsyncLocalStorage<AbortContext>();

/**
 * Custom error class that will be used for timeout error.
 */
export class TimeoutError extends Error {
}

/**
 * Custom error class to handle `tryCancel()` checks.
 * This should not be exposed to user land, as it will be caught in.
 */
class InternalTimeoutError extends TimeoutError {
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
export function tryCancel(): void {
    const signal = storage.getStore()?.cancelTask.signal;

    if (signal?.aborted) {
        throw new InternalTimeoutError('Promise handler has been canceled due to a timeout');
    }
}

/**
 * Runs given handler and rejects with the given `errorMessage` (or `Error` instance)
 * after given `timeoutMillis`, unless the original promise resolves or rejects earlier.
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
    // respect existing context to support nesting
    const context = storage.getStore() ?? {
        cancelTimeout: new AbortController(),
        cancelTask: new AbortController(),
    };
    let returnValue: T;

    // calls handler, skips internal `TimeoutError`s that might have been thrown
    // via `tryCancel()` and aborts the timeout promise after the handler finishes
    const wrap = async () => {
        try {
            returnValue = await handler();
        } catch (e) {
            if (!(e instanceof InternalTimeoutError)) {
                throw e;
            }
        } finally {
            context.cancelTimeout.abort();
        }
    };

    const timeout = async () => {
        try {
            await setTimeout(timeoutMillis, undefined, { signal: context.cancelTimeout.signal });
            context.cancelTask.abort();
        } catch (e) {
            // ignore rejections (task finished and timeout promise has been cancelled)
            return;
        }

        throw errorMessage instanceof Error
            ? errorMessage
            : new TimeoutError(errorMessage);
    };

    await new Promise((resolve, reject) => {
        storage.run(context, () => {
            Promise.race([timeout(), wrap()]).then(resolve, reject);
        });
    });

    return returnValue!;
}
