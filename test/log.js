import { expect } from 'chai';
import sinon from 'sinon';
import log from '../build/log';
import { ENV_VARS } from '../src/consts';

describe('log', () => {
    let consoleStub;

    beforeEach(() => {
        consoleStub = sinon.stub(console, 'log');
    });

    afterEach(() => {
        consoleStub.restore();
    });

    describe('internal', () => {
        it('works as expected', () => {
            const [msg, data, level] = ['Hello', { one: 123, two: 456 }, log.LEVELS.INFO];
            log.internal(msg, data, level);

            const expected = JSON.stringify(Object.assign({ level: 'INFO', msg }, data));

            sinon.assert.calledOnce(consoleStub);
            sinon.assert.calledWith(consoleStub, expected);
        });
    });

    describe('log level', () => {
        let originalLevel;

        const refreshCache = () => {
            const logId = require.resolve('../build/log');
            delete require.cache[logId];
            return [require('../build/log'), logId]; // eslint-disable-line
        };

        before(() => {
            originalLevel = log.getLevel();
        });

        after(() => {
            log.setLevel(originalLevel);
        });

        it('works as expected', () => {
            const [msg, data] = ['Hello', { one: 123, two: 456 }, log.LEVELS.INFO];
            const expected = JSON.stringify(Object.assign({ level: 'INFO', msg }, data));

            log.info(msg, data);
            sinon.assert.calledOnce(consoleStub);
            sinon.assert.calledWith(consoleStub, expected);
            expect(log.getLevel()).to.be.eql(log.LEVELS.INFO);
            expect(log.isDebugMode).to.be.eql(false);
            expect(log.skipLevelInfo).to.be.eql(false);

            log.debug(msg, data);
            sinon.assert.calledOnce(consoleStub);

            log.setLevel(log.LEVELS.DEBUG);
            log.debug(msg, data);
            sinon.assert.calledTwice(consoleStub);
            sinon.assert.calledWith(consoleStub, expected.replace('INFO', 'DEBUG'));
            expect(log.getLevel()).to.be.eql(log.LEVELS.DEBUG);
            expect(log.isDebugMode).to.be.eql(true);
            expect(log.skipLevelInfo).to.be.eql(false);

            log.setLevel(log.LEVELS.ERROR);
            log.debug(msg, data);
            log.info(msg, data);
            log.softFail(msg, data);
            log.error(msg, data);
            sinon.assert.calledThrice(consoleStub);
            sinon.assert.calledWith(consoleStub, expected.replace('INFO', 'ERROR'));
            expect(log.getLevel()).to.be.eql(log.LEVELS.ERROR);
            expect(log.isDebugMode).to.be.eql(false);
            expect(log.skipLevelInfo).to.be.eql(true);
        });

        it('loads initial log level from APIFY_LOG_LEVEL env var', () => {
            process.env[ENV_VARS.LOG_LEVEL] = log.LEVELS.SOFT_FAIL;

            const [logNew, logId] = refreshCache();

            const [msg, data] = ['Hello', { one: 123, two: 456 }];
            logNew.error(msg, data);
            logNew.softFail(msg, data);
            logNew.warning(msg, data);
            logNew.info(msg, data);
            logNew.debug(msg, data);
            logNew.perf(msg, data);

            const error = JSON.stringify(Object.assign({ level: 'ERROR', msg }, data));
            const softFail = JSON.stringify(Object.assign({ level: 'SOFT_FAIL', msg }, data));

            sinon.assert.calledTwice(consoleStub);
            sinon.assert.calledWith(consoleStub, error);
            sinon.assert.calledWith(consoleStub, softFail);

            consoleStub.resetHistory();
            process.env[ENV_VARS.LOG_LEVEL] = 'nothing';
            refreshCache();
            sinon.assert.calledOnce(consoleStub);
            expect(consoleStub.getCall(0).args[0])
                .to.include('Setting log level: nothing from environment failed. Using level INFO');

            consoleStub.resetHistory();
            process.env[ENV_VARS.LOG_LEVEL] = '-1';
            refreshCache();
            sinon.assert.calledOnce(consoleStub);
            expect(consoleStub.getCall(0).args[0])
                .to.include('Setting log level: -1 from environment failed. Using level INFO');

            require.cache[logId] = log;
        });
    });
});

