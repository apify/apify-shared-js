import { DNS_SAFE_NAME_REGEX } from './regexs';

export const FREE_SUBSCRIPTION_PLAN_CODE = 'DEV';

export const ACTOR_JOB_TYPES = {
    BUILD: 'BUILD',
    RUN: 'RUN',
} as const;

export const ACTOR_SOURCE_TYPES = {
    SOURCE_CODE: 'SOURCE_CODE',
    SOURCE_FILES: 'SOURCE_FILES',
    GIT_REPO: 'GIT_REPO',
    TARBALL: 'TARBALL',
    GITHUB_GIST: 'GITHUB_GIST',
} as const;

export const ACTOR_EVENT_NAMES = {
    CPU_INFO: 'cpuInfo',
    SYSTEM_INFO: 'systemInfo',
    MIGRATING: 'migrating',
    PERSIST_STATE: 'persistState',
    ABORTING: 'aborting',
} as const;

/**
 * Dictionary of possible values for 'status' field of act2Builds or act2Runs collections.
 */
export const ACTOR_JOB_STATUSES = {
    READY: 'READY', // started but not allocated to any worker yet
    RUNNING: 'RUNNING', // running on worker
    SUCCEEDED: 'SUCCEEDED', // finished and all good
    FAILED: 'FAILED', // run or build failed
    TIMING_OUT: 'TIMING-OUT', // timing out now
    TIMED_OUT: 'TIMED-OUT', // timed out
    ABORTING: 'ABORTING', // being aborted by user
    ABORTED: 'ABORTED', // aborted by user
} as const;

/**
 * Dictionary of possible values for 'status' field of webhookDispatches collections.
 */
export const WEBHOOK_DISPATCH_STATUSES = {
    ACTIVE: 'ACTIVE', // Attempting to deliver the webhook
    SUCCEEDED: 'SUCCEEDED', // Webhook was delivered
    FAILED: 'FAILED', // All calls to webhook target URL failed
} as const;

/**
 * An array of act jobs statuses that are final for the jobs.
 */
export const ACTOR_JOB_TERMINAL_STATUSES = [
    ACTOR_JOB_STATUSES.SUCCEEDED,
    ACTOR_JOB_STATUSES.FAILED,
    ACTOR_JOB_STATUSES.TIMED_OUT,
    ACTOR_JOB_STATUSES.ABORTED,
];

// NOTE: for legacy reasons these are lower-case, maybe we should migrate to upper case later.
// these strings are also referenced from upstart-worker.conf !
export const WORKER_SERVICE_TYPES = {
    CRAWLING: 'crawling',
    ACTOR: 'actor',
} as const;

export const META_ORIGINS = {
    DEVELOPMENT: 'DEVELOPMENT', // Job started from Developer console in Source section of actor
    WEB: 'WEB', // Job started from other place on the website (either console or task detail page)
    API: 'API', // Job started through API
    SCHEDULER: 'SCHEDULER', // Job started through Scheduler
    TEST: 'TEST', // Job started through test actor page
    WEBHOOK: 'WEBHOOK', // Job started by the webhook
    ACTOR: 'ACTOR', // Job started by another actor run
    CLI: 'CLI', // Job started by apify CLI
    STANDBY: 'STANDBY', // Job started by Actor Standby
} as const;

/**
 * Keys of labels applied to act Docker images and containers.
 */
export const DOCKER_LABELS = {
    ACTOR_BUILD_ID: 'com.apify.actBuildId',
    ACTOR_RUN_ID: 'com.apify.actRunId',

    // Kept for backwards compatibility, will be removed soon (TODO: remove old usages!)
    /** @deprecated Use ACTOR_BUILD_ID instead! */
    ACT_BUILD_ID: 'com.apify.actBuildId',
    /** @deprecated Use ACTOR_RUN_ID instead! */
    ACT_RUN_ID: 'com.apify.actRunId',
} as const;

/**
 * Acts types
 */
export const ACTOR_TYPES = {
    ACT: 'acts',
    CRAWLER: 'crawlers',
} as const;

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
 * Max length for DNS safe string
 */
export const DNS_SAFE_NAME_MAX_LENGTH = 63;

/**
 * Actor name constraints.
 */
