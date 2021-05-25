import log, { Exception } from '@apify/log';
import { delayPromise } from './utilities';

export class RetryableError extends Error {
    readonly error: Exception;

    constructor(error: Error | Exception, ...args: unknown[]) {
        super(...args as [string]);
        this.error = error as Exception;
    }
}

// extend the error with added properties
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RetryableError extends Exception {}

export async function retryWithExpBackoff<T>(
    params: { func?: (...args: unknown[]) => T, expBackoffMillis?: number, expBackoffMaxRepeats?: number } = {},
): Promise<T> {
    const { func, expBackoffMillis, expBackoffMaxRepeats } = params;

    if (typeof func !== 'function') {
        throw new Error('Parameter "func" should be a function.');
    }

    if (typeof expBackoffMillis !== 'number') {
        throw new Error('Parameter "expBackoffMillis" should be a number.');
    }

    if (typeof expBackoffMaxRepeats !== 'number') {
        throw new Error('Parameter "expBackoffMaxRepeats" should be a number.');
    }

    for (let i = 0; ; i++) {
        let error;

        try {
            return await func();
        } catch (e) {
            error = e;
        }

        if (!(error instanceof RetryableError)) {
            throw error;
        }

        if (i >= expBackoffMaxRepeats - 1) {
            throw error.error;
        }

        const waitMillis = expBackoffMillis * (2 ** i);
        const rand = (from: number, to: number) => from + Math.floor(Math.random() * (to - from + 1));
        const randomizedWaitMillis = rand(waitMillis, waitMillis * 2);

        if (i === Math.round(expBackoffMaxRepeats / 2)) {
            log.warning(`Retry failed ${i} times and will be repeated in ${randomizedWaitMillis}ms`, {
                originalError: error.error.message,
                errorDetails: error.error.details,
            });
        }

        await delayPromise(randomizedWaitMillis);
    }
}
