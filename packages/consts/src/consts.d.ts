import type { ValueOf } from './helpers.js';
export declare const FREE_SUBSCRIPTION_PLAN_CODE = 'DEV';
export declare const ACTOR_JOB_TYPES: {
    readonly BUILD: 'BUILD';
    readonly RUN: 'RUN';
};
export declare const ACTOR_SOURCE_TYPES: {
    readonly SOURCE_CODE: 'SOURCE_CODE';
    readonly SOURCE_FILES: 'SOURCE_FILES';
    readonly GIT_REPO: 'GIT_REPO';
    readonly TARBALL: 'TARBALL';
    readonly GITHUB_GIST: 'GITHUB_GIST';
};
export declare const ACTOR_EVENT_NAMES: {
    readonly CPU_INFO: 'cpuInfo';
    readonly SYSTEM_INFO: 'systemInfo';
    readonly MIGRATING: 'migrating';
    readonly PERSIST_STATE: 'persistState';
    readonly ABORTING: 'aborting';
};
/**
 * Dictionary of possible values for 'status' field of act2Builds or act2Runs collections.
 */
export declare const ACTOR_JOB_STATUSES: {
    readonly READY: 'READY';
    readonly RUNNING: 'RUNNING';
    readonly SUCCEEDED: 'SUCCEEDED';
    readonly FAILED: 'FAILED';
    readonly TIMING_OUT: 'TIMING-OUT';
    readonly TIMED_OUT: 'TIMED-OUT';
    readonly ABORTING: 'ABORTING';
    readonly ABORTED: 'ABORTED';
};
/**
 * Dictionary of possible values for 'status' field of webhookDispatches collections.
 */
export declare const WEBHOOK_DISPATCH_STATUSES: {
    readonly ACTIVE: 'ACTIVE';
    readonly SUCCEEDED: 'SUCCEEDED';
    readonly FAILED: 'FAILED';
};
/**
 * An array of act jobs statuses that are final for the jobs.
 */
export declare const ACTOR_JOB_TERMINAL_STATUSES: readonly ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'];
export declare const WORKER_SERVICE_TYPES: {
    readonly CRAWLING: 'crawling';
    readonly ACTOR: 'actor';
};
export declare const META_ORIGINS: {
    readonly DEVELOPMENT: 'DEVELOPMENT';
    readonly WEB: 'WEB';
    readonly API: 'API';
    readonly SCHEDULER: 'SCHEDULER';
    readonly TEST: 'TEST';
    readonly WEBHOOK: 'WEBHOOK';
    readonly ACTOR: 'ACTOR';
    readonly CLI: 'CLI';
    readonly STANDBY: 'STANDBY';
    readonly CI: 'CI';
    readonly MCP: 'MCP';
    readonly APIFY_AI: 'APIFY_AI';
};
/**
 * Keys of labels applied to act Docker images and containers.
 */
export declare const DOCKER_LABELS: {
    readonly ACTOR_BUILD_ID: 'com.apify.actBuildId';
    readonly ACTOR_RUN_ID: 'com.apify.actRunId';
    /** @deprecated Use ACTOR_BUILD_ID instead! */
    readonly ACT_BUILD_ID: 'com.apify.actBuildId';
    /** @deprecated Use ACTOR_RUN_ID instead! */
    readonly ACT_RUN_ID: 'com.apify.actRunId';
};
/**
 * Acts types
 */
export declare const ACTOR_TYPES: {
    readonly ACT: 'acts';
    readonly CRAWLER: 'crawlers';
};
/**
 * Used as username for returning user own info from API v2/users/username
 */
export declare const ME_USER_NAME_PLACEHOLDER = 'me';
/**
 * Username used when user is anonymous.
 */
export declare const ANONYMOUS_USERNAME = 'anonymous';
/**
 * Username constraints.
 */
export declare const USERNAME: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    REGEX: RegExp;
    RESTRICTED_REGEX: RegExp;
};
export declare const EMAIL: {
    MAX_LENGTH: number;
    REGEX: RegExp;
};
/**
 * Profile name (such as organization or first / last name) constraints.
 */
export declare const PROFILE_NAME: {
    MAX_LENGTH: number;
    REGEX: RegExp;
};
/**
 * Max length for DNS safe string
 */
export declare const DNS_SAFE_NAME_MAX_LENGTH = 63;
/**
 * Actor name constraints.
 */
export declare const ACTOR_NAME: {
    MIN_LENGTH: number;
    MAX_LENGTH: number;
    REGEX: RegExp;
};
/**
 * Length of short crawler ID for nice public crawlers path.
 */
export declare const SHORT_CRAWLER_ID_LENGTH = 5;
/**
 * Default build tag used for latest act version.
 */
