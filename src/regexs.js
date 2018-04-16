/**
 * email validation regexp adapted from https://html.spec.whatwg.org/multipage/forms.html#valid-e-mail-address,
 * with our restriction that hostname must be a TLD!
 * original:  /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Comes from https://github.com/jonschlinkert/is-git-url/ but we have:
 * - added support for ...:/dir/subdir syntax
 */
export const GIT_REPO_REGEX = /^(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\/?|\#[-\d\w._:\/]+?)$/;

/**
 * Matches a string that might be used in a hostname (e.g. "my-host-name")
 */
export const DNS_SAFE_NAME_REGEX = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])$/;

/**
 * Apify proxy group name and SESSION ID is used in urls and cannot contain `-` because this character is used as separator
 * in proxy username.
 */
export const PROXY_GROUP_NAME_REGEX = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9])$/;
export const PROXY_SESSION_ID_REGEX = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9])$/;

/**
 * AWS S3 docs say:
 * "The following character sets are generally safe for use in key names:
 * - Alphanumeric characters [0-9a-zA-Z]
 * - Special characters !, -, _, ., *, ', (, and )"
 * Additionally we allow \ and / and limit the length to 256 characters (TODO: document this)
 */
export const KEY_VALUE_STORE_KEY_REGEX = /^([a-zA-Z0-9!\-_.*'()\\\/]{1,256})$/;

// taken from https://github.com/shinnn/github-username-regex
const GITHUB_REGEX_STR = '[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}';

export const TWITTER_REGEX = /^@[a-z0-9_]{1,15}$/i;
export const GITHUB_REGEX = new RegExp(`^${GITHUB_REGEX_STR}$`, 'i');
export const URL_REGEX = /^(http:\/\/|https:\/\/)/i; // TODO: use better one (include ports and loging http://user:pass@domain.com:33/something)

// E.g. https://gist.github.com/jancurn/2dbe83fea77c439b1119fb3f118513e7
export const GITHUB_GIST_URL_REGEX = new RegExp(`^https:\\/\\/gist\\.github\\.com\\/${GITHUB_REGEX_STR}\\/[0-9a-f]{32}$`, 'i');
