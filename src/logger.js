const EventEmitter = require('events');

export default class Logger extends EventEmitter {
    constructor(options) {
        super();
        this.options = options;
    }

    setOptions(options) {
        this.options = Object.assign({}, this.options, options);
    }

    getOptions() {
        return this.options;
    }

    _log() {
        throw new Error('log() method must be implemented!');
    }

    log(...args) {
        const line = this._log(...args);

        this.emit('line', line);
    }
}
