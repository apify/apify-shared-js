import { stripVTControlCharacters as stripAnsi } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Log, LoggerJson, LoggerText, type LoggerOptions, sanitizeData } from '@apify/log';

const APIFY_TOKEN = `apify_api_${'a1B2'.repeat(9)}`;
const BEARER = 'SECRETbearer0123456789abcdef';
const PASSWORD = 'hunter2-not-a-real-password';
const QUERY_SECRET = 'SECRETinQUERY123';
const JWT = `eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.${'s'.repeat(43)}`;
const SECRETS = [APIFY_TOKEN, BEARER, PASSWORD, QUERY_SECRET, JWT];

const redact = (data: unknown) => sanitizeData(data, { redactSecrets: true });

describe('log secret redaction', () => {
    let lines: string[];

    beforeEach(() => {
        lines = [];
        (['log', 'warn', 'error', 'debug'] as const).forEach((method) => {
            vi.spyOn(console, method).mockImplementation((line: string) => lines.push(stripAnsi(line)));
        });
    });

    afterEach(() => vi.restoreAllMocks());

    const jsonLog = (options: Partial<LoggerOptions> = {}) =>
        new Log({ logger: new LoggerJson({ skipTime: true }), ...options });
    const expectNoSecrets = () =>
        lines.forEach((line) => SECRETS.forEach((secret) => expect(line).not.toContain(secret)));

    it('masks a string under a field with a sensitive name and nothing below it', () => {
        const data = {
            password: 'abc',
            proxyPassword: 'correct horse battery',
            query: { accessToken: PASSWORD, limit: '10' },
            headers: {
                Authorization: `Bearer ${BEARER}`,
                cookie: `sid=${PASSWORD}; theme=dark`,
                'X-Api-Key': PASSWORD,
                'set-cookie': [`sid=${PASSWORD}; Path=/; HttpOnly`, 'a=1'],
            },
            cookies: [{ name: 'sid', value: 'abcdefgh' }],
            token: { issuedAt: 1795529568, source: 'console' },
        };

        expect(redact(data)).toEqual({
            password: '[redacted]',
            proxyPassword: '[redacted]',
            query: { accessToken: '[redacted]', limit: '10' },
            headers: {
                Authorization: '[redacted]',
                cookie: '[redacted]',
                'X-Api-Key': '[redacted]',
                'set-cookie': ['[redacted]', 'a=1'],
            },
            cookies: [{ name: 'sid', value: 'abcdefgh' }],
            token: { issuedAt: 1795529568, source: 'console' },
        });
    });

    it('keeps flags, sentences, short, empty and non-string values under a sensitive name', () => {
        const data = {
            maxToken: 4096,
            hasPassword: true,
            includeToken: 'true',
            useCookies: '0',
            token: '',
            secret: null,
            hasToken: 'yes',
            apiKey: 'not-set',
            stopToken: '</s>',
            cookies: 'accept',
            errors: { token: 'Token has expired' },
        };

        expect(redact(data)).toEqual(data);
    });

    it.each([
        ...['password', 'proxyPassword', 'passwd', 'client_secret', 'refreshToken', 'id_token'],
        ...['api-key', 'API_KEY', 'apikey', 'privateKey', 'secretKey', 'Proxy-Authorization', 'cookie', 'set-cookie'],
        ...['JWTToken', 'unsubscribetoken', 'adminpassword', 'memberPassWord'],
    ])('treats the field %s as sensitive', (key) =>
        expect(redact({ [key]: PASSWORD })).toEqual({ [key]: '[redacted]' }),
    );

    it.each([
        ...['key', 'author', 'auth', 'userId', 'url', 'message', Symbol('token')],
        ...['tokenUrl', 'TOKEN_URL', 'token_type', 'tokenIds', 'secretName', 'apiKeyId', 'tokenHash', 'tokenSource'],
        ...['tokenCount', 'tokenExpiresAt', 'cookieConsent', 'cookieBanner', 'passwordPolicy', 'passwordValid'],
        ...['nextPageToken', 'continuation_token', 'tokenizer', 'secretary', 'passwordless', 'maxTokens'],
        ...['token_endpoint_auth_method', 'tokenToReset', 'signature', 'credentials', 'PWD'],
        ...['syncToken', 'skiptoken', 'deltaToken', 'resumeToken', 'cursor_token', '__paging_token'],
    ])('does not treat the field %s as sensitive', (key) =>
        expect(redact({ [key]: PASSWORD })).toEqual({ [key]: PASSWORD }),
    );

    it.each([
        [`token ${APIFY_TOKEN} is invalid`, 'token apify_api_[redacted] is invalid'],
        [`["items","apify_some_kind_${'a1B2'.repeat(9)}"]`, '["items","apify_some_kind_[redacted]"]'],
        [`integration_api_token_${'a1B2'.repeat(9)}`, 'integration_api_token_[redacted]'],
        [`Authorization: Bearer ${BEARER}`, 'Authorization: Bearer [redacted]'],
        ['authorization: basic dXNlcjpwYXNzMTIz', 'authorization: basic [redacted]'],
        ['AUTHORIZATION: BEARER abcDEF0123456789', 'AUTHORIZATION: BEARER [redacted]'],
        [`{"Authorization":"Bearer ${BEARER}"}`, '{"Authorization":"Bearer [redacted]"}'],
        [
            `https://app.example.com/cb#access_token=${QUERY_SECRET}&state=1`,
            'https://app.example.com/cb#access_token=[redacted]&state=1',
        ],
        [`id_token ${JWT} has wrong audience`, 'id_token [redacted] has wrong audience'],
        [
            `http://groups-RESIDENTIAL:${PASSWORD}@proxy.apify.com:8000`,
            'http://groups-RESIDENTIAL:[redacted]@proxy.apify.com:8000',
        ],
        [`/v2/logs/abc?token=${QUERY_SECRET}&download=true#top`, '/v2/logs/abc?token=[redacted]&download=true#top'],
        [`/v2/datasets/abc/items%3Ftoken=${QUERY_SECRET}/`, '/v2/datasets/abc/items%3Ftoken=[redacted]'],
        [
            `see [the log](https://example.com/log?token=${QUERY_SECRET}) for details`,
            'see [the log](https://example.com/log?token=[redacted]) for details',
        ],
        [
            `/items?tokenCount=5&nextPageToken=abc&secret=${QUERY_SECRET}`,
            '/items?tokenCount=5&nextPageToken=abc&secret=[redacted]',
        ],
        [
            `/confirm?a=1&confirmToken=${QUERY_SECRET}&amp;apiKey=${QUERY_SECRET}`,
            '/confirm?a=1&confirmToken=[redacted]&amp;apiKey=[redacted]',
        ],
    ])('masks the secret in %s', (text, expected) => expect(redact(text)).toBe(expected));

    it.each([
        'Actor run finished',
        'Basic authentication is required, see the Bearer token docs',
        'Basic Authentication is required',
        'Authorization: Basic or Bearer scheme is required',
        '/docs/tokens#section-2',
        '/items?filter[token]=abcdefgh12',
        'Authorization: Bearer undefined',
        '/v2/acts?token=none&syncToken=CAESBggBEAEYAQ',
        '{"url":"https://example.com","email":"joe@example.com"}',
        '{"homepage":"https://apify.com","dependencies":{"@apify/log":"^3.0.0"}}',
        'Request to http://localhost:3000?email=joe@example.com failed',
        '/v2/acts?includeToken=true&signature=abc&tokenType=bearer',
        'Use the format http[s]://[username[:password]@]host[:port]',
        'GET https://api.apify.com/v2/acts/apify~web-scraper/runs?limit=10&offset=20&status=SUCCEEDED',
        'https://example.com:8080/path@1.2.3/file.js',
        'apify_proxy_groups and apify_api_client_version',
    ])('keeps %s', (text) => expect(redact(text)).toBe(text));

    it('masks the message, the exception and the default data', () => {
        const log = jsonLog({ data: { proxyUrl: `http://auto:${PASSWORD}@proxy.apify.com:8000` } });
        log.exception(
            new Error(`Token ${APIFY_TOKEN} was rejected`),
            `Request to /v2/acts?token=${QUERY_SECRET} failed`,
        );
        new Log({ logger: new LoggerText() }).info(`Token ${APIFY_TOKEN} was rejected`, { password: PASSWORD });

        expectNoSecrets();
        expect(JSON.parse(lines[0])).toMatchObject({
            msg: 'Request to /v2/acts?token=[redacted] failed',
            exception: { message: 'Token apify_api_[redacted] was rejected' },
        });
    });

    it('masks a secret that is cut by the truncation', () => {
        const text = `${'x'.repeat(95)} ${APIFY_TOKEN}`;

        // The limit falls inside the token: without reading past it, the first 24 characters would stay
        expect(sanitizeData(text, { maxStringLength: 120, redactSecrets: true })).toBe(
            `${'x'.repeat(95)} apify_api_[redacted]`,
        );
        expect(sanitizeData(text, { maxStringLength: 100, redactSecrets: true })).toBe(
            `${'x'.repeat(86)}...[truncated]`,
        );
    });

    it('masks a JWT that is longer than what is read past the limit', () => {
        const text = `${'x'.repeat(90)} eyJhbGciOiJIUzI1NiJ9.eyJ${'p'.repeat(600)}.${'s'.repeat(43)}`;

        expect(sanitizeData(text, { maxStringLength: 120, redactSecrets: true })).toBe(
            `${'x'.repeat(90)} [redacted]...[truncated]`,
        );
    });

    it('masks only the items of an array that are within the limit', () => {
        const cookies = [`sid=${PASSWORD}`, `sid=${PASSWORD}`, `sid=${PASSWORD}`];

        expect(sanitizeData({ cookies }, { maxArrayLength: 2, redactSecrets: true })).toEqual({
            cookies: ['[redacted]', '[redacted]', '...[truncated]'],
        });
    });

    it('does not cut a string that fits the limit when the mask makes it longer', () => {
        expect(sanitizeData('http://u:p@host', { maxStringLength: 15, redactSecrets: true })).toBe(
            'http://u:[redacted]@host',
        );
    });

    it('marks the truncation when the redaction makes the rest fit the limit', () => {
        const text = `failed ${JWT}${'s'.repeat(300)} ${'detail '.repeat(40)}`;

        expect(sanitizeData(text, { maxStringLength: 100, redactSecrets: true })).toBe(
            'failed [redacted]...[truncated]',
        );
        expect(sanitizeData(text, { maxStringLength: 500, redactSecrets: true })).toBe(
            `failed [redacted] ${'detail '.repeat(40)}`,
        );
    });

    // The patterns need a few milliseconds here. One that backtracks needs seconds, so the timeout catches it
    it('finishes on long hostile strings', { timeout: 1000 }, () => {
        const hostile = [
            ...['apify_', 'authorization: ', 'a:', '&a=', '#a', 'a.', 'https://a.b/c ', '?token', '://a'].map((part) =>
                part.repeat(40_000),
            ),
            `eyJ${'a'.repeat(200_000)}`,
            'eyJaaaaaaaa-'.repeat(40_000),
        ];

        hostile.forEach((text) => expect(redact(text)).toBe(text));
    });

    it('is on by default, also in child loggers and when set to undefined', () => {
        const log = jsonLog();
        log.setOptions({ redactSecrets: undefined });
        log.info(APIFY_TOKEN, { password: PASSWORD });
        log.child({ prefix: 'Child' }).info(APIFY_TOKEN, { password: PASSWORD });

        expectNoSecrets();
    });

    it('can be turned off and is off in sanitizeData() unless asked for', () => {
        const log = jsonLog({ redactSecrets: false });
        log.info(APIFY_TOKEN, { password: PASSWORD });
        log.child({ prefix: 'Child' }).info(APIFY_TOKEN, { password: PASSWORD });

        lines.forEach((line) => expect(line).toContain(APIFY_TOKEN));
        lines.forEach((line) => expect(line).toContain(PASSWORD));
        expect(sanitizeData({ password: PASSWORD }, {})).toEqual({ password: PASSWORD });
    });

    it('leaves a line without a secret untouched', () => {
        const args = ['Actor run finished', { runId: 'abc', urls: ['https://example.com/?page=2'] }] as const;
        jsonLog().info(...args);
        jsonLog({ redactSecrets: false }).info(...args);

        expect(lines[0]).toBe(lines[1]);
    });
});
