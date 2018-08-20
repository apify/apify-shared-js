import { expect } from 'chai';
import sinon from 'sinon';
import log from '../build/log';

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
    });
});