export declare const BUILD_TAG_LATEST = 'latest';
/**
 * Behaviour of act restart on error.
 * Act gets restarted when there are less than MAX_RESTARTS in the last INTERVAL_MILLIS.
 */
export declare const ACTOR_RESTART_ON_ERROR: {
    MAX_RESTARTS: number;
    INTERVAL_MILLIS: number;
};
/** @deprecated Use ACTOR_RESTART_ON_ERROR instead */
export declare const ACT_RESTART_ON_ERROR: {
    MAX_RESTARTS: number;
    INTERVAL_MILLIS: number;
};
/** @deprecated Use ACTOR_JOB_TYPES instead */
export declare const ACT_JOB_TYPES: {
    readonly BUILD: 'BUILD';
    readonly RUN: 'RUN';
};
/** @deprecated Use ACTOR_SOURCE_TYPES instead */
export declare const ACT_SOURCE_TYPES: {
    readonly SOURCE_CODE: 'SOURCE_CODE';
    readonly SOURCE_FILES: 'SOURCE_FILES';
    readonly GIT_REPO: 'GIT_REPO';
    readonly TARBALL: 'TARBALL';
    readonly GITHUB_GIST: 'GITHUB_GIST';
};
/** @deprecated Use ACTOR_JOB_STATUSES instead */
export declare const ACT_JOB_STATUSES: {
    readonly READY: 'READY';
    readonly RUNNING: 'RUNNING';
    readonly SUCCEEDED: 'SUCCEEDED';
    readonly FAILED: 'FAILED';
    readonly TIMING_OUT: 'TIMING-OUT';
    readonly TIMED_OUT: 'TIMED-OUT';
    readonly ABORTING: 'ABORTING';
    readonly ABORTED: 'ABORTED';
};
/** @deprecated Use ACTOR_JOB_TERMINAL_STATUSES instead */
export declare const ACT_JOB_TERMINAL_STATUSES: readonly ['SUCCEEDED', 'FAILED', 'TIMED-OUT', 'ABORTED'];
/** @deprecated Use ACTOR_TYPES instead */
export declare const ACT_TYPES: {
    readonly ACT: 'acts';
    readonly CRAWLER: 'crawlers';
};
/**
 * 1 compute unit = 1GB * 1Hour.
 */
export declare const COMPUTE_UNIT_MB = 1024;
export declare const COMPUTE_UNIT_MILLIS: number;
/**
 * Contains various Actor platform limits that are shared between the projects.
 * IMPORTANT: If you update any of them, update also https://github.com/apifytech/apify-docs/edit/master/docs/actor/limits.md !!!
 */
export declare const ACTOR_LIMITS: {
    BUILD_DEFAULT_MEMORY_MBYTES: number;
    BUILD_TIMEOUT_SECS: number;
    RUN_DISK_TO_MEMORY_SIZE_COEFF: number;
    RUN_MEMORY_MBYTES_PER_CPU_CORE: number;
    FREE_ACCOUNT_MAX_MEMORY_MBYTES: number;
    PAID_ACCOUNT_MAX_MEMORY_MBYTES: number;
    MIN_RUN_MEMORY_MBYTES: number;
    MAX_RUN_MEMORY_MBYTES: number;
    INPUT_SCHEMA_MAX_BYTES: number;
    LOG_MAX_CHARS: number;
};
/**
 * Contains various limits of the Apify platform.
 */
export declare const DEFAULT_PLATFORM_LIMITS: {
    MAX_ACTORS_PER_USER: number;
    MAX_TASKS_PER_USER: number;
    MAX_SCHEDULES_PER_USER: number;
    MAX_WEBHOOKS_PER_USER: number;
    FREE_ACCOUNT_MAX_CONCURRENT_ACTOR_RUNS_PER_USER: number;
    PAID_ACCOUNT_MAX_CONCURRENT_ACTOR_RUNS_PER_USER: number;
    MAX_ACTORS_PER_SCHEDULER: number;
    MAX_TASKS_PER_SCHEDULER: number;
};
/**
 * Max length of the queue head that server will return in Request Queue API.
 */
export declare const REQUEST_QUEUE_HEAD_MAX_LIMIT = 1000;
/**
 * Dictionary of environment variable names prefixed with "APIFY_".
 */
