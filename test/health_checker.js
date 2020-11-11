import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import HealthChecker from '../build/health_checker';

chai.use(chaiAsPromised);

describe('HealthChecker', () => {
    const mongoDbWriteTestCollection = 'some-collection';

    const redis = {
        get: sinon.stub(),
        set: sinon.stub(),
    };

    const mongoRead = {
        listCollections: sinon.stub(),
    };

    const writeTestCollection = {
        insert: sinon.stub(),
        findOne: sinon.stub(),
        remove: sinon.stub(),
    };

    const mongoWrite = {
        collection: (name) => {
            expect(name).to.be.eql(mongoDbWriteTestCollection);

            return writeTestCollection;
        },
    };

    const healthChecker = new HealthChecker({
        mongoDbWriteTestCollection,
        checkTimeoutMillis: 100,
        checks: [
            { type: HealthChecker.CHECK_TYPES.REDIS, client: redis },
            { type: HealthChecker.CHECK_TYPES.MONGODB_READ, client: mongoRead },
            { type: HealthChecker.CHECK_TYPES.MONGODB_WRITE, client: mongoWrite },
        ],
    });

    // Reset all stubs after each test.
    afterEach(() => {
        sinon.reset();
    });

    it('should pass when all checks pass', async () => {
        redis.get.onFirstCall().returns('OK');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.onFirstCall().returns({ some: 'object' });

        await healthChecker.ensureIsHealthy();

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
        sinon.assert.calledOnce(mongoRead.listCollections);
        sinon.assert.calledOnce(writeTestCollection.insert);
        sinon.assert.calledOnce(writeTestCollection.findOne);
        sinon.assert.calledOnce(writeTestCollection.remove);
    });

    it('should fail when some of the checks returns something wrong.', async () => {
        redis.get.onFirstCall().returns('OK');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });

        // Item was not found.
        writeTestCollection.findOne.onFirstCall().returns(undefined);

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith();

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
        sinon.assert.calledOnce(mongoRead.listCollections);
        sinon.assert.calledOnce(writeTestCollection.insert);
        sinon.assert.calledOnce(writeTestCollection.findOne);
        sinon.assert.calledOnce(writeTestCollection.remove);
    });

    it('should fail when some of the checks returns something wrong.', async () => {
        redis.get.onFirstCall().returns('OK');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });

        // Throws an error
        writeTestCollection.findOne.onFirstCall().throws(new Error('some problem'));

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith('Health check test "MONGODB_WRITE" failed with an error: some problem"');

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
        sinon.assert.calledOnce(mongoRead.listCollections);
        sinon.assert.calledOnce(writeTestCollection.insert);
        sinon.assert.calledOnce(writeTestCollection.findOne);
        sinon.assert.calledOnce(writeTestCollection.remove);
    });

    it('should fail when some of the checks timeouts', async () => {
        redis.get.onFirstCall().returns(new Promise((resolve) => setTimeout(resolve, 200))); // Timeouts.

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith('Health check test "REDIS" failed with an error: Check has timed-out');

        sinon.assert.calledOnce(redis.set);
    });

    it('should fail when redis returns invalid value', async () => {
        redis.get.onFirstCall().returns('NOPE');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.onFirstCall().returns({ some: 'object' });

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith(
            'Health check test "REDIS" failed with an error: Returned value "NOPE" is not equal to "OK"!',
        );

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
    });

    it('should fail when mongo returns invalid value', async () => {
        redis.get.onFirstCall().returns('OK');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });

        // Throws an error
        writeTestCollection.findOne.onFirstCall().throws(new Error('some problem'));

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith('Health check test "MONGODB_WRITE" failed with an error: some problem"');

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
        sinon.assert.calledOnce(mongoRead.listCollections);
        sinon.assert.calledOnce(writeTestCollection.insert);
        sinon.assert.calledOnce(writeTestCollection.findOne);
        sinon.assert.calledOnce(writeTestCollection.remove);
    });

    it('should fail when mongo cannot read', async () => {
        redis.get.onFirstCall().returns('OK');
        mongoRead.listCollections.onFirstCall().returns({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.throws(new Error('some-problem'));

        await expect(healthChecker.ensureIsHealthy()).to.be.rejectedWith('Health check test "MONGODB_WRITE" failed with an error: some-problem"');

        sinon.assert.calledOnce(redis.set);
        sinon.assert.calledOnce(redis.get);
        sinon.assert.calledOnce(mongoRead.listCollections);
        sinon.assert.calledOnce(writeTestCollection.insert);
        sinon.assert.calledOnce(writeTestCollection.findOne);
        sinon.assert.calledOnce(writeTestCollection.remove);
    });

    it('should correctly validate checks', async () => {
        expect(() => new HealthChecker({ checks: null })).to.throw('Parameter "check" must be an array');
        expect(() => new HealthChecker({ checks: [{ type: 'xxx', client: {} }] })).to.throw('Check type "xxx" is invalid');
        expect(() => new HealthChecker({ checks: [{ type: HealthChecker.CHECK_TYPES.REDIS, client: 123 }] })).to.throw(
            'Check client must be an object got "number" instead',
        );
    });
});
