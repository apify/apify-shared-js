import { expect } from 'chai';
import LoggerJson from '../build/logger_json';
import { PREFIX_DELIMITER, LEVELS, LEVEL_TO_STRING } from '../build/log_consts';

describe('loggerJson', () => {
    let loggedLine;
    let originalConsoleLog;

    beforeEach(() => {
        originalConsoleLog = console.log;
        console.log = (line) => {
            console.dir(line);
            loggedLine = JSON.parse(line);
        };
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    it('works', () => {
        const logger = new LoggerJson();

        let level = LEVELS.INFO;
        let message = 'Some message';
        let data = { foo: 'bar' };
        const prefix = 'Before';
        const suffix = 'After';
        logger.log(level, message, data, null, { prefix, suffix });

        expect(loggedLine.time).to.be.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/);
        expect(loggedLine.msg).to.eql(`${prefix}${PREFIX_DELIMITER} ${message} ${suffix}`);
        expect(loggedLine.foo).to.be.eql(data.foo);
        expect(loggedLine.level).to.be.eql(LEVEL_TO_STRING[level]);
        expect(loggedLine.exception).to.be.eql(undefined);

        level = LEVELS.ERROR;
        message = 'Some error happened';
        data = { foo: 'bar' };
        const err = new Error('some-error');
        const errObj = Object.assign({ name: err.name, message: err.message, stack: err.stack }, err);
        logger.log(level, message, data, errObj);

        expect(loggedLine.time).to.be.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/);
        expect(loggedLine.msg).to.eql(message);
        expect(loggedLine.foo).to.be.eql(data.foo);
        expect(loggedLine.level).to.be.eql(LEVEL_TO_STRING[level]);
        expect(loggedLine.exception).to.be.eql(errObj);
    });

    it('should support skipLevelInfo', () => {
        const logger = new LoggerJson({ skipLevelInfo: true });

        const level = LEVELS.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLine.time).to.be.match(/\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d.\d\d\dZ/);
        expect(loggedLine.msg).to.eql(message);
        expect(loggedLine.level).to.be.eql(undefined);
    });

    it('should support skipTime', () => {
        const logger = new LoggerJson({ skipTime: true });

        const level = LEVELS.INFO;
        const message = 'Some message';
        logger.log(level, message);

        expect(loggedLine.time).to.be.eql(undefined);
        expect(loggedLine.msg).to.eql(message);
        expect(loggedLine.level).to.be.eql(LEVEL_TO_STRING[level]);
    });
});
