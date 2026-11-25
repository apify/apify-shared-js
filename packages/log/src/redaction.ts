export const REDACTED_PLACEHOLDER = '***';

// Every pattern has bounded quantifiers only, so the work stays linear in the string length.
const SENSITIVE_NAMES =
    'passw(?:or)?d|pwd|passphrase|secret|token|authorization|bearer|cookie|credential|signature' +
    '|connection[-_]?string|(?:api|private|encryption)[-_]?key';
const SENSITIVE_KEY_REGEX = new RegExp(`${SENSITIVE_NAMES}|^auth$`, 'i');
// Names that describe a secret instead of holding one, e.g. `tokenUrl`, `token_type`, `secretName`, `nextPageToken`.
const DESCRIPTIVE_KEY_REGEX =
    /[-_](?:ids?|name|type|ur[li]|endpoint|version|count|length|limit|expir\w*|consent)$|(?:page|pagination|continuation|cancellation|next)[-_]?token$/i;
const JWT_REGEX = /\beyJ[\w-]{8,}\.eyJ[\w-]{8,}\.[\w-]*/g;
const APIFY_TOKEN_REGEX = /\b((?:apify_(?:[a-z]{1,16}_){1,4}|integration_api_token_))[A-Za-z0-9]{20,}/g;
// The credential must hold an uppercase letter or a digit, so that prose like "Basic authentication" is kept.
const AUTH_SCHEME_REGEX = /\b([Bb]earer|BEARER|[Bb]asic|BASIC)\s+(?=[\w.~+/=-]{0,512}[A-Z0-9])[\w.~+/=-]{8,}/g;
// Starts at the literal `://`: with a scheme in front, the engine would retry at every word of the text.
const URL_PASSWORD_REGEX = /(:\/\/[^\s/:@]{0,256}):[^\s/@]{1,256}@/g;
const QUERY_PARAMETER_REGEX = new RegExp(
    `((?:[?&;]|%3F|%26)((?=[\\w.[\\]-]{0,64}?(?:${SENSITIVE_NAMES}))[\\w.[\\]-]{1,64}|auth)=)[^&\\s"'<>#]+`,
    'gi',
);

/** Tells whether a field of this name holds a secret, e.g. `password`, `apiToken` or `x-api-key`, but not `tokenUrl`. */
export const isSensitiveKey = (key: PropertyKey) =>
    typeof key === 'string' &&
    SENSITIVE_KEY_REGEX.test(key) &&
    // The camelCase suffix is split off first, so that `passwordValid` is not read as `..._id`
    !DESCRIPTIVE_KEY_REGEX.test(key.replace(/([a-z0-9])([A-Z])/g, '$1_$2'));

/** Masks secrets with a known format: Apify tokens, JWTs, `Bearer`/`Basic` credentials, URL passwords, query parameters. */
export const redactString = (text: string) =>
    text
        .replace(JWT_REGEX, REDACTED_PLACEHOLDER)
        .replace(APIFY_TOKEN_REGEX, `$1${REDACTED_PLACEHOLDER}`)
        .replace(AUTH_SCHEME_REGEX, `$1 ${REDACTED_PLACEHOLDER}`)
        .replace(URL_PASSWORD_REGEX, `$1:${REDACTED_PLACEHOLDER}@`)
        .replace(QUERY_PARAMETER_REGEX, (match, prefix: string, name: string) =>
            isSensitiveKey(name) ? `${prefix}${REDACTED_PLACEHOLDER}` : match,
        );

const mask = (value: unknown) => (value == null ? value : REDACTED_PLACEHOLDER);

/** Masks the parts of an Axios error that hold the request headers, credentials and body, so that they stay visible as removed. */
export const maskAxiosRequest = ({ config, request, response, ...rest }: Record<PropertyKey, any>) => ({
    ...rest,
    config: config && {
        ...config,
        url: config.url?.replace?.(/[?#].*$/s, `?${REDACTED_PLACEHOLDER}`),
        headers: mask(config.headers),
        params: mask(config.params),
        data: mask(config.data),
    },
    request: mask(request),
    response: response && { ...response, config: mask(response.config), request: mask(response.request) },
});