export declare const APIFY_ENV_VARS: {
    readonly ACTOR_PRICING_INFO: 'APIFY_ACTOR_PRICING_INFO';
    readonly API_BASE_URL: 'APIFY_API_BASE_URL';
    readonly API_PUBLIC_BASE_URL: 'APIFY_API_PUBLIC_BASE_URL';
    readonly CHARGED_ACTOR_EVENT_COUNTS: 'APIFY_CHARGED_ACTOR_EVENT_COUNTS';
    readonly CHROME_EXECUTABLE_PATH: 'APIFY_CHROME_EXECUTABLE_PATH';
    readonly DEDICATED_CPUS: 'APIFY_DEDICATED_CPUS';
    readonly DISABLE_OUTDATED_WARNING: 'APIFY_DISABLE_OUTDATED_WARNING';
    readonly FACT: 'APIFY_FACT';
    readonly HEADLESS: 'APIFY_HEADLESS';
    readonly INPUT_SECRETS_PRIVATE_KEY_FILE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_FILE';
    readonly INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE';
    readonly IS_AT_HOME: 'APIFY_IS_AT_HOME';
    readonly LOCAL_STORAGE_DIR: 'APIFY_LOCAL_STORAGE_DIR';
    readonly LOG_FORMAT: 'APIFY_LOG_FORMAT';
    readonly LOG_LEVEL: 'APIFY_LOG_LEVEL';
    readonly METAMORPH_AFTER_SLEEP_MILLIS: 'APIFY_METAMORPH_AFTER_SLEEP_MILLIS';
    readonly META_ORIGIN: 'APIFY_META_ORIGIN';
    readonly PERSIST_STATE_INTERVAL_MILLIS: 'APIFY_PERSIST_STATE_INTERVAL_MILLIS';
    readonly PROXY_HOSTNAME: 'APIFY_PROXY_HOSTNAME';
    readonly PROXY_PASSWORD: 'APIFY_PROXY_PASSWORD';
    readonly PROXY_PORT: 'APIFY_PROXY_PORT';
    readonly PROXY_STATUS_URL: 'APIFY_PROXY_STATUS_URL';
    readonly PURGE_ON_START: 'APIFY_PURGE_ON_START';
    readonly SDK_LATEST_VERSION: 'APIFY_SDK_LATEST_VERSION';
    readonly SYSTEM_INFO_INTERVAL_MILLIS: 'APIFY_SYSTEM_INFO_INTERVAL_MILLIS';
    readonly TOKEN: 'APIFY_TOKEN';
    readonly USER_ID: 'APIFY_USER_ID';
    readonly USER_IS_PAYING: 'APIFY_USER_IS_PAYING';
    readonly USER_PRICING_TIER: 'APIFY_USER_PRICING_TIER';
    readonly WORKFLOW_KEY: 'APIFY_WORKFLOW_KEY';
    readonly XVFB: 'APIFY_XVFB';
    readonly ACTOR_BUILD_ID: 'APIFY_ACTOR_BUILD_ID';
    readonly ACTOR_BUILD_NUMBER: 'APIFY_ACTOR_BUILD_NUMBER';
    readonly ACTOR_EVENTS_WS_URL: 'APIFY_ACTOR_EVENTS_WS_URL';
    readonly ACTOR_ID: 'APIFY_ACTOR_ID';
    readonly ACTOR_MAX_PAID_DATASET_ITEMS: 'ACTOR_MAX_PAID_DATASET_ITEMS';
    readonly ACTOR_RUN_ID: 'APIFY_ACTOR_RUN_ID';
    readonly ACTOR_TASK_ID: 'APIFY_ACTOR_TASK_ID';
    readonly CONTAINER_PORT: 'APIFY_CONTAINER_PORT';
    readonly CONTAINER_URL: 'APIFY_CONTAINER_URL';
    readonly DEFAULT_DATASET_ID: 'APIFY_DEFAULT_DATASET_ID';
    readonly DEFAULT_KEY_VALUE_STORE_ID: 'APIFY_DEFAULT_KEY_VALUE_STORE_ID';
    readonly DEFAULT_REQUEST_QUEUE_ID: 'APIFY_DEFAULT_REQUEST_QUEUE_ID';
    readonly INPUT_KEY: 'APIFY_INPUT_KEY';
    readonly MEMORY_MBYTES: 'APIFY_MEMORY_MBYTES';
    readonly STARTED_AT: 'APIFY_STARTED_AT';
    readonly TIMEOUT_AT: 'APIFY_TIMEOUT_AT';
    /** @deprecated */
    readonly ACT_ID: 'APIFY_ACT_ID';
    /** @deprecated */
    readonly ACT_RUN_ID: 'APIFY_ACT_RUN_ID';
    /** @deprecated */
    readonly MCP_PROXY_URL: 'APIFY_MCP_PROXY_URL';
};
/**
 * @deprecated `ENV_VARS` were replaced by `APIFY_ENV_VARS`. We currently keep this for backwards compatibility.
 */
