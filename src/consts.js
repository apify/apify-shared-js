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
    {
        name: 'apify/actor-node-basic',
        displayName: 'Node.js 8 on Alpine Linux',
        prePull: true,
    },
    {
        name: 'apify/actor-node-puppeteer',
        displayName: 'Node.js 8 + Puppeteer on Debian',
        copyChown: 'node:node',
        prePull: true,
    },
    {
        name: 'apify/actor-node-chrome',
        displayName: 'Node.js 7 + Chrome on Debian',
        prePull: true,
    },
    {
        name: 'apify/actor-node-basic:beta',
        displayName: 'BETA: Node.js 8 on Alpine Linux',
    },
    {
        name: 'apify/actor-node-puppeteer:beta',
        displayName: 'BETA: Node.js 8 + Puppeteer on Debian',
        copyChown: 'node:node',
    },
    {
        name: 'apify/actor-node-chrome:beta',
        displayName: 'BETA: Node.js 7 + Chrome on Debian',
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
    INTERVAL_MILLIS: 5 * 60 * 1000,
};

/**
 * 1 compute unit = 1GB * 1Hour.
 */
export const COMPUTE_UNIT_MB = 1024;
export const COMPUTE_UNIT_MILLIS = 60 * 60 * 1000;