export const ACTOR_NAME = {
    MIN_LENGTH: 3,
    MAX_LENGTH: DNS_SAFE_NAME_MAX_LENGTH, // DNS-safe string length
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

// The constants below are kept for backwards compatibility
// TODO: Once all references to these are removed, remove these constants too

/** @deprecated Use ACTOR_RESTART_ON_ERROR instead */
export const ACT_RESTART_ON_ERROR = ACTOR_RESTART_ON_ERROR;

/** @deprecated Use ACTOR_JOB_TYPES instead */
export const ACT_JOB_TYPES = ACTOR_JOB_TYPES;

/** @deprecated Use ACTOR_SOURCE_TYPES instead */
export const ACT_SOURCE_TYPES = ACTOR_SOURCE_TYPES;

/** @deprecated Use ACTOR_JOB_STATUSES instead */
export const ACT_JOB_STATUSES = ACTOR_JOB_STATUSES;

/** @deprecated Use ACTOR_JOB_TERMINAL_STATUSES instead */
export const ACT_JOB_TERMINAL_STATUSES = ACTOR_JOB_TERMINAL_STATUSES;

/** @deprecated Use ACTOR_TYPES instead */
export const ACT_TYPES = ACTOR_TYPES;

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
    // The actualy used limit is taken from private package @apify-packages/consts
    BUILD_DEFAULT_MEMORY_MBYTES: 4096,

    // Maximum duration of build in seconds.
    BUILD_TIMEOUT_SECS: 1800,

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
    INPUT_SCHEMA_MAX_BYTES: 500 * 1024,

    // Max length of run/build log in number of characters
    LOG_MAX_CHARS: 10 * 1024 * 1024,
};

/**
 * Contains various limits of the Apify platform.
 */