export declare const ENV_VARS: {
    readonly ACTOR_PRICING_INFO: 'APIFY_ACTOR_PRICING_INFO';
    readonly API_BASE_URL: 'APIFY_API_BASE_URL';
    readonly API_PUBLIC_BASE_URL: 'APIFY_API_PUBLIC_BASE_URL';
    readonly CHARGED_ACTOR_EVENT_COUNTS: 'APIFY_CHARGED_ACTOR_EVENT_COUNTS';
    readonly CHROME_EXECUTABLE_PATH: 'APIFY_CHROME_EXECUTABLE_PATH';
    readonly DEDICATED_CPUS: 'APIFY_DEDICATED_CPUS';
    readonly DISABLE_OUTDATED_WARNING: 'APIFY_DISABLE_OUTDATED_WARNING';
    readonly FACT: 'APIFY_FACT';
    readonly HEADLESS: 'APIFY_HEADLESS';
    readonly INPUT_SECRETS_PRIVATE_KEY_FILE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_FILE';
    readonly INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE: 'APIFY_INPUT_SECRETS_PRIVATE_KEY_PASSPHRASE';
    readonly IS_AT_HOME: 'APIFY_IS_AT_HOME';
    readonly LOCAL_STORAGE_DIR: 'APIFY_LOCAL_STORAGE_DIR';
    readonly LOG_FORMAT: 'APIFY_LOG_FORMAT';
    readonly LOG_LEVEL: 'APIFY_LOG_LEVEL';
    readonly METAMORPH_AFTER_SLEEP_MILLIS: 'APIFY_METAMORPH_AFTER_SLEEP_MILLIS';
    readonly META_ORIGIN: 'APIFY_META_ORIGIN';
    readonly PERSIST_STATE_INTERVAL_MILLIS: 'APIFY_PERSIST_STATE_INTERVAL_MILLIS';
    readonly PROXY_HOSTNAME: 'APIFY_PROXY_HOSTNAME';
    readonly PROXY_PASSWORD: 'APIFY_PROXY_PASSWORD';
    readonly PROXY_PORT: 'APIFY_PROXY_PORT';
    readonly PROXY_STATUS_URL: 'APIFY_PROXY_STATUS_URL';
    readonly PURGE_ON_START: 'APIFY_PURGE_ON_START';
    readonly SDK_LATEST_VERSION: 'APIFY_SDK_LATEST_VERSION';
    readonly SYSTEM_INFO_INTERVAL_MILLIS: 'APIFY_SYSTEM_INFO_INTERVAL_MILLIS';
    readonly TOKEN: 'APIFY_TOKEN';
    readonly USER_ID: 'APIFY_USER_ID';
    readonly USER_IS_PAYING: 'APIFY_USER_IS_PAYING';
    readonly USER_PRICING_TIER: 'APIFY_USER_PRICING_TIER';
    readonly WORKFLOW_KEY: 'APIFY_WORKFLOW_KEY';
    readonly XVFB: 'APIFY_XVFB';
    readonly ACTOR_BUILD_ID: 'APIFY_ACTOR_BUILD_ID';
    readonly ACTOR_BUILD_NUMBER: 'APIFY_ACTOR_BUILD_NUMBER';
    readonly ACTOR_EVENTS_WS_URL: 'APIFY_ACTOR_EVENTS_WS_URL';
    readonly ACTOR_ID: 'APIFY_ACTOR_ID';
    readonly ACTOR_MAX_PAID_DATASET_ITEMS: 'ACTOR_MAX_PAID_DATASET_ITEMS';
    readonly ACTOR_RUN_ID: 'APIFY_ACTOR_RUN_ID';
    readonly ACTOR_TASK_ID: 'APIFY_ACTOR_TASK_ID';
    readonly CONTAINER_PORT: 'APIFY_CONTAINER_PORT';
    readonly CONTAINER_URL: 'APIFY_CONTAINER_URL';
    readonly DEFAULT_DATASET_ID: 'APIFY_DEFAULT_DATASET_ID';
    readonly DEFAULT_KEY_VALUE_STORE_ID: 'APIFY_DEFAULT_KEY_VALUE_STORE_ID';
    readonly DEFAULT_REQUEST_QUEUE_ID: 'APIFY_DEFAULT_REQUEST_QUEUE_ID';
    readonly INPUT_KEY: 'APIFY_INPUT_KEY';
    readonly MEMORY_MBYTES: 'APIFY_MEMORY_MBYTES';
    readonly STARTED_AT: 'APIFY_STARTED_AT';
    readonly TIMEOUT_AT: 'APIFY_TIMEOUT_AT';
    /** @deprecated */
    readonly ACT_ID: 'APIFY_ACT_ID';
    /** @deprecated */
    readonly ACT_RUN_ID: 'APIFY_ACT_RUN_ID';
    /** @deprecated */
    readonly MCP_PROXY_URL: 'APIFY_MCP_PROXY_URL';
};
/**
 * Dictionary of environment variable names prefixed with "ACTOR_".
 * Follows from Actor specs https://github.com/apify/actor-specs/#environment-variables
 */
