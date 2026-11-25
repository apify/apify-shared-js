export const REDACTED_PLACEHOLDER = '***';

// Every pattern has bounded quantifiers only, so the work stays linear in the string length.
const SENSITIVE_NAMES =
    'passw(?:or)?d|pwd|passphrase|secret|token|authorization|bearer|cookie|credential|signature' +
    '|connection[-_]?string|(?:api|private|encryption)[-_]?key';
const SENSITIVE_KEY_REGEX = new RegExp(`${SENSITIVE_NAMES}|^auth$`, 'i');
const JWT_REGEX = /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]*/g;
const APIFY_TOKEN_REGEX = /\b((?:apify_(?:[a-z]{1,16}_){1,4}|integration_api_token_))[A-Za-z0-9]{20,}/g;
// The credential must hold an uppercase letter or a digit, so that prose like "Basic authentication" is kept.
const AUTH_SCHEME_REGEX = /\b([Bb]earer|BEARER|[Bb]asic|BASIC)\s+(?=[\w.~+/=-]{0,512}[A-Z0-9])[\w.~+/=-]{8,}/g;
// Starts at the literal `://`: with a scheme in front, the engine would retry at every word of the text.
const URL_PASSWORD_REGEX = /(:\/\/[^\s/:@]{0,256}):[^\s/@]{1,256}@/g;
const QUERY_PARAMETER_REGEX = new RegExp(
    `((?:[?&;]|%3F|%26)(?:(?=[\\w.[\\]-]{0,64}?(?:${SENSITIVE_NAMES}))[\\w.[\\]-]{1,64}|auth)=)[^&\\s"'<>#]+`,
    'gi',
);

/** Tells whether a field of this name holds a secret, e.g. `password`, `apiToken` or `x-api-key`. */
export const isSensitiveKey = (key: PropertyKey) => typeof key === 'string' && SENSITIVE_KEY_REGEX.test(key);

/** Masks secrets with a known format: Apify tokens, JWTs, `Bearer`/`Basic` credentials, URL passwords, query parameters. */
export const redactString = (text: string) =>
    text
        .replace(JWT_REGEX, REDACTED_PLACEHOLDER)
        .replace(APIFY_TOKEN_REGEX, `$1${REDACTED_PLACEHOLDER}`)
        .replace(AUTH_SCHEME_REGEX, `$1 ${REDACTED_PLACEHOLDER}`)
        .replace(URL_PASSWORD_REGEX, `$1:${REDACTED_PLACEHOLDER}@`)
        .replace(QUERY_PARAMETER_REGEX, `$1${REDACTED_PLACEHOLDER}`);

/** Drops `config` and `request` of an Axios error, which hold the request headers, credentials and body. */
export const omitAxiosRequest = ({ config, request: _request, response, ...rest }: Record<PropertyKey, any>) => ({
    ...rest,
    method: config?.method,
    url: config?.url?.split?.(/[?#]/)?.[0],
    baseURL: config?.baseURL,
    response: response && {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
    },
});
