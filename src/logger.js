export default class Logger {
    constructor(options) {
        this.options = options;
    }

    setOptions(options) {
        this.options = Object.assign({}, this.options, options);
    }

    getOptions() {
        return this.options;
    }

    log() {
        throw new Error('log() method must be implemented!');
    }
}