export const DEFAULT_PLATFORM_LIMITS = {
    // Maximum number of actors per user
    MAX_ACTORS_PER_USER: 500,

    // Maximum number of tasks per user
    MAX_TASKS_PER_USER: 5000,

    // Maximum number of schedules per user
    MAX_SCHEDULES_PER_USER: 100,

    // Maximum number of webhooks per user
    MAX_WEBHOOKS_PER_USER: 100,

    // Maximum number of concurrent actor runs per user for free accounts.
    FREE_ACCOUNT_MAX_CONCURRENT_ACTOR_RUNS_PER_USER: 25,

    // Maximum number of concurrent actor runs per user for paid accounts.
    PAID_ACCOUNT_MAX_CONCURRENT_ACTOR_RUNS_PER_USER: 250,

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
 * Dictionary of environment variable names prefixed with "APIFY_".
 */
export const APIFY_ENV_VARS = {
    API_BASE_URL: 'APIFY_API_BASE_URL',
    API_PUBLIC_BASE_URL: 'APIFY_API_PUBLIC_BASE_URL',
    CHROME_EXECUTABLE_PATH: 'APIFY_CHROME_EXECUTABLE_PATH',
    DEDICATED_CPUS: 'APIFY_DEDICATED_CPUS',
    DISABLE_OUTDATED_WARNING: 'APIFY_DISABLE_OUTDATED_WARNING',
    FACT: 'APIFY_FACT',
    HEADLESS: 'APIFY_HEADLESS',
    INPUT_SECRETS_PRIVATE_KEY_FILE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_FILE',
    INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE',
    IS_AT_HOME: 'APIFY_IS_AT_HOME',
    LOCAL_STORAGE_DIR: 'APIFY_LOCAL_STORAGE_DIR',
    LOG_LEVEL: 'APIFY_LOG_LEVEL',
    LOG_FORMAT: 'APIFY_LOG_FORMAT',
    META_ORIGIN: 'APIFY_META_ORIGIN',
    METAMORPH_AFTER_SLEEP_MILLIS: 'APIFY_METAMORPH_AFTER_SLEEP_MILLIS',
    PERSIST_STATE_INTERVAL_MILLIS: 'APIFY_PERSIST_STATE_INTERVAL_MILLIS',
    PROXY_PASSWORD: 'APIFY_PROXY_PASSWORD',
    PROXY_HOSTNAME: 'APIFY_PROXY_HOSTNAME',
    PROXY_PORT: 'APIFY_PROXY_PORT',
    PROXY_STATUS_URL: 'APIFY_PROXY_STATUS_URL',
    PURGE_ON_START: 'APIFY_PURGE_ON_START',
    SDK_LATEST_VERSION: 'APIFY_SDK_LATEST_VERSION',
    SYSTEM_INFO_INTERVAL_MILLIS: 'APIFY_SYSTEM_INFO_INTERVAL_MILLIS',
    TOKEN: 'APIFY_TOKEN',
    USER_ID: 'APIFY_USER_ID',
    WORKFLOW_KEY: 'APIFY_WORKFLOW_KEY',
    XVFB: 'APIFY_XVFB',

    // Replaced by ACTOR_ENV_VARS, kept for backward compatibility:
    ACTOR_BUILD_ID: 'APIFY_ACTOR_BUILD_ID',
    ACTOR_BUILD_NUMBER: 'APIFY_ACTOR_BUILD_NUMBER',
    ACTOR_EVENTS_WS_URL: 'APIFY_ACTOR_EVENTS_WS_URL',
    ACTOR_ID: 'APIFY_ACTOR_ID',
    ACTOR_MAX_PAID_DATASET_ITEMS: 'ACTOR_MAX_PAID_DATASET_ITEMS',
    ACTOR_RUN_ID: 'APIFY_ACTOR_RUN_ID',
    ACTOR_TASK_ID: 'APIFY_ACTOR_TASK_ID',
    CONTAINER_PORT: 'APIFY_CONTAINER_PORT',
    CONTAINER_URL: 'APIFY_CONTAINER_URL',
    DEFAULT_DATASET_ID: 'APIFY_DEFAULT_DATASET_ID',
    DEFAULT_KEY_VALUE_STORE_ID: 'APIFY_DEFAULT_KEY_VALUE_STORE_ID',
    DEFAULT_REQUEST_QUEUE_ID: 'APIFY_DEFAULT_REQUEST_QUEUE_ID',
    INPUT_KEY: 'APIFY_INPUT_KEY',
    MEMORY_MBYTES: 'APIFY_MEMORY_MBYTES',
    STARTED_AT: 'APIFY_STARTED_AT',
    TIMEOUT_AT: 'APIFY_TIMEOUT_AT',

    // Deprecated, keep them for backward compatibility:
    ACT_ID: 'APIFY_ACT_ID',
    ACT_RUN_ID: 'APIFY_ACT_RUN_ID',
} as const;

/**
 * @deprecated `ENV_VARS` were replaced by `APIFY_ENV_VARS`. We currently keep this for backwards compatibility.
 */
export const ENV_VARS = APIFY_ENV_VARS;

/**
 * Dictionary of environment variable names prefixed with "ACTOR_".
 * Follows from Actor specs https://github.com/apify/actor-specs/#environment-variables
 */
export const ACTOR_ENV_VARS = {
    BUILD_ID: 'ACTOR_BUILD_ID',
    BUILD_NUMBER: 'ACTOR_BUILD_NUMBER',
    DEFAULT_DATASET_ID: 'ACTOR_DEFAULT_DATASET_ID',
    DEFAULT_KEY_VALUE_STORE_ID: 'ACTOR_DEFAULT_KEY_VALUE_STORE_ID',
    DEFAULT_REQUEST_QUEUE_ID: 'ACTOR_DEFAULT_REQUEST_QUEUE_ID',
    EVENTS_WEBSOCKET_URL: 'ACTOR_EVENTS_WEBSOCKET_URL',
    ID: 'ACTOR_ID',
    INPUT_KEY: 'ACTOR_INPUT_KEY',
    MAX_PAID_DATASET_ITEMS: 'ACTOR_MAX_PAID_DATASET_ITEMS',
    MAX_TOTAL_CHARGE_USD: 'ACTOR_MAX_TOTAL_CHARGE_USD',
    MEMORY_MBYTES: 'ACTOR_MEMORY_MBYTES',
    RUN_ID: 'ACTOR_RUN_ID',
    STANDBY_PORT: 'ACTOR_STANDBY_PORT',
    STANDBY_URL: 'ACTOR_STANDBY_URL',
    STARTED_AT: 'ACTOR_STARTED_AT',
    TASK_ID: 'ACTOR_TASK_ID',
    TIMEOUT_AT: 'ACTOR_TIMEOUT_AT',
    WEB_SERVER_PORT: 'ACTOR_WEB_SERVER_PORT',
    WEB_SERVER_URL: 'ACTOR_WEB_SERVER_URL',
} as const;

// TODO: Discuss what to include here and whether to split into ACTOR and APIFY or not.
export const INTEGER_ENV_VARS = [
    // Actor env vars
    ACTOR_ENV_VARS.MAX_PAID_DATASET_ITEMS,
    ACTOR_ENV_VARS.MEMORY_MBYTES,
    ACTOR_ENV_VARS.STANDBY_PORT,
    ACTOR_ENV_VARS.WEB_SERVER_PORT,
    // Apify env vars
    APIFY_ENV_VARS.ACTOR_MAX_PAID_DATASET_ITEMS,
    APIFY_ENV_VARS.CONTAINER_PORT,
    APIFY_ENV_VARS.DEDICATED_CPUS,
    APIFY_ENV_VARS.MEMORY_MBYTES,
    APIFY_ENV_VARS.METAMORPH_AFTER_SLEEP_MILLIS,
    APIFY_ENV_VARS.PERSIST_STATE_INTERVAL_MILLIS,
    APIFY_ENV_VARS.PROXY_PORT,
    APIFY_ENV_VARS.SYSTEM_INFO_INTERVAL_MILLIS,
] as const;

/**
 * Dictionary of names of build-time variables passed to the Actor's Docker build process.
 */
export const ACTOR_BUILD_ARGS = {
    ACTOR_PATH_IN_DOCKER_CONTEXT: 'ACTOR_PATH_IN_DOCKER_CONTEXT',
};

/**
 * Default value for APIFY_CONTAINER_PORT used both locally and at Apify platform.
 */
export const DEFAULT_CONTAINER_PORT = 4321;

/**
 * @deprecated Please use `DEFAULT_CONTAINER_PORT` instead, the value is the same.
 * Default value for ACTOR_STANDBY_PORT used both locally and at Apify platform.
 */
export const DEFAULT_ACTOR_STANDBY_PORT = DEFAULT_CONTAINER_PORT;

/**
 * Local emulation sub directories for local stores
 */
export const LOCAL_STORAGE_SUBDIRS = {
    datasets: 'datasets',
    keyValueStores: 'key_value_stores',
    requestQueues: 'request_queues',
} as const;

/**
 * Local defaults for of some of the Actor environment variables.
 * These are being preset in Apify SDK when it's running out of the Apify platform.
 */
export const LOCAL_ACTOR_ENV_VARS = {
    [ACTOR_ENV_VARS.STANDBY_PORT]: DEFAULT_CONTAINER_PORT.toString(),
    [ACTOR_ENV_VARS.DEFAULT_DATASET_ID]: 'default',
    [ACTOR_ENV_VARS.DEFAULT_KEY_VALUE_STORE_ID]: 'default',
    [ACTOR_ENV_VARS.DEFAULT_REQUEST_QUEUE_ID]: 'default',
    [ACTOR_ENV_VARS.WEB_SERVER_PORT]: DEFAULT_CONTAINER_PORT.toString(),
    [ACTOR_ENV_VARS.WEB_SERVER_URL]: `http://localhost:${DEFAULT_CONTAINER_PORT}`, // Must match port line above!
};

/**
 * Local defaults for of some of the Apify environment variables.
 * These are being preset in Apify SDK when it's running out of the Apify platform.
 */
export const LOCAL_APIFY_ENV_VARS = {
    [APIFY_ENV_VARS.CONTAINER_PORT]: LOCAL_ACTOR_ENV_VARS.ACTOR_WEB_SERVER_PORT,
    [APIFY_ENV_VARS.CONTAINER_URL]: LOCAL_ACTOR_ENV_VARS.ACTOR_WEB_SERVER_URL,
    [APIFY_ENV_VARS.DEFAULT_DATASET_ID]: LOCAL_ACTOR_ENV_VARS.ACTOR_DEFAULT_DATASET_ID,
    [APIFY_ENV_VARS.DEFAULT_KEY_VALUE_STORE_ID]: LOCAL_ACTOR_ENV_VARS.ACTOR_DEFAULT_KEY_VALUE_STORE_ID,
    [APIFY_ENV_VARS.DEFAULT_REQUEST_QUEUE_ID]: LOCAL_ACTOR_ENV_VARS.ACTOR_DEFAULT_REQUEST_QUEUE_ID,
    [APIFY_ENV_VARS.PROXY_HOSTNAME]: 'proxy.apify.com',
    [APIFY_ENV_VARS.PROXY_PORT]: (8000).toString(),
};

/**
 * @deprecated `LOCAL_ENV_VARS` were replaced by `LOCAL_APIFY_ENV_VARS`. We currently keep this for backwards compatibility.
 */
export const LOCAL_ENV_VARS = LOCAL_APIFY_ENV_VARS;

/**
 * Defaults input and output key-value stores keys
 */
export const KEY_VALUE_STORE_KEYS = {
    INPUT: 'INPUT',
    OUTPUT: 'OUTPUT',
} as const;

/**
 * Represents the maximum size in bytes of a request body (decompressed)
 * that will be accepted by the App and API servers.
 */
export const MAX_PAYLOAD_SIZE_BYTES = 9437184; // 9MB

/**
 * Categories for crawlers and actors
 */
export const ACTOR_CATEGORIES = {
    AI: 'AI',
    AUTOMATION: 'Automation',
    BUSINESS: 'Business',
    COVID_19: 'Covid-19',
    DEVELOPER_EXAMPLES: 'Developer examples',
    DEVELOPER_TOOLS: 'Developer tools',
    ECOMMERCE: 'E-commerce',
    FOR_CREATORS: 'For creators',
    GAMES: 'Games',
    JOBS: 'Jobs',
    LEAD_GENERATION: 'Lead generation',
    MARKETING: 'Marketing',
    NEWS: 'News',
    SEO_TOOLS: 'SEO tools',
    SOCIAL_MEDIA: 'Social media',
    TRAVEL: 'Travel',
    VIDEOS: 'Videos',
    REAL_ESTATE: 'Real estate',
    SPORTS: 'Sports',
    EDUCATION: 'Education',
    INTEGRATIONS: 'Integrations',
    OTHER: 'Other',
} as const;

// TODO: Remove this once it's no longer used, now that LEGACY_ACTOR_CATEGORIES is also gone
/** @deprecated Use ACTOR_CATEGORIES instead! */
export const ALL_ACTOR_CATEGORIES = {
    ...ACTOR_CATEGORIES,
    // ...LEGACY_ACTOR_CATEGORIES,
} as const;

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

    ACTOR_BUILD_CREATED: 'ACTOR.BUILD.CREATED',
    ACTOR_BUILD_SUCCEEDED: 'ACTOR.BUILD.SUCCEEDED',
    ACTOR_BUILD_FAILED: 'ACTOR.BUILD.FAILED',
    ACTOR_BUILD_TIMED_OUT: 'ACTOR.BUILD.TIMED_OUT',
    ACTOR_BUILD_ABORTED: 'ACTOR.BUILD.ABORTED',

    TEST: 'TEST',
} as const;

