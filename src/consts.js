export const FREE_SUBSCRIPTION_PLAN_CODE = 'DEV';

export const WORKER_MESSAGE_TYPES = {
    EXECUTE_ACT_TASK: 'EXECUTE_ACT_TASK',
    RUN_EXECUTION: 'RUN_EXECUTION',
    KILL_EXECUTION: 'KILL_EXECUTION',
    FINISH_ACT_TASK: 'FINISH_ACT_TASK',
};

export const ACT_TASK_TYPES = {
    BUILD: 'BUILD',
    RUN: 'RUN',
};

export const ACT_SOURCE_TYPES = {
    SOURCE_CODE: 'SOURCE_CODE',
    GIT_REPO: 'GIT_REPO',
    TARBALL: 'TARBALL',
    GITHUB_GIST: 'GITHUB_GIST',
};

export const ACTOR_EVENT_NAMES = {
    CPU_INFO: 'cpuInfo',
    MIGRATING: 'migrating',
    PERSIST_STATE: 'persistState',
};

/**
 * Dictionary of possible values for 'status' field of act2Builds or act2Runs collections.
 */
export const ACT_TASK_STATUSES = {
    READY: 'READY', // started but not allocated to any worker yet
    RUNNING: 'RUNNING', // running on worker
    SUCCEEDED: 'SUCCEEDED', // finished and all good
    FAILED: 'FAILED', // run or build failed
    TIMING_OUT: 'TIMING-OUT', // timing out now
    TIMED_OUT: 'TIMED-OUT', // timed out
    ABORTING: 'ABORTING', // being aborted by user
    ABORTED: 'ABORTED', // aborted by user
};

/**
 * An array of act task statuses that are final for the task.
 */
export const ACT_TASK_TERMINAL_STATUSES = [
    ACT_TASK_STATUSES.SUCCEEDED,
    ACT_TASK_STATUSES.FAILED,
    ACT_TASK_STATUSES.TIMED_OUT,
    ACT_TASK_STATUSES.ABORTED,
];

// NOTE: for legacy reasons these are lower-case, maybe we should migrate to upper case later.
// these strings are also referenced from upstart-worker.conf !
export const WORKER_SERVICE_TYPES = {
    CRAWLING: 'crawling',
    ACTOR: 'actor',
};

export const META_ORIGINS = {
    WEB: 'WEB',
    API: 'API',
    SCHEDULER: 'SCHEDULER',
    TEST: 'TEST',
};

/**
 * Base Docker images for acts, in order in which they are displayed in UI.
 * See https://www.apify.com/docs/actor#base-images
 */