export declare const ACTOR_ENV_VARS: {
    readonly BUILD_ID: 'ACTOR_BUILD_ID';
    readonly BUILD_NUMBER: 'ACTOR_BUILD_NUMBER';
    readonly BUILD_TAGS: 'ACTOR_BUILD_TAGS';
    readonly DEFAULT_DATASET_ID: 'ACTOR_DEFAULT_DATASET_ID';
    readonly DEFAULT_KEY_VALUE_STORE_ID: 'ACTOR_DEFAULT_KEY_VALUE_STORE_ID';
    readonly DEFAULT_REQUEST_QUEUE_ID: 'ACTOR_DEFAULT_REQUEST_QUEUE_ID';
    readonly STORAGES_JSON: 'ACTOR_STORAGES_JSON';
    readonly EVENTS_WEBSOCKET_URL: 'ACTOR_EVENTS_WEBSOCKET_URL';
    readonly FULL_NAME: 'ACTOR_FULL_NAME';
    readonly ID: 'ACTOR_ID';
    readonly INPUT_KEY: 'ACTOR_INPUT_KEY';
    readonly MAX_PAID_DATASET_ITEMS: 'ACTOR_MAX_PAID_DATASET_ITEMS';
    readonly MAX_TOTAL_CHARGE_USD: 'ACTOR_MAX_TOTAL_CHARGE_USD';
    readonly MCP_CONNECTOR_BASE_URL: 'ACTOR_MCP_CONNECTOR_BASE_URL';
    readonly MEMORY_MBYTES: 'ACTOR_MEMORY_MBYTES';
    readonly RESTART_ON_ERROR: 'ACTOR_RESTART_ON_ERROR';
    readonly PERMISSION_LEVEL: 'ACTOR_PERMISSION_LEVEL';
    readonly RUN_ID: 'ACTOR_RUN_ID';
    readonly STANDBY_PORT: 'ACTOR_STANDBY_PORT';
    readonly STANDBY_URL: 'ACTOR_STANDBY_URL';
    readonly STARTED_AT: 'ACTOR_STARTED_AT';
    readonly TASK_ID: 'ACTOR_TASK_ID';
    readonly TIMEOUT_AT: 'ACTOR_TIMEOUT_AT';
    readonly WEB_SERVER_PORT: 'ACTOR_WEB_SERVER_PORT';
    readonly WEB_SERVER_URL: 'ACTOR_WEB_SERVER_URL';
};
export declare const INTEGER_ENV_VARS: readonly [
    'ACTOR_MAX_PAID_DATASET_ITEMS',
    'ACTOR_MEMORY_MBYTES',
    'ACTOR_STANDBY_PORT',
    'ACTOR_WEB_SERVER_PORT',
    'ACTOR_MAX_PAID_DATASET_ITEMS',
    'APIFY_CONTAINER_PORT',
    'APIFY_DEDICATED_CPUS',
    'APIFY_MEMORY_MBYTES',
    'APIFY_METAMORPH_AFTER_SLEEP_MILLIS',
    'APIFY_PERSIST_STATE_INTERVAL_MILLIS',
    'APIFY_PROXY_PORT',
    'APIFY_SYSTEM_INFO_INTERVAL_MILLIS',
];
export declare const COMMA_SEPARATED_LIST_ENV_VARS: readonly ['ACTOR_BUILD_TAGS'];
export declare const JSON_ENCODED_ENV_VARS: readonly ['ACTOR_STORAGES_JSON'];
/**
 * Dictionary of names of build-time variables passed to the Actor's Docker build process.
 */
export declare const ACTOR_BUILD_ARGS: {
    ACTOR_PATH_IN_DOCKER_CONTEXT: string;
};
/**
 * Default value for APIFY_CONTAINER_PORT used both locally and at Apify platform.
 */
export declare const DEFAULT_CONTAINER_PORT = 4321;
/**
 * @deprecated Please use `DEFAULT_CONTAINER_PORT` instead, the value is the same.
 * Default value for ACTOR_STANDBY_PORT used both locally and at Apify platform.
 */
export declare const DEFAULT_ACTOR_STANDBY_PORT = 4321;
/**
 * Local emulation sub directories for local stores
 */
export declare const LOCAL_STORAGE_SUBDIRS: {
    readonly datasets: 'datasets';
    readonly keyValueStores: 'key_value_stores';
    readonly requestQueues: 'request_queues';
};
/**
 * Local defaults for of some of the Actor environment variables.
 * These are being preset in Apify SDK when it's running out of the Apify platform.
 */
