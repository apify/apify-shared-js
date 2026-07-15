import { AsyncLocalStorage } from 'node:async_hooks';

export interface AbortContext {
    cancelTask: AbortController;
}

/**
 * A single `addTimeoutToPromise` call. Nested calls share the `cancelTask` controller of the
 * enclosing frame (so `tryCancel()` behaves the same at any depth), but each call gets its own
 * frame, which is what lets {@link extendTimeout} tell the layers apart.
 */
interface TimeoutFrame extends AbortContext {
    /** The enclosing frame, when this call is nested inside another `addTimeoutToPromise`. */
    parent?: TimeoutFrame;
    /** Pushes this frame's deadline back. Returns `false` once the frame timed out or settled. */
    extend?: (extraMillis: number) => boolean;
}

/**
 * `AsyncLocalStorage` instance that is used for baring the AbortContext inside user provided handler.
 * We can use it to access the `AbortContext` instance via `storage.getStore()`, and there we can access
 * `cancelTask` instance of `AbortController`.
 */
export const storage = new AsyncLocalStorage<AbortContext>();

/**
 * Custom error class that will be used for timeout error.
 */
export class TimeoutError extends Error {}

/**
 * Custom error class to handle `tryCancel()` checks.
 * This should not be exposed to user land, as it will be caught in.
 */
class InternalTimeoutError extends TimeoutError {}

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
export async function addTimeoutToPromise<T>(
    handler: () => Promise<T>,
    timeoutMillis: number,
    errorMessage: string | Error,
): Promise<T> {
    // respect existing context to support nesting - every call needs a store of its own for
    // `extendTimeout` to be able to tell the layers apart, but we keep prototypally inheriting from
    // the enclosing one, so that reads of anything stashed on an outer context still resolve
    const parent = storage.getStore() as TimeoutFrame | undefined;
    const context: TimeoutFrame = Object.create(parent ?? Object.prototype);
    // shared with the enclosing frame, so cancellation still propagates across the whole chain at once
    context.cancelTask = parent?.cancelTask ?? new AbortController();
    context.parent = parent;
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
        }
    };

    return new Promise((resolve, reject) => {
        let deadline = Date.now() + timeoutMillis;
        let settled = false;

        const fire = () => {
            settled = true;
            context.cancelTask.abort();
            const error = errorMessage instanceof Error ? errorMessage : new TimeoutError(errorMessage);
            reject(error);
        };

        // the callback is kept anonymous on purpose - a named one would show up in the stack trace of
        // the `TimeoutError` instead of the `Timeout._onTimeout` frame consumers match against
        let timeout = setTimeout(() => fire(), timeoutMillis);

        // the `settled` guard matters for handlers that keep running after they timed out (i.e. those
        // that don't call `tryCancel()`) - without it they could schedule a timer that never fires
        // anything useful, but still keeps the event loop alive
        context.extend = (extraMillis: number) => {
            if (settled) {
                return false;
            }

            clearTimeout(timeout);
            deadline += extraMillis;
            timeout = setTimeout(() => fire(), Math.max(deadline - Date.now(), 0));

            return true;
        };

        storage.run(context, () => {
            wrap()
                .then(() => resolve(returnValue))
                .catch(reject)
                .finally(() => {
                    settled = true;
                    clearTimeout(timeout);
                });
        });
    });
}

export interface ExtendTimeoutOptions {
    /**
     * Whether to extend the enclosing timeouts by the same amount as well. Keep this enabled (the
     * default) unless an enclosing timeout is meant to be a hard limit on the total time - with it
     * disabled, a nested handler can be killed by an outer timeout right after extending its own.
     * @default true
     */
    propagate?: boolean;
}

/**
 * Pushes the deadline of the currently running timeout back by `extraMillis`, for cases where the
 * required time is only known once the handler is already running. Call it from inside a handler
 * wrapped in {@link addTimeoutToPromise}; outside of one it is a no-op.
 *
 * ```ts
 * await addTimeoutToPromise(async () => {
 *     const pageCount = await countPages();
 *     tryCancel();
 *     // we only now know this page is a big one, so ask for 10 more seconds per page
 *     extendTimeout(pageCount * 10_000);
 *     await scrapeAllPages();
 * }, 30_000, 'Handler timed out!');
 * ```
 *
 * Enclosing timeouts are extended by the same amount by default, so that a nested handler asking for
 * more time is not killed moments later by an outer timeout it cannot see. Pass `propagate: false` to
 * extend only the innermost timeout, leaving any enclosing ones as a hard limit on the total time.
 *
 * Extending an already timed out (or already finished) handler does nothing.
 */
export function extendTimeout(extraMillis: number, options: ExtendTimeoutOptions = {}): void {
    const { propagate = true } = options;
    let frame = storage.getStore() as TimeoutFrame | undefined;

    while (frame) {
        // a frame that already timed out means the caller is running past its deadline - it must not
        // push back the enclosing ones either, those are what still bounds it
        if (frame.extend?.(extraMillis) === false) {
            return;
        }

        if (!propagate) {
            return;
        }

        frame = frame.parent;
    }
}
