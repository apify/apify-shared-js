import { IS_APIFY_LOGGER_EXCEPTION } from './log_consts.js';

/** The same mask that Apify services already write for secrets they hide themselves. */
export const REDACTED_PLACEHOLDER = '***';

/**
 * How far past the truncation limit a string is read before redaction,
 * so that a secret cut by the truncation is still recognized.
 */
export const REDACTION_LOOKAHEAD_LENGTH = 256;

// All patterns below use bounded quantifiers only, so the work stays linear in the string length.

const SENSITIVE_NAMES =
    'passw(?:or)?d|pwd|passphrase|secret|token|authorization|bearer|cookie|credential|signature' +
    '|connection[-_]?string|(?:api|private|encryption)[-_]?key';
const SENSITIVE_KEY_REGEX = new RegExp(`${SENSITIVE_NAMES}|^auth$`, 'i');
// Names that describe a secret or only look like one, e.g. `tokenId`, `token_url`, `secretName`, `nextPageToken`.
// The camelCase suffix needs its capital letter, so that `passwordValid` is not read as `...Id`.
const NON_SECRET_KEY_REGEXES = [
    /[a-z0-9](?:Ids?|Name|Type|Ur[li]|Version|Count|Length)$/,
    /[-_](?:ids?|name|type|ur[li]|version|count|length)$/i,
    /(?:page|pagination|continuation|cancellation|next)[-_]?token$/i,
];
// A value that some other code has masked already, e.g. `***` or `[HIDDEN]`
const MASKED_VALUE_REGEX = /^(?:\*{3,}|\[[A-Z_]{2,16}\])$/;

const JWT_REGEX = /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]*/g;
// The prefix has one or more parts, e.g. `apify_api_` or `apify_some_kind_`
const APIFY_TOKEN_REGEX = /\b((?:apify_(?:[a-z]{1,16}_){1,4}|integration_api_token_))[A-Za-z0-9]{20,}/g;
// The credential must hold an uppercase letter or a digit, so that prose like "Basic authentication" is kept.
const AUTH_SCHEME_REGEX = /\b([Bb]earer|BEARER|[Bb]asic|BASIC)\s+(?=[\w.~+/=-]{0,512}[A-Z0-9])[\w.~+/=-]{8,}/g;
// Starts at the literal `://`: with a scheme in front, the engine would retry at every word of the text
const URL_PASSWORD_REGEX = /(:\/\/[^\s/:@]{0,256}):[^\s/@]{1,256}@/g;
// The lookahead lets only parameters with a sensitive name reach the replacer
const QUERY_PARAMETER_REGEX = new RegExp(
    `([?&;]|%3F|%26)((?=[\\w.[\\]-]{0,64}?(?:${SENSITIVE_NAMES}))[\\w.[\\]-]{1,64}|auth)=([^&\\s"'<>#]+)`,
    'gi',
);
// A short string without any of these cannot match a pattern above
const MAX_PRECHECKED_LENGTH = 128;
const PRECHECK_REGEX = /[=_]|:\/\/|eyJ|(?:earer|EARER|asic|ASIC)\s/;

/**
 * Tells whether a field of this name holds a secret, e.g. `password`, `apiToken`, `Authorization` or `x-api-key`.
 * Names that only describe a secret, such as `tokenId` or `tokenUrl`, are not sensitive.
 */
export const isSensitiveKey = (key: PropertyKey): boolean =>
    typeof key === 'string' &&
    SENSITIVE_KEY_REGEX.test(key) &&
    !NON_SECRET_KEY_REGEXES.some((regex) => regex.test(key));

/** Tells whether the value was masked before it reached the logger, so that the mask is kept as it is. */
export const isMaskedValue = (value: string): boolean => MASKED_VALUE_REGEX.test(value);

/**
 * Replaces the secrets that can be recognized by their format: Apify tokens, JWTs, `Bearer` and `Basic` credentials,
 * passwords in URLs and query parameters with a sensitive name.
 */
export const redactString = (text: string): string => {
    if (text.length <= MAX_PRECHECKED_LENGTH && !PRECHECK_REGEX.test(text)) return text;

    const withoutTokens = text
        .replace(JWT_REGEX, REDACTED_PLACEHOLDER)
        .replace(APIFY_TOKEN_REGEX, `$1${REDACTED_PLACEHOLDER}`)
        .replace(AUTH_SCHEME_REGEX, `$1 ${REDACTED_PLACEHOLDER}`);
    const withoutUrlPasswords =
        withoutTokens.includes('://') && withoutTokens.includes('@')
            ? withoutTokens.replace(URL_PASSWORD_REGEX, `$1:${REDACTED_PLACEHOLDER}@`)
            : withoutTokens;
    if (!withoutUrlPasswords.includes('=')) return withoutUrlPasswords;

    return withoutUrlPasswords.replace(
        QUERY_PARAMETER_REGEX,
        (match, separator: string, name: string, value: string) =>
            isSensitiveKey(name) && !isMaskedValue(value) ? `${separator}${name}=${REDACTED_PLACEHOLDER}` : match,
    );
};

type AxiosErrorLike = Error & {
    isAxiosError: true;
    config?: { method?: unknown; url?: unknown; baseURL?: unknown };
    request?: unknown;
    response?: { status?: unknown; statusText?: unknown; headers?: unknown; data?: unknown };
};

/** Only errors are checked: reading a property of an arbitrary logged object (e.g. a strict Proxy) could throw. */
export const isAxiosErrorLike = (data: unknown): data is AxiosErrorLike =>
    data instanceof Error && (data as AxiosErrorLike).isAxiosError === true;

const stripUrlQuery = (url: unknown) => (typeof url === 'string' ? url.replace(/[?#][\s\S]*$/, '') : undefined);

/**
 * Turns an Axios error into an object without `config` and `request`, which hold the request headers,
 * credentials and body. The response and the custom properties are kept.
 */
export const getLoggableAxiosError = (error: AxiosErrorLike) => {
    const {
        name,
        message,
        stack,
        cause,
        config,
        request: _request,
        response,
        isAxiosError: _isAxiosError,
        ...rest
    } = error;

    return {
        name,
        message,
        stack,
        cause,
        ...rest,
        method: config?.method,
        url: stripUrlQuery(config?.url),
        baseURL: stripUrlQuery(config?.baseURL),
        response: response && {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        },
        [IS_APIFY_LOGGER_EXCEPTION]: true,
    };
};