export declare const LOCAL_ACTOR_ENV_VARS: {
    ACTOR_STANDBY_PORT: string;
    ACTOR_DEFAULT_DATASET_ID: string;
    ACTOR_DEFAULT_KEY_VALUE_STORE_ID: string;
    ACTOR_DEFAULT_REQUEST_QUEUE_ID: string;
    ACTOR_WEB_SERVER_PORT: string;
    ACTOR_WEB_SERVER_URL: string;
};
/**
 * Local defaults for of some of the Apify environment variables.
 * These are being preset in Apify SDK when it's running out of the Apify platform.
 */
export declare const LOCAL_APIFY_ENV_VARS: {
    APIFY_CONTAINER_PORT: string;
    APIFY_CONTAINER_URL: string;
    APIFY_DEFAULT_DATASET_ID: string;
    APIFY_DEFAULT_KEY_VALUE_STORE_ID: string;
    APIFY_DEFAULT_REQUEST_QUEUE_ID: string;
    APIFY_PROXY_HOSTNAME: string;
    APIFY_PROXY_PORT: string;
};
/**
 * @deprecated `LOCAL_ENV_VARS` were replaced by `LOCAL_APIFY_ENV_VARS`. We currently keep this for backwards compatibility.
 */
export declare const LOCAL_ENV_VARS: {
    APIFY_CONTAINER_PORT: string;
    APIFY_CONTAINER_URL: string;
    APIFY_DEFAULT_DATASET_ID: string;
    APIFY_DEFAULT_KEY_VALUE_STORE_ID: string;
    APIFY_DEFAULT_REQUEST_QUEUE_ID: string;
    APIFY_PROXY_HOSTNAME: string;
    APIFY_PROXY_PORT: string;
};
/**
 * Defaults input and output key-value stores keys
 */
export declare const KEY_VALUE_STORE_KEYS: {
    readonly INPUT: 'INPUT';
    readonly OUTPUT: 'OUTPUT';
};
/**
 * Represents the maximum size in bytes of a request body (decompressed)
 * that will be accepted by the App and API servers.
 */
export declare const MAX_PAYLOAD_SIZE_BYTES = 9437184;
/**
 * Categories for crawlers and actors
 */
export declare const ACTOR_CATEGORIES: {
    readonly AI: 'AI';
    readonly AGENTS: 'Agents';
    readonly AUTOMATION: 'Automation';
    readonly BUSINESS: 'Business';
    readonly COVID_19: 'Covid-19';
    readonly DEVELOPER_EXAMPLES: 'Developer examples';
    readonly DEVELOPER_TOOLS: 'Developer tools';
    readonly ECOMMERCE: 'E-commerce';
    readonly FOR_CREATORS: 'For creators';
    readonly GAMES: 'Games';
    readonly JOBS: 'Jobs';
    readonly LEAD_GENERATION: 'Lead generation';
    readonly MARKETING: 'Marketing';
    readonly NEWS: 'News';
    readonly SEO_TOOLS: 'SEO tools';
    readonly SOCIAL_MEDIA: 'Social media';
    readonly TRAVEL: 'Travel';
    readonly VIDEOS: 'Videos';
    readonly REAL_ESTATE: 'Real estate';
    readonly SPORTS: 'Sports';
    readonly EDUCATION: 'Education';
    readonly INTEGRATIONS: 'Integrations';
    readonly OTHER: 'Other';
    readonly OPEN_SOURCE: 'Open source';
    readonly MCP_SERVERS: 'MCP servers';
};
/** @deprecated Use ACTOR_CATEGORIES instead! */
export declare const ALL_ACTOR_CATEGORIES: {
    readonly AI: 'AI';
    readonly AGENTS: 'Agents';
    readonly AUTOMATION: 'Automation';
    readonly BUSINESS: 'Business';
    readonly COVID_19: 'Covid-19';
    readonly DEVELOPER_EXAMPLES: 'Developer examples';
    readonly DEVELOPER_TOOLS: 'Developer tools';
    readonly ECOMMERCE: 'E-commerce';
    readonly FOR_CREATORS: 'For creators';
    readonly GAMES: 'Games';
    readonly JOBS: 'Jobs';
    readonly LEAD_GENERATION: 'Lead generation';
    readonly MARKETING: 'Marketing';
    readonly NEWS: 'News';
    readonly SEO_TOOLS: 'SEO tools';
    readonly SOCIAL_MEDIA: 'Social media';
    readonly TRAVEL: 'Travel';
    readonly VIDEOS: 'Videos';
    readonly REAL_ESTATE: 'Real estate';
    readonly SPORTS: 'Sports';
    readonly EDUCATION: 'Education';
    readonly INTEGRATIONS: 'Integrations';
    readonly OTHER: 'Other';
    readonly OPEN_SOURCE: 'Open source';
    readonly MCP_SERVERS: 'MCP servers';
};
/**
 * Bases for converting version/build number to/from string/integer
 */
