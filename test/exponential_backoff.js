import { expect } from 'chai';
import { retryWithExpBackoff, RetryableError } from '../build/exponential_backoff';

describe('exponential_backoff', () => {
    it('Should retry retryable error and return result', async () => {
        let funcCalledTimes = 0;
        const sometimesFails = () => {
            const throws = [true, true, true, true, false];

            funcCalledTimes += 1;

            if (throws[funcCalledTimes]) {
                throw new RetryableError('Api is not available now');
            } else {
                return { data: true };
            }
        };
        const result = await retryWithExpBackoff({
            func: sometimesFails,
            expBackoffMaxRepeats: 5,
            expBackoffMillis: 100,
        });
        expect(funcCalledTimes).to.be.eql(4);
        expect(result.data).to.be.eql(true);
    }).timeout(10000);

    it('Should return other errors immediately', async () => {
        const ERROR_MESSAGE = 'Unresolved variable x';
        let funcCalledTimes = 0;
        const returnsError = () => {
            funcCalledTimes += 1;
            throw new Error(ERROR_MESSAGE);
        };
        try {
            await retryWithExpBackoff({
                func: returnsError(),
                expBackoffMaxRepeats: 5,
                expBackoffMillis: 100,
            });
        } catch (e) {
            expect(e.message).to.be.eql(ERROR_MESSAGE);
            expect(funcCalledTimes).to.be.eql(1);
        }
    });

    it('Should return Retryable error after expBackoffMaxRepeats', async () => {
        const ERROR_MESSAGE = 'Api is not available now';
        const RETRY_COUNT = 5;
        let funcCalledTimes = 0;
        const alwaysThrowsRetryableError = () => {
            funcCalledTimes += 1;
            throw new RetryableError(ERROR_MESSAGE);
        };
        try {
            await retryWithExpBackoff({
                func: alwaysThrowsRetryableError,
                expBackoffMaxRepeats: RETRY_COUNT,
                expBackoffMillis: 100,
            });
        } catch (e) {
            expect(e.message).to.be.eql(ERROR_MESSAGE);
            expect(funcCalledTimes).to.be.eql(RETRY_COUNT);
        }
    }).timeout(10000);

    it('Should validate func param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: 'String', expBackoffMaxRepeats: 10, expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Param func should be type of function');
    });

    it('Should validate expBackoffMaxRepeats param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 'String', expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Param expBackoffMaxRepeats should be type of number');
    });

    it('Should validate expBackoffMillis param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 5, expBackoffMillis: 'String' });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Param expBackoffMillis should be type of number');
    });
});
