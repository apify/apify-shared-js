import _ from 'underscore';
import log from './log';
import { delayPromise } from './utilities';

export class RetryableError extends Error {}

export const retryWithExpBackoff = async (params = {}) => {
    const { func, expBackoffMillis, expBackoffMaxRepeats } = params;
    if (typeof func !== 'function') {
        throw new Error('Parameter func should be function');
    }
    if (typeof expBackoffMillis !== 'number') {
        throw new Error('Parameter expBackoffMillis should be number');
    }
    if (typeof expBackoffMaxRepeats !== 'number') {
        throw new Error('Parameter expBackoffMaxRepeats should be number');
    }

    for (let i = 0; i < expBackoffMaxRepeats; i++) {
        let error;

        try {
            return await func();
        } catch (e) {
            error = e;
        }

        if (!(error instanceof RetryableError) || i === expBackoffMaxRepeats - 1) {
            throw error;
        }

        const waitMillis = expBackoffMillis * (2 ** i);
        const randomizedWaitMillis = _.random(waitMillis, waitMillis * 2);

        if (i === Math.round(expBackoffMaxRepeats / 2)) {
            log.warning(`Retry failed ${i} times and will be repeated in ${randomizedWaitMillis}ms`, error);
        }

        await delayPromise(randomizedWaitMillis);
    }
};