export declare const VERSION_INT_MAJOR_BASE = 10000000;
export declare const VERSION_INT_MINOR_BASE = 100000;
/**
 * Basic options for XSS sanitization
 */
export declare const USER_BASIC_TEXT_XSS_OPTIONS: {
    whiteList: {
        a: string[];
        code: never[];
        strong: never[];
        b: never[];
        br: never[];
        ul: never[];
        li: never[];
        ol: never[];
        i: never[];
        u: never[];
        p: never[];
    };
};
export declare const WEBHOOK_EVENT_TYPES: {
    readonly ACTOR_RUN_CREATED: 'ACTOR.RUN.CREATED';
    readonly ACTOR_RUN_SUCCEEDED: 'ACTOR.RUN.SUCCEEDED';
    readonly ACTOR_RUN_FAILED: 'ACTOR.RUN.FAILED';
    readonly ACTOR_RUN_TIMED_OUT: 'ACTOR.RUN.TIMED_OUT';
    readonly ACTOR_RUN_ABORTED: 'ACTOR.RUN.ABORTED';
    readonly ACTOR_RUN_RESURRECTED: 'ACTOR.RUN.RESURRECTED';
    readonly ACTOR_BUILD_CREATED: 'ACTOR.BUILD.CREATED';
    readonly ACTOR_BUILD_SUCCEEDED: 'ACTOR.BUILD.SUCCEEDED';
    readonly ACTOR_BUILD_FAILED: 'ACTOR.BUILD.FAILED';
    readonly ACTOR_BUILD_TIMED_OUT: 'ACTOR.BUILD.TIMED_OUT';
    readonly ACTOR_BUILD_ABORTED: 'ACTOR.BUILD.ABORTED';
    readonly TEST: 'TEST';
};
export declare const WEBHOOK_EVENT_TYPE_GROUPS: {
    readonly ACTOR_RUN: readonly [
        'ACTOR.RUN.CREATED',
        'ACTOR.RUN.SUCCEEDED',
        'ACTOR.RUN.FAILED',
        'ACTOR.RUN.TIMED_OUT',
        'ACTOR.RUN.ABORTED',
        'ACTOR.RUN.RESURRECTED',
    ];
    readonly ACTOR_BUILD: readonly [
        'ACTOR.BUILD.CREATED',
        'ACTOR.BUILD.SUCCEEDED',
        'ACTOR.BUILD.FAILED',
        'ACTOR.BUILD.TIMED_OUT',
        'ACTOR.BUILD.ABORTED',
    ];
    readonly ACTOR_RUN_TERMINAL: readonly [
        'ACTOR.RUN.SUCCEEDED',
        'ACTOR.RUN.FAILED',
        'ACTOR.RUN.TIMED_OUT',
        'ACTOR.RUN.ABORTED',
    ];
    readonly ACTOR_BUILD_TERMINAL: readonly [
        'ACTOR.BUILD.SUCCEEDED',
        'ACTOR.BUILD.FAILED',
        'ACTOR.BUILD.TIMED_OUT',
        'ACTOR.BUILD.ABORTED',
    ];
};
export declare const WEBHOOK_DEFAULT_PAYLOAD_TEMPLATE =
    '{\n    "userId": {{userId}},\n    "createdAt": {{createdAt}},\n    "eventType": {{eventType}},\n    "eventData": {{eventData}},\n    "resource": {{resource}}\n}';
export declare const WEBHOOK_ALLOWED_PAYLOAD_VARIABLES: Set<string>;
export declare const MAX_MULTIFILE_BYTES: number;
export declare const SOURCE_FILE_FORMATS: {
    readonly TEXT: 'TEXT';
    readonly BASE64: 'BASE64';
};
export declare const PROJECT_STATUSES: {
    readonly REQUEST: 'REQUEST';
    readonly SPECIFICATION: 'SPECIFICATION';
    readonly OFFERS: 'OFFERS';
    readonly DEPOSIT: 'DEPOSIT';
    readonly DEPOSIT_PAID: 'DEPOSIT_PAID';
    readonly NEW: 'NEW';
    readonly IN_PROGRESS: 'IN_PROGRESS';
    readonly QA: 'QA';
    readonly CUSTOMER_QA: 'CUSTOMER_QA';
    readonly READY_FOR_INVOICE: 'READY_FOR_INVOICE';
    readonly INVOICED: 'INVOICED';
    readonly PAID: 'PAID';
    readonly DELIVERED: 'DELIVERED';
    readonly CLOSED: 'CLOSED';
    readonly FINISHED: 'FINISHED';
};
export declare const FINISHED_PROJECT_STATUSES: readonly [
    'READY_FOR_INVOICE',
    'INVOICED',
    'PAID',
    'DELIVERED',
    'FINISHED',
];
export declare const MARKETPLACE_USER_ROLES: {
    readonly DEVELOPER: 'DEVELOPER';
    readonly DATA_EXPERT: 'DATA_EXPERT';
    readonly CUSTOMER: 'CUSTOMER';
};
export declare const USER_PERSONA_TYPES: {
    readonly DEVELOPER: 'DEVELOPER';
    readonly USER: 'USER';
};
export declare const GIT_MAIN_BRANCH = 'main';
export declare const REQUEST_QUEUE_MAX_REQUESTS_PER_BATCH_OPERATION = 25;
export declare const ISSUES_STATUS_TYPES: {
    readonly OPEN: 'OPEN';
    readonly CLOSED: 'CLOSED';
};
/**
 * This is used for filtering issues. All issue types to be considered.
 */