export const ACTOR_BASE_DOCKER_IMAGES = [
    // Latest:
    {
        name: 'apify/actor-node-basic',
        displayName: 'Node.js 8 on Alpine Linux',
        prePull: true,
    },
    {
        name: 'apify/actor-node-chrome',
        displayName: 'Node.js 8 + Chrome on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },
    {
        name: 'apify/actor-node-chrome-xvfb',
        displayName: 'Node.js 8 + Chrome + Xvfb on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },

    // Beta:
    {
        name: 'apify/actor-node-basic:beta',
        displayName: 'BETA: Node.js 8 on Alpine Linux',
    },
    {
        name: 'apify/actor-node-chrome:beta',
        displayName: 'BETA: Node.js 8 + Chrome on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-chrome-xvfb:beta',
        displayName: 'BETA: Node.js 8 + Chrome + Xvfb on Debian',
        copyChown: 'myuser:myuser',
    },

    // Deprecated:
    // TODO: Keep the for some time and then migrate acts to recommended images.
    {
        name: 'apify/actor-node-puppeteer',
        displayName: '[DEPRECATED] Node.js 8 + Puppeteer on Debian (use apify/actor-node-chrome)',
        copyChown: 'node:node',
        prePull: true,
    },
    {
        name: 'apify/actor-node-puppeteer:beta',
        displayName: '[DEPRECATED] BETA: Node.js 8 + Puppeteer on Debian (use apify/actor-node-chrome:beta)',
        copyChown: 'node:node',
    },
];

/**
 * Default image from ACTOR_BASE_DOCKER_IMAGES.
 */
export const ACTOR_BASE_DOCKER_IMAGE_DEFAULT = ACTOR_BASE_DOCKER_IMAGES[0].name;

/**
 * Keys of labels applied to act Docker images and containers.
 */
export const DOCKER_LABELS = {
    ACT_BUILD_ID: 'com.apify.actBuildId',
    ACT_RUN_ID: 'com.apify.actRunId',
};

/**
 * Acts types
 */
export const ACT_TYPES = {
    ACT: 'acts',
    CRAWLER: 'crawlers',
};

/**
 * Username used when user is anonymous.
 */
export const ANONYMOUS_USERNAME = 'anonymous';

/**
 * Username constraints.
 */
export const USERNAME = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,

    // Regex matching a potentially allowed username. The numbers must match MIN and MAX!
    // Note that username must also pass isForbiddenUser() test to be allowed!
    REGEX: /^[a-zA-Z0-9_.\-]{3,30}$/,
};

/**
 * Length of short crawler ID for nice public crawlers path.
 */
export const SHORT_CRAWLER_ID_LENGTH = 5;

/**
 * Default build tag used for latest act version.
 */
export const BUILD_TAG_LATEST = 'latest';

/**
 * Behaviour of act restart on error.
 * Act gets restarted when there are less than MAX_RESTARTS in the last INTERVAL_MILLIS.
 */
export const ACT_RESTART_ON_ERROR = {
    MAX_RESTARTS: 3,
    // This needs to be low enough so that it only covers restart loops, rather than e.g.
    // errors during crawling of large lists of URLs
    INTERVAL_MILLIS: 1 * 60 * 1000,
};

/**
 * 1 compute unit = 1GB * 1Hour.
 */
export const COMPUTE_UNIT_MB = 1024;
export const COMPUTE_UNIT_MILLIS = 60 * 60 * 1000;

/**
 * Contains various Actor platform limits that are shared between the projects.
 */
export const ACTOR_LIMITS = {
    // Total amount of memory for the build container. Must be less than or equal to the maximum of the free plan!
    BUILD_DEFAULT_MEMORY_MBYTES: 1024,

    // Maximum duration of build in seconds.
    BUILD_TIMEOUT_SECS: 600,

    // For each build or run container, set disk quota based on memory size
    RUN_DISK_TO_MEMORY_SIZE_COEFF: 2,

    // The default limit of memory for all running Actor tasks for free accounts.
    FREE_ACCOUNT_MAX_MEMORY_MBYTES: 2048,

    // The default limit of memory for all running Actor tasks for paid accounts.
    PAID_ACCOUNT_MAX_MEMORY_MBYTES: 16384,

    // Minimum and maximum memory for a single act run.
    MIN_RUN_MEMORY_MBYTES: 128,
    MAX_RUN_MEMORY_MBYTES: 16384,
};

/**
 * Use as username for returning user own info from API v2/users/username
 */
export const ME_USER_NAME_PLACEHOLDER = 'me';

/**
 * Max length of the queue head that server will return in Request Queue API.
 */
export const REQUEST_QUEUE_HEAD_MAX_LIMIT = 1000;

/**
 * Default value for APIFY_PROXY_HOSTNAME environment variable
 */
export const DEFAULT_PROXY_HOSTNAME = 'proxy.apify.com';

/**
 * Default value for APIFY_PROXY_PORT environment variable
 */
export const DEFAULT_PROXY_PORT = 8000;

/**
 * Default value for APIFY_LOCAL_EMULATION_DIR
 */
export const DEFAULT_LOCAL_EMULATION_DIR = 'apify_local';

/**
 * Default value for APIFY_CONTAINER_PORT
 */
export const DEFAULT_CONTAINER_PORT = 4321;

/**
 * Local emulation sub directories for local stores
 */
export const LOCAL_EMULATION_SUBDIRS = {
    datasets: 'datasets',
    keyValueStores: 'key-value-stores',
    requestQueues: 'request-queues',
};

/**
 * Throttling period for mongo increment updates
 */
export const MONGO_INC_THROTTLED_INTERVAL_MILLIS = 5000;

/**
 * Dictionary of APIFY_XXX environment variable names.
 */
export const ENV_VARS = {
    ACT_ID: 'APIFY_ACT_ID',
    ACT_RUN_ID: 'APIFY_ACT_RUN_ID',
    USER_ID: 'APIFY_USER_ID',
    TOKEN: 'APIFY_TOKEN',
    PROXY_PASSWORD: 'APIFY_PROXY_PASSWORD',
    PROXY_HOSTNAME: 'APIFY_PROXY_HOSTNAME',
    PROXY_PORT: 'APIFY_PROXY_PORT',
    STARTED_AT: 'APIFY_STARTED_AT',
    TIMEOUT_AT: 'APIFY_TIMEOUT_AT',
    DEFAULT_KEY_VALUE_STORE_ID: 'APIFY_DEFAULT_KEY_VALUE_STORE_ID',
    DEFAULT_DATASET_ID: 'APIFY_DEFAULT_DATASET_ID',
    DEFAULT_REQUEST_QUEUE_ID: 'APIFY_DEFAULT_REQUEST_QUEUE_ID',
    LOCAL_EMULATION_DIR: 'APIFY_LOCAL_EMULATION_DIR',
    WATCH_FILE: 'APIFY_WATCH_FILE',
    API_BASE_URL: 'APIFY_API_BASE_URL',
    HEADLESS: 'APIFY_HEADLESS',
    XVFB: 'APIFY_XVFB',
    INTERNAL_PORT: 'APIFY_INTERNAL_PORT',
    MEMORY_MBYTES: 'APIFY_MEMORY_MBYTES',
    LOG_LEVEL: 'APIFY_LOG_LEVEL',
    ACTOR_EVENTS_WS_URL: 'APIFY_ACTOR_EVENTS_WS_URL',
    CHROME_EXECUTABLE_PATH: 'APIFY_CHROME_EXECUTABLE_PATH',
    IS_AT_HOME: 'APIFY_IS_AT_HOME',
    CONTAINER_PORT: 'APIFY_CONTAINER_PORT',
    CONTAINER_URL: 'APIFY_CONTAINER_URL',
};

/**
 * Defaults input and output key-value stores keys
 */
export const KEY_VALUE_STORE_KEYS = {
    INPUT: 'INPUT',
    OUTPUT: 'OUTPUT',
};

/**
 * Max length of Actor log in number of characters.
 */
export const ACTOR_LOG_MAX_CHARS = 5000000;

/**
 * Types of customer request.
 */
export const CUSTOMER_REQUEST_TYPES = {
    EXTRACT_DATA: 'EXTRACT_DATA',
    AUTOMATION: 'AUTOMATION',
    OTHER: 'OTHER',
};

/**
 * Represents the maximum size in bytes of a request body (decompressed)
 * that will be accepted by the App and API servers.
 */
export const MAX_PAYLOAD_SIZE_BYTES = 9437184; // 9MB

/**
 * User-Agents from https://techblog.willshouse.com/2012/01/03/most-common-user-agents/
 *
 * Updated 2018-08-03
 */
export const USER_AGENTS_LIST = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (X11; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64; rv:52.0) Gecko/20100101 Firefox/52.0',
    'Mozilla/5.0 (X11; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/64.0.3282.119 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.84 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/66.0.3359.181 Chrome/66.0.3359.181 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/11.0.3 Safari/604.5.6',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 Edge/16.16299',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 11_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/67.0.3396.99 Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.33 Safari/537.36',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0;  Trident/5.0)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36 OPR/54.0.2952.51',
    'Mozilla/5.0 (Windows NT 6.1; rv:52.0) Gecko/20100101 Firefox/52.0',
    'Mozilla/5.0 (Windows NT 6.1; rv:61.0) Gecko/20100101 Firefox/61.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/603.3.8 (KHTML, like Gecko) Version/10.1.2 Safari/603.3.8',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:52.0) Gecko/20100101 Firefox/52.0',
    'Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.139 Safari/537.36',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.0; Trident/5.0;  Trident/5.0)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3493.0 Safari/537.36',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:61.0) Gecko/20100101 Firefox/61.0',
];
