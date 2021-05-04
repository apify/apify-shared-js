import _ from 'underscore';
import * as http from 'http';
import * as utils from '@apify/utilities';

describe('utilities', () => {
    describe('#cryptoRandomObjectId()', () => {
        it('should return 17 alphanumeric chars', () => {
            expect(/^[a-zA-Z0-9]{17}$/.test(utils.cryptoRandomObjectId())).toBe(true);
        });

        it('supports custom length', () => {
            expect(/^[a-zA-Z0-9]{32}$/.test(utils.cryptoRandomObjectId(32))).toBe(true);
        });
    });

    describe('#deterministicUniqueId()', () => {
        it('should work with default length', () => {
            expect(utils.deterministicUniqueId('some-key').length).toBe(17);
            expect(utils.deterministicUniqueId('some-key')).toBe(utils.deterministicUniqueId('some-key'));
            expect(utils.deterministicUniqueId('some-key')).toBe('aC9mlxqT7KbIAaIyU');
        });

        it('should work with custom length', () => {
            expect(utils.deterministicUniqueId('some-key', 5).length).toBe(5);
            expect(utils.deterministicUniqueId('some-key', 5)).toBe(utils.deterministicUniqueId('some-key', 5));
            expect(utils.deterministicUniqueId('some-key', 5)).toBe('aC9ml');
        });
    });

    describe('#getRandomInt()', () => {
        it('returns 0 for max 0', () => {
            expect(utils.getRandomInt(0)).toBe(0);
            expect(utils.getRandomInt(0)).toBe(0);
            expect(utils.getRandomInt(0)).toBe(0);
        });

        it('returns value between [0,max)', () => {
            for (let i = 0; i < 100; i++) {
                let val = utils.getRandomInt(1);
                expect(val >= 0 && val < 1).toBe(true);
                val = utils.getRandomInt(10);
                expect(val >= 0 && val < 10).toBe(true);
                val = utils.getRandomInt(100);
                expect(val >= 0 && val < 100).toBe(true);
            }
        });
    });

    describe('weightedAverage()', () => {
        it('works', () => {
            expect(Math.round(utils.weightedAverage(13, 3, 26, 4) * 100)).toBe(Math.round(2042.857));
        });
    });

    describe('utils.isForbiddenUsername()', () => {
        it('works as expected', () => {
            expect(utils.isForbiddenUsername('anonymous')).toBe(true);
            expect(utils.isForbiddenUsername('admin')).toBe(true);
            expect(utils.isForbiddenUsername('craWLers')).toBe(true);
            expect(utils.isForbiddenUsername('for-developers')).toBe(true);
            expect(utils.isForbiddenUsername('yourdomain')).toBe(true);

            // Special files
            expect(utils.isForbiddenUsername('favicon.ICO')).toBe(true);
            expect(utils.isForbiddenUsername('FAVICON.ico')).toBe(true);
            expect(utils.isForbiddenUsername('apple-touch-icon.png')).toBe(true);
            expect(utils.isForbiddenUsername('apple-touch-icon-180x180.png')).toBe(true);
            expect(utils.isForbiddenUsername('index.html')).toBe(true);
            expect(utils.isForbiddenUsername('robots.txt')).toBe(true);
            expect(utils.isForbiddenUsername('index')).toBe(true);
            expect(utils.isForbiddenUsername('google6d0b9d7407741f6a.html')).toBe(true);
            expect(utils.isForbiddenUsername('BingSiteAuth.XML')).toBe(true);

            // All hidden files
            expect(utils.isForbiddenUsername('.hidden')).toBe(true);
            expect(utils.isForbiddenUsername('.a')).toBe(true);
            expect(utils.isForbiddenUsername('.')).toBe(true);
            expect(utils.isForbiddenUsername('..')).toBe(true);
            expect(utils.isForbiddenUsername('...')).toBe(true);
            expect(utils.isForbiddenUsername('.htaccess')).toBe(true);

            // Strings not starting with letter or number
            expect(utils.isForbiddenUsername('_karlyolo')).toBe(true);
            expect(utils.isForbiddenUsername('.karlyolo')).toBe(true);
            expect(utils.isForbiddenUsername('-karlyolo')).toBe(true);
            expect(utils.isForbiddenUsername('___')).toBe(true);
            expect(utils.isForbiddenUsername('---')).toBe(true);
            expect(utils.isForbiddenUsername('...')).toBe(true);

            // Strings not ending with letter or number
            expect(utils.isForbiddenUsername('karlyolo_')).toBe(true);
            expect(utils.isForbiddenUsername('karlyolo.')).toBe(true);
            expect(utils.isForbiddenUsername('karlyolo-')).toBe(true);

            // Strings where there's more than one underscore, comma or dash in row
            expect(utils.isForbiddenUsername('karl..yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl.-yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl.-.yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl--yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl---yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl__yolo')).toBe(true);
            expect(utils.isForbiddenUsername('karl__.yolo')).toBe(true);

            // Test valid usernames
            expect(!utils.isForbiddenUsername('apify')).toBe(true);
            expect(!utils.isForbiddenUsername('APIFY')).toBe(true);
            expect(!utils.isForbiddenUsername('jannovak')).toBe(true);
            expect(!utils.isForbiddenUsername('jan.novak')).toBe(true);
            expect(!utils.isForbiddenUsername('jan.novak.YOLO')).toBe(true);
            expect(!utils.isForbiddenUsername('jan.novak-YOLO')).toBe(true);
            expect(!utils.isForbiddenUsername('jan_novak-YOLO')).toBe(true);
            expect(!utils.isForbiddenUsername('jan-novak')).toBe(true);
            expect(!utils.isForbiddenUsername('jan_novak')).toBe(true);
            expect(!utils.isForbiddenUsername('a.b_c-d.0-1_2.3')).toBe(true);
            expect(!utils.isForbiddenUsername('0123456789')).toBe(true);
            expect(!utils.isForbiddenUsername('01234.56789')).toBe(true);
            expect(!utils.isForbiddenUsername('1aaaaa5')).toBe(true);
        });
    });

    it('sequentializePromises()', () => {
        const range = _.range(21, 33);
        const promises = range.map((index) => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(index), Math.round(Math.random() * 100));
            });
        });

        return utils
            .sequentializePromises(promises)
            .then((data) => expect(data).toEqual(range));
    });

    it('delayPromise()', () => {
        let timeBefore: number;
        return Promise.resolve()
            .then(() => utils.delayPromise(0))
            .then(() => utils.delayPromise(null as any))
            .then(() => utils.delayPromise(-1))
            .then(() => {
                timeBefore = Date.now();
                return utils.delayPromise(100);
            })
            .then(() => {
                const timeAfter = Date.now();
                expect(timeAfter - timeBefore).toBeGreaterThan(95);
            });
    });

    it('checkParamPrototypeOrThrow()', () => {
        // One prototype
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', Date, 'Date')).not.toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(null, 'param', Function, 'Date', true)).not.toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(undefined, 'param', Function, 'Date', true)).not.toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', Function, 'Date')).toThrow();

        // Multiple prototypes
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Date, Function], 'Date')).not.toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Function, Date], 'Date')).not.toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Function, String], 'Date')).toThrow();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [], 'Date')).toThrow();
    });

    it('promisifyServerListen()', (done) => {
        const server1 = http.createServer();
        const server2 = http.createServer();

        utils
            .promisifyServerListen(server1)(8799)
            .then(() => {
                expect(server1.listening).toBe(true);
                expect(server2.listening).toBe(false);

                return utils.promisifyServerListen(server2)(8799);
            })
            .then(() => {
                throw new Error('Second server should not be able to start listening at the same port!');
            }, (err) => {
                expect(err.code).toBe('EADDRINUSE');
            })
            .then(() => {
                server1.close((err) => {
                    expect(server1.listening).toBe(false);
                    expect(server2.listening).toBe(false);
                    done(err);
                });
            });
    });
});

