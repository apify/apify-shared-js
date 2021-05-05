import EventEmitter from 'events';
import { LogLevel } from './log_consts';
import { Exception } from './logger_text';

/**
 * This is an abstract class that should
 * be extended by custom logger classes.
 *
 * this._log() method must be implemented by them.
 */
export class Logger extends EventEmitter {
    constructor(protected options: Record<string, any>) {
        super();
    }

    setOptions(options: Record<string, any>) {
        this.options = { ...this.options, ...options };
    }

    getOptions() {
        return this.options;
    }

    _outputWithConsole(level: LogLevel, line: string) {
        switch (level) {
            case LogLevel.ERROR:
                console.error(line);
                break;
            case LogLevel.WARNING:
                console.warn(line);
                break;
            case LogLevel.DEBUG:
                console.debug(line);
                break;
            default:
                console.log(line);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _log(level: LogLevel, message: string, data?: any, exception?: Exception, opts: Record<string, any> = {}) {
        throw new Error('log() method must be implemented!');
    }

    log(level: LogLevel, message: string, ...args: any[]) {
        const line = this._log(level, message, ...args);
        this.emit('line', line);
    }
}
