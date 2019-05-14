import { expect } from 'chai';
import sinon from 'sinon';
import log from '../build/log';
import { retryWithExpBackoff, RetryableError } from '../build/exponential_backoff';

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
        expect(funcCalledTimes).to.be.eql(4);
        expect(result.data).to.be.eql(true);
    }).timeout(10000);

    it('should return other errors immediately', async () => {
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

    it('should return original error after expBackoffMaxRepeats', async () => {
        const ERROR_MESSAGE = 'Api is not available now';
        const RETRY_COUNT = 5;
        let funcCalledTimes = 0;
        let error = {};
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
        expect(error.message).to.be.eql(ERROR_MESSAGE);
        expect(error instanceof Error).to.be.eql(true);
        expect(funcCalledTimes).to.be.eql(RETRY_COUNT);
    }).timeout(15000);

    it('should validate func param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: 'String', expBackoffMaxRepeats: 10, expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Parameter "func" should be a function.');
    });

    it('should validate expBackoffMaxRepeats param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 'String', expBackoffMillis: 100 });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Parameter "expBackoffMaxRepeats" should be a number.');
    });

    it('should validate expBackoffMillis param', async () => {
        let error;
        try {
            await retryWithExpBackoff({ func: () => {}, expBackoffMaxRepeats: 5, expBackoffMillis: 'String' });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Parameter "expBackoffMillis" should be a number.');
    });

    it('should display correct message after 1/2 of retries', async () => {
        const logWarningSpy = sinon.spy(log, 'warning');

        let error;
        try {
            await retryWithExpBackoff({
                func: async () => {
                    const err = new Error('Failed because of XXX');
                    err.details = { foo: 'bar' };
                    throw new RetryableError(err);
                },
                expBackoffMaxRepeats: 6,
                expBackoffMillis: 10,
            });
        } catch (e) {
            error = e;
        }
        expect(error.message).to.be.eql('Failed because of XXX');
        expect(error.details).to.be.eql({ foo: 'bar' });

        expect(logWarningSpy.callCount).to.be.eql(1);
        expect(logWarningSpy.firstCall.args[0]).to.have.string('Retry failed 3 times and will be repeated in ');
        expect(logWarningSpy.firstCall.args[1]).to.eql({
            errorDetails: { foo: 'bar' },
            originalError: 'Failed because of XXX',
        });
    });
});