describe('timeoutPromise()', () => {
    it('should work when promise resolves in time', async () => {
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve('xxx'), 100);
        });
        const timeoutPromise = utils.timeoutPromise(promise, 200);
        expect(await timeoutPromise).toBe('xxx');
    });

    it('should work when promise rejects in time', async () => {
        const error = new Error('some-fail');
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => reject(error), 100);
        });
        const timeoutPromise = utils.timeoutPromise(promise, 200);

        try {
            await timeoutPromise;
            throw new Error('This should have failed!');
        } catch (err) {
            expect(err.message).toBe('some-fail');
        }
    });

    it('should work when promise timeouts in time', async () => {
        const error = new Error('some-fail');
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => reject(error), 200);
        });
        const timeoutPromise = utils.timeoutPromise(promise, 100);

        try {
            await timeoutPromise;
            throw new Error('This should have failed!');
        } catch (err) {
            expect(err.message).toBe('Promise has timed-out');
        }
    });

    it('should support custom error message', async () => {
        const error = new Error('some-fail');
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => reject(error), 200);
        });
        const timeoutPromise = utils.timeoutPromise(promise, 100, 'Custom error message');

        try {
            await timeoutPromise;
            throw new Error('This should have failed!');
        } catch (err) {
            expect(err.message).toBe('Custom error message');
        }
    });

    describe('#makeInputJsFieldsReadable()', () => {
        it('should correctly handle normal functions, arrow functions and JS code', () => {
            /* eslint-disable */
            const json = `{
                "cookiesPersistence": "PER_PROCESS",
                "disableWebSecurity": true,
                "arrowFunction": "async (a, b) => a + b; ",
                "loadCss": false,
                "normalFunction": "function pageFunction(context) {\\n    // called on every page the crawler visits, use it to extract data from it\\n    const $ = context.jQuery;\\n    return 'xxxx';\\n}",
                "proxyConfiguration": {
                    "useApifyProxy": false
                },
                "rotateUserAgents": false,
                "someCode": "const a = 5;\\nfunction sum (a, b) {\\n    return a + b;\\n}\\nsum(a, 10);"
            }`;
            /* eslint-enable */

            const given = utils.makeInputJsFieldsReadable(json, ['normalFunction', 'arrowFunction', 'someCode'], 4);
            const expected = `{
    "cookiesPersistence": "PER_PROCESS",
    "disableWebSecurity": true,
    "arrowFunction": async (a, b) => a + b,
    "loadCss": false,
    "normalFunction": function pageFunction(context) {
        // called on every page the crawler visits, use it to extract data from it
        const $ = context.jQuery;
        return 'xxxx';
    },
    "proxyConfiguration": {
        "useApifyProxy": false
    },
    "rotateUserAgents": false,
    "someCode": \`const a = 5;
        function sum (a, b) {
            return a + b;
        }
        sum(a, 10);\`
}`;

            expect(given).toBe(expected);
        });

        it('should not fail on invalid JS code', () => {
            /* eslint-disable */
            const json = `{
                "cookiesPersistence": "PER_PROCESS",
                "arrowFunction": "async (a, b) => a + b; ",
                "loadCss": false,
                "normalFunction": "function INVALID!!! pageFunction(context) {\\n    // called on every page the crawler visits, use it to extract data from it\\n    const $ = context.jQuery;\\n    return 'xxxx';\\n}"
            }`;
            /* eslint-enable */

            const given = utils.makeInputJsFieldsReadable(json, ['normalFunction', 'arrowFunction', 'someCode'], 4);
            /* eslint-disable */
            const expected = `{
    "cookiesPersistence": "PER_PROCESS",
    "arrowFunction": async (a, b) => a + b,
    "loadCss": false,
    "normalFunction": "function INVALID!!! pageFunction(context) {\\n    // called on every page the crawler visits, use it to extract data from it\\n    const $ = context.jQuery;\\n    return 'xxxx';\\n}"
}`;
            /* eslint-enable */

            expect(given).toBe(expected);
        });

        it('should support global spaces', () => {
            const json = `{
                "cookiesPersistence": "PER_PROCESS",
                "arrowFunction": "async (a, b) => a + b; ",
                "loadCss": false
            }`;

            const given = utils.makeInputJsFieldsReadable(json, ['normalFunction', 'arrowFunction', 'someCode'], 4, 4);
            const expected = `{
        "cookiesPersistence": "PER_PROCESS",
        "arrowFunction": async (a, b) => a + b,
        "loadCss": false
    }`;

            expect(given).toBe(expected);
        });
    });
});
