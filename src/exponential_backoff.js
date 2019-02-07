import _ from 'underscore';
import log from './log';

export class RetryableError extends Error {}

export const retryWithExpBackoff = async (params = {}) => {
    const { func, expBackoffMillis, expBackoffMaxRepeats } = params;
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
            iteration += 1;

            await new Promise(resolve => setTimeout(resolve, randomizedWaitMillis));
        } else {
            throw error;
        }

        if (iteration >= expBackoffMaxRepeats) {
            throw error;
        }
    }
};
