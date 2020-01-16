import _ from 'underscore';
import { Signale } from 'signale';
import figures from 'figures';
import { LOG_LEVELS } from './log_consts';

const signale = new Signale({
    types: {
        error: {
            badge: figures.cross,
            color: 'red',
            label: 'ERROR',
            logLevel: 'info',
        },
        softFail: {
            badge: figures.warning,
            color: 'yellow',
            label: 'SOFT_FAIL',
            logLevel: 'info',
        },
        warning: {
            badge: figures.warning,
            color: 'green',
            label: 'WARNING',
            logLevel: 'info',
        },
        info: {
            badge: figures.tick,
            color: 'blue',
            label: 'INFO',
            logLevel: 'info',
        },
        debug: {
            badge: figures.checkboxOff,
            color: 'blue',
            label: 'DEBUG',
            logLevel: 'info',
        },
        perf: {
            badge: figures.checkboxOff,
            color: 'blue',
            label: 'PERF',
            logLevel: 'info',
        },
    },
});

export default class LoggerText {
    constructor(options = {}) {
        const { skipTime = false } = options;

        this.skipTime = skipTime;
    }

    _prepareInternalPlainLogLine(message, data, exception, prefix) {
        const parts = [];

        if (!this.skipTime) parts.push((new Date()).toISOString());
        if (prefix) parts.push(prefix);
        parts.push(message);
        if (data && !_.isEmpty(data)) parts.push(JSON.stringify(data));
        if (exception) {
            // Parse error.type and error.details from ApifyClientError.
            const details = [];
            if (exception.type) details.push(`type=${exception.type}`);
            if (exception.details) {
                _.chain(exception.details).mapObject((val, key) => details.push(`${key}=${val}`));
            }
            if (details.length) parts.push(`(error details: ${details.join(', ')})`);
        }
        let line = parts.join(' ');
        if (exception) {
            let errorLines = exception.stack || exception;
            errorLines = errorLines.split('\n').map(line => `              ${line}`).join('\n');
            line += `\n${errorLines}`;
        }

        return line;
    }

    log(logLevel, message, data, exception, { prefix, suffix }) {
        const opts = {
            message: this._prepareInternalPlainLogLine(message, data, exception, prefix),
            suffix,
        };

        switch (logLevel) {
            case LOG_LEVELS.ERROR:
                signale.error(opts);
                break;
            case LOG_LEVELS.SOFT_FAIL:
                signale.softFail(opts);
                break;
            case LOG_LEVELS.WARNING:
                signale.warning(opts);
                break;
            case LOG_LEVELS.INFO:
                signale.info(opts);
                break;
            case LOG_LEVELS.DEBUG:
                signale.debug(opts);
                break;
            case LOG_LEVELS.PERF:
                signale.perf(opts);
                break;
            default:
                throw new Error(`Unknown log level: "${logLevel}"`);
        }
    }
}