export declare const ISSUES_STATUS_ALL = 'ALL';
/**
 * Storage setting determining how others can access the storage.
 *
 * This setting overrides the user setting of the storage owner.
 */
export declare const STORAGE_GENERAL_ACCESS: {
    /** Respect the user setting of the storage owner (default behavior). */
    readonly FOLLOW_USER_SETTING: 'FOLLOW_USER_SETTING';
    /** Only signed-in users with explicit access can read this storage. */
    readonly RESTRICTED: 'RESTRICTED';
    /** Anyone with a link, or the unique storage ID, can read the storage. */
    readonly ANYONE_WITH_ID_CAN_READ: 'ANYONE_WITH_ID_CAN_READ';
    /** Anyone with a link, the unique storage ID, or the storage name, can read the storage. */
    readonly ANYONE_WITH_NAME_CAN_READ: 'ANYONE_WITH_NAME_CAN_READ';
};
export type STORAGE_GENERAL_ACCESS = ValueOf<typeof STORAGE_GENERAL_ACCESS>;
/**
 * Run setting determining how others can access the run.
 *
 * This setting overrides the user setting of the run owner.
 */
export declare const RUN_GENERAL_ACCESS: {
    /** Respect the user setting of the run owner (default behavior). */
    readonly FOLLOW_USER_SETTING: 'FOLLOW_USER_SETTING';
    /** Only signed-in users with explicit access can read this run. */
    readonly RESTRICTED: 'RESTRICTED';
    /** Anyone with a link, or the unique run ID, can read the run. */
    readonly ANYONE_WITH_ID_CAN_READ: 'ANYONE_WITH_ID_CAN_READ';
};
export type RUN_GENERAL_ACCESS = ValueOf<typeof RUN_GENERAL_ACCESS>;
/**
 * Determines permissions that the Actor requires to run.
 *
 * Based on this value, the Apify platform generates a scoped run token with a corresponding permission scope and
 * injects it into the Actor runtime.
 *
 * Warning: Make sure you know what you are doing when changing this value, in particular for public Actors!
 */
export declare const ACTOR_PERMISSION_LEVEL: {
    /** Full permission Actors have access to all user data in the account. */
    readonly FULL_PERMISSIONS: 'FULL_PERMISSIONS';
    /**
     * Limited permission Actors have access only to specific resources:
     * - default storages
     * - storages provided via input
     * - the current run
     * - ...
     *
     * Broadly speaking, limited permission Actors cannot access any account data not related to the current run.
     * For details refer to the Apify documentation.
     */
    readonly LIMITED_PERMISSIONS: 'LIMITED_PERMISSIONS';
};
export type ACTOR_PERMISSION_LEVEL = ValueOf<typeof ACTOR_PERMISSION_LEVEL>;
/**
 * Filter for listing storages (datasets, key_value_stores & request_queues) by ownership.
 * If omitted, we currently return both owned and shared storages
 */
export declare const STORAGE_OWNERSHIP_FILTER: {
    /** Return only storages owned by the user. */
    readonly OWNED_BY_ME: 'ownedByMe';
    /** Return only storages shared with the user. */
    readonly SHARED_WITH_ME: 'sharedWithMe';
};
export type STORAGE_OWNERSHIP_FILTER = ValueOf<typeof STORAGE_OWNERSHIP_FILTER>;
/**
 * Exit codes used by an Actor process to signal the outcome of its run.
 * @see {@link https://whitepaper.actor/#exit-actor}
 */
export declare const ACTOR_EXIT_CODE: {
    /** The Actor run finished successfully. */
    readonly SUCCESS: 0;
    /** The Actor run failed due to an error. */
    readonly FAILURE: 1;
    /** The Actor run failed because the provided input was invalid.*/
    readonly INVALID_INPUT: 2;
};
export type ACTOR_EXIT_CODE = ValueOf<typeof ACTOR_EXIT_CODE>;
