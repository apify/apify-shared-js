import _ from 'underscore';
import { expect } from 'chai';
import sinon from 'sinon';
import { Log, LOG_LEVELS } from '../build/log';
import { ENV_VARS } from '../src/consts';

const dummyLogger = {
    log: () => {},
};

describe('log', () => {
    let loggerMock;

    beforeEach(() => {
        loggerMock = sinon.mock(dummyLogger);
    });

    afterEach(() => {
        loggerMock.restore();
    });

    it('allows to set/get options', () => {
        const log = new Log({ prefix: 'aaa' });
        const options1 = Object.assign({}, log.getOptions());
        log.setOptions({ prefix: 'bbb' });
        const options2 = Object.assign({}, log.getOptions());

        expect(options1.prefix).to.be.eql('aaa');
        expect(options2.prefix).to.be.eql('bbb');
    });

    it('gets correcty set log level based on ENV_VAR', () => {
        process.env[ENV_VARS.LOG_LEVEL] = LOG_LEVELS.SOFT_FAIL;
        const log = new Log();
        expect(log.getOptions().logLevel).to.be.eql(LOG_LEVELS.SOFT_FAIL);

        process.env[ENV_VARS.LOG_LEVEL] = LOG_LEVELS.ERROR;
        const log2 = new Log();
        expect(log2.getOptions().logLevel).to.be.eql(LOG_LEVELS.ERROR);

        delete process.env[ENV_VARS.LOG_LEVEL];
    });

    it('should allow to create a child logger with inherrited config', () => {
        const log1 = new Log({ prefix: 'aaa' });
        const log2 = log1.child({ suffix: 'bbb' });

        expect(log1.getOptions().prefix).to.be.eql('aaa');
        expect(log1.getOptions().suffix).to.be.eql(null);
        expect(log2.getOptions().prefix).to.be.eql('aaa');
        expect(log2.getOptions().suffix).to.be.eql('bbb');
    });

    it('should support error() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.ERROR, 'Error happened', { foo: 'bar' });
        log.error('Error happened', { foo: 'bar' });
    });

    it('should support exception() method', () => {
        const log = new Log({ logger: dummyLogger });
        const err = new Error('some-error');

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.ERROR, 'Error happened', { foo: 'bar' }, _.pick(err, 'name', 'message', 'stack'));
        log.exception(err, 'Error happened', { foo: 'bar' });
    });

    it('should support softFail() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.SOFT_FAIL, 'Soft fail happened', { foo: 'bar' });
        log.softFail('Soft fail happened', { foo: 'bar' });
    });

    it('should support warning() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.WARNING, 'Something to be warn about happened', { foo: 'bar' });
        log.warning('Something to be warn about happened', { foo: 'bar' });
    });

    it('should support info() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.INFO, 'Something to be informed about happened', { foo: 'bar' });
        log.info('Something to be informed about happened', { foo: 'bar' });
    });

    it('should support debug() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.DEBUG, 'Something to be debugged happened', { foo: 'bar' });
        log.debug('Something to be debugged happened', { foo: 'bar' });
    });

    it('should support perf() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.PERF, 'Some perf info', { foo: 'bar' });
        log.perf('Some perf info', { foo: 'bar' });
    });

    it('should support methodCall() method', () => {
        const log = new Log({ logger: dummyLogger });
        const methodName = 'someName';
        const userId = 'someId';
        const connection = { clientAddress: '127.0.0.1' };
        const self = { userId, connection };
        const args = { foo: 'bar' };

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.INFO, 'Method called', {
            methodName,
            loggedUserId: userId,
            clientIp: connection.clientAddress,
            args,
        });
        log.methodCall(self, methodName, args);
    });

    it('should support methodException() method', () => {
        const log = new Log({ logger: dummyLogger });
        const methodName = 'someName';
        const userId = 'someId';
        const self = { userId };
        const args = { foo: 'bar' };
        const err = new Error('some-error');

        loggerMock.expects('log').once().withArgs(
            LOG_LEVELS.ERROR,
            'Method threw an exception',
            {
                methodName,
                loggedUserId: userId,
                clientIp: null,
                args,
            },
            _.pick(err, 'name', 'message', 'stack'),
            { prefix: null, suffix: null },
        );
        log.methodException(err, self, methodName, args);

    });

    it('should support deprecated() method', () => {
        const log = new Log({ logger: dummyLogger });

        loggerMock.expects('log').once().withArgs(LOG_LEVELS.WARNING, 'Message 1');
        loggerMock.expects('log').once().withArgs(LOG_LEVELS.WARNING, 'Message 2');
        loggerMock.expects('log').once().withArgs(LOG_LEVELS.WARNING, 'Message 3');
        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');
        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');
        log.deprecated('Message 1');
        log.deprecated('Message 2');
        log.deprecated('Message 3');
    });
});
