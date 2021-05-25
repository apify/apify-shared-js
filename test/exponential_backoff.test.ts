import log, { Exception } from '@apify/log';
import { retryWithExpBackoff, RetryableError } from '@apify/utilities';

describe('exponential_backoff', () => {
    it('should retry retryable error and return result', async () => {
        let funcCalledTimes = 0;
        const sometimesFails = () => {
            const throws = [true, true, true, true, false];

            funcCalledTimes += 1;

            if (throws[funcCalledTimes]) {
                throw new RetryableError(new Error('Api not available'));
            } else {
                return { data: true };
            }
        };
        const result = await retryWithExpBackoff({
            func: sometimesFails,
            expBackoffMaxRepeats: 5,
            expBackoffMillis: 100,
        });
        expect(funcCalledTimes).toBe(4);
        expect(result.data).toBe(true);
    }, 10e3);

    it('should return other errors immediately', async () => {
        const ERROR_MESSAGE = 'Unresolved variable x';
        let funcCalledTimes = 0;
        const returnsError = () => {
            funcCalledTimes += 1;
            throw new Error(ERROR_MESSAGE);
        };
        try {
            await retryWithExpBackoff({
                func: returnsError,
                expBackoffMaxRepeats: 5,
                expBackoffMillis: 100,
            });
        } catch (e) {
            expect(e.message).toBe(ERROR_MESSAGE);
            expect(funcCalledTimes).toBe(1);
        }
    });

    it('should return original error after expBackoffMaxRepeats', async () => {
        const ERROR_MESSAGE = 'Api is not available now';
        const RETRY_COUNT = 5;
        let funcCalledTimes = 0;
        let error = {} as Error;
        const alwaysThrowsRetryableError = () => {
            funcCalledTimes += 1;
            throw new RetryableError(new Error(ERROR_MESSAGE));
        };
        try {
            await retryWithExpBackoff({
                func: alwaysThrowsRetryableError,
                expBackoffMaxRepeats: RETRY_COUNT,
                expBackoffMillis: 50,
            });
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe(ERROR_MESSAGE);
        expect(error instanceof Error).toBe(true);
        expect(funcCalledTimes).toBe(RETRY_COUNT);
    }, 15e3);

    it('should validate func param', async () => {
        let error;
        try {
            // @ts-expect-error
            await retryWithExpBackoff({ func: 'String', expBackoffMaxRepeats: 10, expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe('Parameter "func" should be a function.');
    });

    it('should validate expBackoffMaxRepeats param', async () => {
        let error;
        try {
            // @ts-expect-error
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 'String', expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe('Parameter "expBackoffMaxRepeats" should be a number.');
    });

    it('should validate expBackoffMillis param', async () => {
        let error;
        try {
            // @ts-expect-error
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 5, expBackoffMillis: 'String' });
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe('Parameter "expBackoffMillis" should be a number.');
    });

    it('should display correct message after 1/2 of retries', async () => {
        const logWarningSpy = jest.spyOn(log, 'warning');

        let error;
        try {
            await retryWithExpBackoff({
                func: async () => {
                    const err = new Error('Failed because of XXX') as Exception;
                    err.details = { foo: 'bar' };
                    throw new RetryableError(err);
                },
                expBackoffMaxRepeats: 6,
                expBackoffMillis: 10,
            });
        } catch (e) {
            error = e;
        }
        expect(error.message).toBe('Failed because of XXX');
        expect(error.details).toEqual({ foo: 'bar' });

        expect(logWarningSpy).toBeCalledTimes(1);
        expect(logWarningSpy.mock.calls[0][0]).toMatch('Retry failed 3 times and will be repeated in ');
        expect(logWarningSpy.mock.calls[0][1]).toEqual({
            errorDetails: { foo: 'bar' },
            originalError: 'Failed because of XXX',
        });
    });
});
