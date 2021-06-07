import { DNS_SAFE_NAME_REGEX } from './regexs';

export const FREE_SUBSCRIPTION_PLAN_CODE = 'DEV';

export const ACT_JOB_TYPES = {
    BUILD: 'BUILD',
    RUN: 'RUN',
};

export const ACT_SOURCE_TYPES = {
    SOURCE_CODE: 'SOURCE_CODE',
    SOURCE_FILES: 'SOURCE_FILES',
    GIT_REPO: 'GIT_REPO',
    TARBALL: 'TARBALL',
    GITHUB_GIST: 'GITHUB_GIST',
};

export const ACTOR_EVENT_NAMES = {
    CPU_INFO: 'cpuInfo',
    SYSTEM_INFO: 'systemInfo',
    MIGRATING: 'migrating',
    PERSIST_STATE: 'persistState',
    ABORTING: 'aborting',
};

/**
 * Dictionary of possible values for 'status' field of act2Builds or act2Runs collections.
 */
export const ACT_JOB_STATUSES = {
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
 * An array of act jobs statuses that are final for the jobs.
 */
export const ACT_JOB_TERMINAL_STATUSES = [
    ACT_JOB_STATUSES.SUCCEEDED,
    ACT_JOB_STATUSES.FAILED,
    ACT_JOB_STATUSES.TIMED_OUT,
    ACT_JOB_STATUSES.ABORTED,
];

// NOTE: for legacy reasons these are lower-case, maybe we should migrate to upper case later.
// these strings are also referenced from upstart-worker.conf !
export const WORKER_SERVICE_TYPES = {
    CRAWLING: 'crawling',
    ACTOR: 'actor',
};

export const META_ORIGINS = {
    DEVELOPMENT: 'DEVELOPMENT', // Job started from Developer console in Source section of actor
    WEB: 'WEB', // Job started from other place on the website (either console or task detail page)
    API: 'API', // Job started through API
    SCHEDULER: 'SCHEDULER', // Job started through Scheduler
    TEST: 'TEST', // Job started through test actor page
};

/**
 * Base Docker images for acts, in order in which they are displayed in UI.
 * See https://www.apify.com/docs/actor#base-images
 */
export const ACTOR_BASE_DOCKER_IMAGES = [
    // Latest:
    {
        name: 'apify/actor-node',
        displayName: 'Node.js 14 on Alpine Linux',
        prePull: true,
    },
    {
        name: 'apify/actor-node-puppeteer-chrome',
        displayName: 'Node.js 14 + Puppeteer + Chrome on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },
    {
        name: 'apify/actor-node-playwright-chrome',
        displayName: 'Node.js 14 + Playwright + Chrome on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },
    {
        name: 'apify/actor-node-playwright-firefox',
        displayName: 'Node.js 14 + Playwright + Firefox on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },
    {
        name: 'apify/actor-node-playwright-webkit',
        displayName: 'Node.js 14 + Playwright + WebKit on Debian',
        copyChown: 'myuser:myuser',
        prePull: true,
    },
    {
        name: 'apify/actor-node-playwright',
        displayName: 'Node.js 14 + Playwright + All Browsers on Ubuntu',
        copyChown: 'myuser:myuser',
        prePull: true,
    },

    // Beta:
    {
        name: 'apify/actor-node',
        displayName: 'BETA: Node.js 14 on Alpine Linux:beta',
    },
    {
        name: 'apify/actor-node-puppeteer-chrome:beta',
        displayName: 'BETA: Node.js 14 + Puppeteer + Chrome on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-playwright-chrome:beta',
        displayName: 'BETA: Node.js 14 + Playwright + Chrome on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-playwright-firefox:beta',
        displayName: 'BETA: Node.js 14 + Playwright + Firefox on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-playwright-webkit:beta',
        displayName: 'BETA: Node.js 14 + Playwright + WebKit on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-playwright:beta',
        displayName: 'Node.js 14 + Playwright + All Browsers on Ubuntu',
        copyChown: 'myuser:myuser',
    },

    // Deprecated:
    // These are here because we made breaking changes in the client that could break existing single file actors.
    // We will get a rid of this along with the whole single file logic.
    {
        name: 'apify/actor-node-basic',
        displayName: '[DEPRECATED]: Node.js 12 on Alpine Linux',
    },
    {
        name: 'apify/actor-node-chrome',
        displayName: '[DEPRECATED]: Node.js 12 + Chrome on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-chrome-xvfb',
        displayName: '[DEPRECATED]: Node.js 12 + Chrome + Xvfb on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-basic:beta',
        displayName: '[DEPRECATED] BETA: Node.js 12 on Alpine Linux',
    },
    {
        name: 'apify/actor-node-chrome:beta',
        displayName: '[DEPRECATED] BETA: Node.js 12 + Chrome on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-chrome-xvfb:beta',
        displayName: '[DEPRECATED] BETA: Node.js 12 + Chrome + Xvfb on Debian',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-basic:v0.21.10',
        displayName: '[DEPRECATED]: Node.js 12 on Alpine Linux (Apify SDK v0.21.10)',
    },
    {
        name: 'apify/actor-node-chrome:v0.21.10',
        displayName: '[DEPRECATED]: Node.js 12 + Chrome on Debian (Apify SDK v0.21.10)',
        copyChown: 'myuser:myuser',
    },
    {
        name: 'apify/actor-node-chrome-xvfb:v0.21.10',
        displayName: '[DEPRECATED]: Node.js 12 + Chrome + Xvfb on Debian (Apify SDK v0.21.10)',
        copyChown: 'myuser:myuser',
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
    ACTOR_BUILD_ID: 'com.apify.actBuildId',
    ACTOR_RUN_ID: 'com.apify.actRunId',
    // Kept for backwards compatibility, will be removed soon
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
    REGEX: /^[a-zA-Z0-9_.-]{3,30}$/,
};

/**
 * Actor name constraints.
 */
export const ACTOR_NAME = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 63, // DNS-safe string length
    REGEX: DNS_SAFE_NAME_REGEX,
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
export const ACTOR_RESTART_ON_ERROR = {
    MAX_RESTARTS: 3,
    // This needs to be low enough so that it only covers restart loops, rather than e.g.
    // errors during crawling of large lists of URLs
    INTERVAL_MILLIS: 1 * 60 * 1000,
};

/**
 * Kept for backwards compatibility, will be removed soon.
 * TODO: Remove this once it's no longer used anywhere.
 */
export const ACT_RESTART_ON_ERROR = ACTOR_RESTART_ON_ERROR;

/**
 * 1 compute unit = 1GB * 1Hour.
 */
export const COMPUTE_UNIT_MB = 1024;
export const COMPUTE_UNIT_MILLIS = 60 * 60 * 1000;

/**
 * Contains various Actor platform limits that are shared between the projects.
 * IMPORTANT: If you update any of them, update also https://github.com/apifytech/apify-docs/edit/master/docs/actor/limits.md !!!
 */
export const ACTOR_LIMITS = {
    // Total amount of memory for the build container. Must be less than or equal to the maximum of the free plan!
    BUILD_DEFAULT_MEMORY_MBYTES: 1024,

    // Maximum duration of build in seconds.
    BUILD_TIMEOUT_SECS: 600,

    // For each build or run container, set disk quota based on memory size
    RUN_DISK_TO_MEMORY_SIZE_COEFF: 2,

    // For each build or run container, set CPU cores based on memory size
    RUN_MEMORY_MBYTES_PER_CPU_CORE: 4096,

    // The default limit of memory for all running Actor jobs for free accounts.
    FREE_ACCOUNT_MAX_MEMORY_MBYTES: 8192,

    // The default limit of memory for all running Actor jobs for paid accounts.
    PAID_ACCOUNT_MAX_MEMORY_MBYTES: 65536,

    // Minimum and maximum memory for a single act run.
    MIN_RUN_MEMORY_MBYTES: 128,
    MAX_RUN_MEMORY_MBYTES: 32768,

    // Maximum size of actor input schema.
    INPUT_SCHEMA_MAX_BYTES: 100 * 1024,

    // Max length of run/build log in number of characters
    LOG_MAX_CHARS: 5000000,
};

/**
 * Contains various limits of the Apify platform.
 */
export const DEFAULT_PLATFORM_LIMITS = {
    // Maximum number of actors per user
    MAX_ACTORS_PER_USER: 100,

    // Maximum number of tasks per user
    MAX_TASKS_PER_USER: 1000,

    // Maximum number of schedules per user
    MAX_SCHEDULES_PER_USER: 100,

    // Maximum number of webhooks per user
    MAX_WEBHOOKS_PER_USER: 100,

    // Maximum number of actors per scheduler
    MAX_ACTORS_PER_SCHEDULER: 10,

    // Maximum number of tasks per scheduler
    MAX_TASKS_PER_SCHEDULER: 10,
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
 * Throttling period for mongo increment updates
 */
export const MONGO_INC_THROTTLED_INTERVAL_MILLIS = 5000;

/**
 * Dictionary of APIFY_XXX environment variable names.
 */
export const ENV_VARS = {
    IS_AT_HOME: 'APIFY_IS_AT_HOME',
    ACTOR_ID: 'APIFY_ACTOR_ID',
    ACTOR_RUN_ID: 'APIFY_ACTOR_RUN_ID',
    ACTOR_TASK_ID: 'APIFY_ACTOR_TASK_ID',
    INPUT_KEY: 'APIFY_INPUT_KEY',
    USER_ID: 'APIFY_USER_ID',
    TOKEN: 'APIFY_TOKEN',
    PROXY_PASSWORD: 'APIFY_PROXY_PASSWORD',
    PROXY_HOSTNAME: 'APIFY_PROXY_HOSTNAME',
    PROXY_PORT: 'APIFY_PROXY_PORT',
    PROXY_STATUS_URL: 'APIFY_PROXY_STATUS_URL',
    STARTED_AT: 'APIFY_STARTED_AT',
    TIMEOUT_AT: 'APIFY_TIMEOUT_AT',
    DEFAULT_KEY_VALUE_STORE_ID: 'APIFY_DEFAULT_KEY_VALUE_STORE_ID',
    DEFAULT_DATASET_ID: 'APIFY_DEFAULT_DATASET_ID',
    DEFAULT_REQUEST_QUEUE_ID: 'APIFY_DEFAULT_REQUEST_QUEUE_ID',
    LOCAL_STORAGE_DIR: 'APIFY_LOCAL_STORAGE_DIR',
    API_BASE_URL: 'APIFY_API_BASE_URL',
    HEADLESS: 'APIFY_HEADLESS',
    XVFB: 'APIFY_XVFB',
    MEMORY_MBYTES: 'APIFY_MEMORY_MBYTES',
    LOG_LEVEL: 'APIFY_LOG_LEVEL',
    ACTOR_EVENTS_WS_URL: 'APIFY_ACTOR_EVENTS_WS_URL',
    CHROME_EXECUTABLE_PATH: 'APIFY_CHROME_EXECUTABLE_PATH',
    CONTAINER_PORT: 'APIFY_CONTAINER_PORT',
    CONTAINER_URL: 'APIFY_CONTAINER_URL',
    META_ORIGIN: 'APIFY_META_ORIGIN',
    FACT: 'APIFY_FACT',
    DEDICATED_CPUS: 'APIFY_DEDICATED_CPUS',
    SDK_LATEST_VERSION: 'APIFY_SDK_LATEST_VERSION',

    // Deprecated, keep them for backward compatibility:
    ACT_ID: 'APIFY_ACT_ID',
    ACT_RUN_ID: 'APIFY_ACT_RUN_ID',
};
export const INTEGER_ENV_VARS = [
    ENV_VARS.PROXY_PORT,
    ENV_VARS.MEMORY_MBYTES,
    ENV_VARS.CONTAINER_PORT,
];

/**
 * Default value for APIFY_CONTAINER_PORT used both locally and at Apify platform.
 */
export const DEFAULT_CONTAINER_PORT = 4321;

/**
 * Local emulation sub directories for local stores
 */
export const LOCAL_STORAGE_SUBDIRS = {
    datasets: 'datasets',
    keyValueStores: 'key_value_stores',
    requestQueues: 'request_queues',
};

/**
 * Local defaults for of some of the environment variables.
 * These are being preset in Apify SDK when it's running out of the Apify platform.
 */
export const LOCAL_ENV_VARS = {
    [ENV_VARS.DEFAULT_KEY_VALUE_STORE_ID]: 'default',
    [ENV_VARS.DEFAULT_DATASET_ID]: 'default',
    [ENV_VARS.DEFAULT_REQUEST_QUEUE_ID]: 'default',
    [ENV_VARS.PROXY_HOSTNAME]: 'proxy.apify.com',
    [ENV_VARS.PROXY_PORT]: (8000).toString(),
    [ENV_VARS.CONTAINER_PORT]: (DEFAULT_CONTAINER_PORT).toString(),
    [ENV_VARS.CONTAINER_URL]: `http://localhost:${DEFAULT_CONTAINER_PORT}`, // Must match port line above!
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
 * TODO: Remove this once it's no longer used anywhere.
 */
export const ACTOR_LOG_MAX_CHARS = ACTOR_LIMITS.LOG_MAX_CHARS;

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
 * Categories for crawlers and actors
 */
export const ACTOR_CATEGORIES = {
    AUTOMATION: 'Automation',
    BUSINESS: 'Business',
    COVID_19: 'Covid-19',
    DEVELOPER_EXAMPLES: 'Developer examples',
    DEVELOPER_TOOLS: 'Developer tools',
    ECOMMERCE: 'E-commerce',
    GAMES: 'Games',
    JOBS: 'Jobs',
    MARKETING: 'Marketing',
    NEWS: 'News',
    SEO_TOOLS: 'SEO tools',
    SOCIAL_MEDIA: 'Social media',
    TRAVEL: 'Travel',
    VIDEOS: 'Videos',
    OTHER: 'Other',
};

/**
 * TODO: This will be used during the category migration and can be removed after that.
 */
export const LEGACY_ACTOR_CATEGORIES = {
    TRAVEL: 'Travel',
    ECOMMERCE: 'E-commerce',
    ENTERTAINMENT: 'Entertainment',
    SOCIAL: 'Social',
    MARKETING: 'Marketing',
    NEWS: 'News',
    FINANCE: 'Finance',
    LIFESTYLE: 'Lifestyle',
    SEARCH_ENGINES: 'Search engines',
    DATA: 'Data processing',
    EGOVERNMENT: 'E-government',
    TOOLS: 'Tools',
    EXAMPLES: 'Examples',
    OTHER: 'Other',
};
export const ALL_ACTOR_CATEGORIES = {
    ...ACTOR_CATEGORIES,
    ...LEGACY_ACTOR_CATEGORIES,
};

/**
 * Bases for converting version/build number to/from string/integer
 */
export const VERSION_INT_MAJOR_BASE = 1e7;
export const VERSION_INT_MINOR_BASE = 1e5;

/**
 * Basic options for XSS sanitization
 */
export const USER_BASIC_TEXT_XSS_OPTIONS = {
    whiteList: {
        a: ['href', 'title', 'target'],
        code: [],
        strong: [],
        b: [],
        br: [],
        ul: [],
        li: [],
        ol: [],
        i: [],
        u: [],
        p: [],
    },
};

export const WEBHOOK_EVENT_TYPES = {
    ACTOR_RUN_CREATED: 'ACTOR.RUN.CREATED',
    ACTOR_RUN_SUCCEEDED: 'ACTOR.RUN.SUCCEEDED',
    ACTOR_RUN_FAILED: 'ACTOR.RUN.FAILED',
    ACTOR_RUN_TIMED_OUT: 'ACTOR.RUN.TIMED_OUT',
    ACTOR_RUN_ABORTED: 'ACTOR.RUN.ABORTED',
    ACTOR_RUN_RESURRECTED: 'ACTOR.RUN.RESURRECTED',
    TEST: 'TEST',
};

export const WEBHOOK_EVENT_TYPE_GROUPS = {
    ACTOR_RUN: [
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_CREATED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_ABORTED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_RESURRECTED,
    ],
    // If one of these occurs then we can be sure that none other can occur for the same triggerer.
    ACTOR_RUN_TERMINAL: [
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_ABORTED,
    ],
};

export const WEBHOOK_DEFAULT_PAYLOAD_TEMPLATE = `{
    "userId": {{userId}},
    "createdAt": {{createdAt}},
    "eventType": {{eventType}},
    "eventData": {{eventData}},
    "resource": {{resource}}
}`;
export const WEBHOOK_ALLOWED_PAYLOAD_VARIABLES = new Set([
    'userId',
    'createdAt',
    'eventType',
    'eventData',
    'resource',
]);

// This client key is used in request queue to indentify requests from Apify app UI.
export const APIFY_UI_CLIENT_KEY = 'apify-app-ui';

// Max allowed size of files in multi-file editor
export const MAX_MULTIFILE_BYTES = 3 * (1024 ** 2); // 3MB

// Formats for multi-file editor files
export const SOURCE_FILE_FORMATS = {
    TEXT: 'TEXT',
    BASE64: 'BASE64',
};

// Marketplace project statuses
export const PROJECT_STATUSES = {
    REQUEST: 'REQUEST',
    SPECIFICATION: 'SPECIFICATION',
    OFFERS: 'OFFERS',
    DEPOSIT: 'DEPOSIT',
    DEPOSIT_PAID: 'DEPOSIT_PAID',
    NEW: 'NEW',
    IN_PROGRESS: 'IN_PROGRESS',
    QA: 'QA',
    CUSTOMER_QA: 'CUSTOMER_QA',
    READY_FOR_INVOICE: 'READY_FOR_INVOICE',
    INVOICED: 'INVOICED',
    PAID: 'PAID',
    DELIVERED: 'DELIVERED',
    CLOSED: 'CLOSED',
    FINISHED: 'FINISHED',
};

// Marketplace projects with status from this array is considered as successfully finished
export const FINISHED_PROJECT_STATUSES = [
    PROJECT_STATUSES.READY_FOR_INVOICE,
    PROJECT_STATUSES.INVOICED,
    PROJECT_STATUSES.PAID,
    PROJECT_STATUSES.DELIVERED,
    PROJECT_STATUSES.FINISHED,
];

export const MARKETPLACE_USER_ROLES = {
    DEVELOPER: 'DEVELOPER',
    DATA_EXPERT: 'DATA_EXPERT',
    CUSTOMER: 'CUSTOMER',
};

export const GIT_MAIN_BRANCH = 'main';
