import { Log } from './log.js';

export * from './log.js';
export * from './log_consts.js';
export * from './log_helpers.js';
export * from './logger.js';
export * from './logger_json.js';
export * from './logger_text.js';

// Default export is an initialized instance of logger.
const log = new Log();

// eslint-disable-next-line import/no-default-export
export default log;
