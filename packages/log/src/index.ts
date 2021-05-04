import { Log } from './log';

export * from './log';
export * from './log_consts';
export * from './log_helpers';
export * from './logger';
export * from './logger_json';
export * from './logger_text';

// Default export is an initialized instance of logger.
const log = new Log();
export default log;
