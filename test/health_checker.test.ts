import { HealthChecker } from '@apify/utilities';

describe('HealthChecker', () => {
    const mongoDbWriteTestCollection = 'some-collection';

    const redis = {
        get: jest.fn(),
        set: jest.fn(),
    };

    const mongoRead = {
        listCollections: jest.fn(),
    };

    const writeTestCollection = {
        insertOne: jest.fn(),
        findOne: jest.fn(),
        deleteMany: jest.fn(),
    };

    const mongoWrite = {
        collection: (name: string) => {
            expect(name).toBe(mongoDbWriteTestCollection);

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
        jest.resetAllMocks();
    });

    it('should pass when all checks pass', async () => {
        redis.get.mockReturnValueOnce('OK');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.mockReturnValueOnce({ some: 'object' });

        await healthChecker.ensureIsHealthy();

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
        expect(mongoRead.listCollections).toBeCalledTimes(1);
        expect(writeTestCollection.insertOne).toBeCalledTimes(1);
        expect(writeTestCollection.findOne).toBeCalledTimes(1);
        expect(writeTestCollection.deleteMany).toBeCalledTimes(1);
    });

    it('should fail when some of the checks returns something wrong (1).', async () => {
        redis.get.mockReturnValueOnce('OK');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });

        // Item was not found.
        writeTestCollection.findOne.mockReturnValueOnce(undefined);

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow();

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
        expect(mongoRead.listCollections).toBeCalledTimes(1);
        expect(writeTestCollection.insertOne).toBeCalledTimes(1);
        expect(writeTestCollection.findOne).toBeCalledTimes(1);
        expect(writeTestCollection.deleteMany).toBeCalledTimes(1);
    });

    it('should fail when some of the checks returns something wrong (2).', async () => {
        redis.get.mockReturnValueOnce('OK');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });

        // Throws an error
        writeTestCollection.findOne.mockImplementationOnce(() => { throw new Error('some problem'); });

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow('Health check test "MONGODB_WRITE" failed with an error: some problem"');

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
        expect(mongoRead.listCollections).toBeCalledTimes(1);
        expect(writeTestCollection.insertOne).toBeCalledTimes(1);
        expect(writeTestCollection.findOne).toBeCalledTimes(1);
        expect(writeTestCollection.deleteMany).toBeCalledTimes(1);
    });

    it('should fail when some of the checks timeouts', async () => {
        redis.get.mockReturnValueOnce(new Promise((resolve) => setTimeout(resolve, 200))); // Timeouts.

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow('Health check test "REDIS" failed with an error: Check has timed-out');

        expect(redis.set).toBeCalledTimes(1);
    });

    it('should fail when redis returns invalid value', async () => {
        redis.get.mockReturnValueOnce('NOPE');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.mockReturnValueOnce({ some: 'object' });

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow(
            'Health check test "REDIS" failed with an error: Returned value "NOPE" is not equal to "OK"!',
        );

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
    });

    it('should fail when mongo returns invalid value', async () => {
        redis.get.mockReturnValueOnce('OK');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });

        // Throws an error
        writeTestCollection.findOne.mockImplementationOnce(() => { throw new Error('some problem'); });

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow('Health check test "MONGODB_WRITE" failed with an error: some problem"');

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
        expect(mongoRead.listCollections).toBeCalledTimes(1);
        expect(writeTestCollection.insertOne).toBeCalledTimes(1);
        expect(writeTestCollection.findOne).toBeCalledTimes(1);
        expect(writeTestCollection.deleteMany).toBeCalledTimes(1);
    });

    it('should fail when mongo cannot read', async () => {
        redis.get.mockReturnValueOnce('OK');
        mongoRead.listCollections.mockReturnValueOnce({ toArray: () => Promise.resolve([]) });
        writeTestCollection.findOne.mockImplementationOnce(() => { throw new Error('some-problem'); });

        await expect(healthChecker.ensureIsHealthy()).rejects.toThrow('Health check test "MONGODB_WRITE" failed with an error: some-problem"');

        expect(redis.set).toBeCalledTimes(1);
        expect(redis.get).toBeCalledTimes(1);
        expect(mongoRead.listCollections).toBeCalledTimes(1);
        expect(writeTestCollection.insertOne).toBeCalledTimes(1);
        expect(writeTestCollection.findOne).toBeCalledTimes(1);
        expect(writeTestCollection.deleteMany).toBeCalledTimes(1);
    });

    it('should correctly validate checks', async () => {
        // @ts-expect-error
        expect(() => new HealthChecker({ checks: null })).toThrow('Parameter "check" must be an array');
        // @ts-expect-error
        expect(() => new HealthChecker({ checks: [{ type: 'xxx', client: {} }] })).toThrow('Check type "xxx" is invalid');
        // @ts-expect-error
        expect(() => new HealthChecker({ checks: [{ type: HealthChecker.CHECK_TYPES.REDIS, client: 123 }] })).toThrow(
            'Check client must be an object got "number" instead',
        );
    });
});
