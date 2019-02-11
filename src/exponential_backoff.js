import _ from 'underscore';
import log from './log';
import { delayPromise } from './utilities';

export class RetryableError extends Error {}

export const retryWithExpBackoff = async (params = {}) => {
    const { func, expBackoffMillis, expBackoffMaxRepeats } = params;
    if (typeof func !== 'function') {
        throw new Error('Param func should be type of function');
    }
    if (typeof expBackoffMillis !== 'number') {
        throw new Error('Param expBackoffMillis should be type of number');
    }
    if (typeof expBackoffMaxRepeats !== 'number') {
        throw new Error('Param expBackoffMaxRepeats should be type of number');
    }
    let iteration = 0;
    while (iteration <= expBackoffMaxRepeats) {
        let result;
        let error;

        try {
            result = await func();
        } catch (e) {
            error = e;
        }

        if (result) {
            return result;
        }

        if (error instanceof RetryableError) {
            const waitMillis = expBackoffMillis * (2 ** iteration);
            const randomizedWaitMillis = _.random(waitMillis, waitMillis * 2);
            if (iteration === Math.round(expBackoffMaxRepeats / 2)) {
                log.warning(`Retry failed ${iteration} times and will be repeated in ${randomizedWaitMillis}ms`, error);
            }

            await delayPromise(randomizedWaitMillis);
        } else {
            throw error;
        }

        if (iteration > expBackoffMaxRepeats) {
            throw error;
        }
        iteration += 1;
    }
};
