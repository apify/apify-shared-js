import EventEmitter from 'events';
import { LEVELS } from './log_consts';

/**
 * This is an abstract class that should
 * be extended by custom logger classes.
 *
 * this._log() method must be implemented by them.
 */
export default class Logger extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }

    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    getOptions() {
        return this.options;
    }

    _outputWithConsole(level, line) {
        switch (level) {
            case LEVELS.ERROR:
                console.error(line);
                break;
            case LEVELS.WARNING:
                console.warn(line);
                break;
            case LEVELS.DEBUG:
                console.debug(line);
                break;
            default:
                console.log(line);
        }
    }

    _log() {
        throw new Error('log() method must be implemented!');
    }

    log(...args) {
        const line = this._log(...args);

        this.emit('line', line);
    }
}