export const WEBHOOK_EVENT_TYPE_GROUPS = {
    ACTOR_RUN: [
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_CREATED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_ABORTED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_RESURRECTED,
    ],
    ACTOR_BUILD: [
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_CREATED,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_ABORTED,
    ],
    // If one of these occurs then we can be sure that none other can occur for the same triggerer.
    ACTOR_RUN_TERMINAL: [
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_RUN_ABORTED,
    ],
    ACTOR_BUILD_TERMINAL: [
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_SUCCEEDED,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_FAILED,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_TIMED_OUT,
        WEBHOOK_EVENT_TYPES.ACTOR_BUILD_ABORTED,
    ],
} as const;

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

// Max allowed size of files in multi-file editor
export const MAX_MULTIFILE_BYTES = 3 * (1024 ** 2); // 3MB

// Formats for multi-file editor files
export const SOURCE_FILE_FORMATS = {
    TEXT: 'TEXT',
    BASE64: 'BASE64',
} as const;

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
} as const;

// Marketplace projects with status from this array is considered as successfully finished
export const FINISHED_PROJECT_STATUSES = [
    PROJECT_STATUSES.READY_FOR_INVOICE,
    PROJECT_STATUSES.INVOICED,
    PROJECT_STATUSES.PAID,
    PROJECT_STATUSES.DELIVERED,
    PROJECT_STATUSES.FINISHED,
] as const;

export const MARKETPLACE_USER_ROLES = {
    DEVELOPER: 'DEVELOPER',
    DATA_EXPERT: 'DATA_EXPERT',
    CUSTOMER: 'CUSTOMER',
} as const;

export const USER_PERSONA_TYPES = {
    DEVELOPER: 'DEVELOPER',
    USER: 'USER',
} as const;

export const GIT_MAIN_BRANCH = 'main';

export const REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION = 25;

export const ISSUES_STATUS_TYPES = {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
} as const;

/**
 * This is used for filtering issues. All issue types to be considered.
 */
export const ISSUES_STATUS_ALL = 'ALL';
