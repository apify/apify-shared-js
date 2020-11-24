import { assert, expect } from 'chai';
import _ from 'underscore';
import * as http from 'http';
import utils from '../build/utilities';

describe('utilities', () => {
    describe('#cryptoRandomObjectId()', () => {
        it('should return 17 alphanumeric chars', () => {
            assert(/^[a-zA-Z0-9]{17}$/.test(utils.cryptoRandomObjectId()));
        });

        it('supports custom length', () => {
            assert(/^[a-zA-Z0-9]{32}$/.test(utils.cryptoRandomObjectId(32)));
        });
    });

    describe('#deterministicUniqueId()', () => {
        it('should work with default length', () => {
            expect(utils.deterministicUniqueId('some-key').length).to.be.eql(17);
            expect(utils.deterministicUniqueId('some-key')).to.be.eql(utils.deterministicUniqueId('some-key'));
            expect(utils.deterministicUniqueId('some-key')).to.be.eql('aC9mlxqT7KbIAaIyU');
        });

        it('should work with custom length', () => {
            expect(utils.deterministicUniqueId('some-key', 5).length).to.be.eql(5);
            expect(utils.deterministicUniqueId('some-key', 5)).to.be.eql(utils.deterministicUniqueId('some-key', 5));
            expect(utils.deterministicUniqueId('some-key', 5)).to.be.eql('aC9ml');
        });
    });

    describe('#getRandomInt()', () => {
        it('returns 0 for max 0', () => {
            assert(utils.getRandomInt(0) === 0);
            assert(utils.getRandomInt(0) === 0);
            assert(utils.getRandomInt(0) === 0);
        });

        it('returns value between [0,max)', () => {
            for (let i = 0; i < 100; i++) {
                let val = utils.getRandomInt(1);
                assert(val >= 0 && val < 1);
                val = utils.getRandomInt(10);
                assert(val >= 0 && val < 10);
                val = utils.getRandomInt(100);
                assert(val >= 0 && val < 100);
            }
        });
    });

    describe('weightedAverage()', () => {
        it('works', () => {
            assert.equal(Math.round(utils.weightedAverage(13, 3, 26, 4) * 100), Math.round(20.42857 * 100));
        });
    });

    describe('utils.isForbiddenUsername()', () => {
        it('works as expected', () => {
            assert(utils.isForbiddenUsername('anonymous'));
            assert(utils.isForbiddenUsername('admin'));
            assert(utils.isForbiddenUsername('craWLers'));
            assert(utils.isForbiddenUsername('for-developers'));
            assert(utils.isForbiddenUsername('yourdomain'));

            // Special files
            assert(utils.isForbiddenUsername('favicon.ICO'));
            assert(utils.isForbiddenUsername('FAVICON.ico'));
            assert(utils.isForbiddenUsername('apple-touch-icon.png'));
            assert(utils.isForbiddenUsername('apple-touch-icon-180x180.png'));
            assert(utils.isForbiddenUsername('index.html'));
            assert(utils.isForbiddenUsername('robots.txt'));
            assert(utils.isForbiddenUsername('index'));
            assert(utils.isForbiddenUsername('google6d0b9d7407741f6a.html'));
            assert(utils.isForbiddenUsername('BingSiteAuth.XML'));

            // All hidden files
            assert(utils.isForbiddenUsername('.hidden'));
            assert(utils.isForbiddenUsername('.a'));
            assert(utils.isForbiddenUsername('.'));
            assert(utils.isForbiddenUsername('..'));
            assert(utils.isForbiddenUsername('...'));
            assert(utils.isForbiddenUsername('.htaccess'));

            // Strings not starting with letter or number
            assert(utils.isForbiddenUsername('_karlyolo'));
            assert(utils.isForbiddenUsername('.karlyolo'));
            assert(utils.isForbiddenUsername('-karlyolo'));
            assert(utils.isForbiddenUsername('___'));
            assert(utils.isForbiddenUsername('---'));
            assert(utils.isForbiddenUsername('...'));

            // Strings not ending with letter or number
            assert(utils.isForbiddenUsername('karlyolo_'));
            assert(utils.isForbiddenUsername('karlyolo.'));
            assert(utils.isForbiddenUsername('karlyolo-'));

            // Strings where there's more than one underscore, comma or dash in row
            assert(utils.isForbiddenUsername('karl..yolo'));
            assert(utils.isForbiddenUsername('karl.-yolo'));
            assert(utils.isForbiddenUsername('karl.-.yolo'));
            assert(utils.isForbiddenUsername('karl--yolo'));
            assert(utils.isForbiddenUsername('karl---yolo'));
            assert(utils.isForbiddenUsername('karl__yolo'));
            assert(utils.isForbiddenUsername('karl__.yolo'));

            // Test valid usernames
            assert(!utils.isForbiddenUsername('apify'));
            assert(!utils.isForbiddenUsername('APIFY'));
            assert(!utils.isForbiddenUsername('jannovak'));
            assert(!utils.isForbiddenUsername('jan.novak'));
            assert(!utils.isForbiddenUsername('jan.novak.YOLO'));
            assert(!utils.isForbiddenUsername('jan.novak-YOLO'));
            assert(!utils.isForbiddenUsername('jan_novak-YOLO'));
            assert(!utils.isForbiddenUsername('jan-novak'));
            assert(!utils.isForbiddenUsername('jan_novak'));
            assert(!utils.isForbiddenUsername('a.b_c-d.0-1_2.3'));
            assert(!utils.isForbiddenUsername('0123456789'));
            assert(!utils.isForbiddenUsername('01234.56789'));
            assert(!utils.isForbiddenUsername('1aaaaa5'));
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
            .then(data => expect(data).to.be.eql(range));
    });

    it('delayPromise()', () => {
        let timeBefore;
        return Promise.resolve()
            .then(() => {
                return utils.delayPromise(0);
            })
            .then(() => {
                return utils.delayPromise(null);
            })
            .then(() => {
                return utils.delayPromise(-1);
            })
            .then(() => {
                timeBefore = Date.now();
                return utils.delayPromise(100);
            })
            .then(() => {
                const timeAfter = Date.now();
                expect(timeAfter - timeBefore).to.be.gte(95);
            });
    });

    it('checkParamPrototypeOrThrow()', () => {
        // One prototype
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', Date, 'Date')).to.not.throw();
        expect(() => utils.checkParamPrototypeOrThrow(null, 'param', Function, 'Date', true)).to.not.throw();
        expect(() => utils.checkParamPrototypeOrThrow(undefined, 'param', Function, 'Date', true)).to.not.throw();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', Function, 'Date')).to.throw();

        // Multiple prototypes
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Date, Function], 'Date')).to.not.throw();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Function, Date], 'Date')).to.not.throw();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [Function, String], 'Date')).to.throw();
        expect(() => utils.checkParamPrototypeOrThrow(new Date(), 'param', [], 'Date')).to.throw();
    });

    it('promisifyServerListen()', (done) => {
        const server1 = http.createServer();
        const server2 = http.createServer();

        utils
            .promisifyServerListen(server1)(8799)
            .then(() => {
                expect(server1.listening).to.be.eql(true);
                expect(server2.listening).to.be.eql(false);

                return utils.promisifyServerListen(server2)(8799);
            })
            .then(() => {
                throw new Error('Second server should not be able to start listening at the same port!');
            }, (err) => {
                expect(err.code).to.be.eql('EADDRINUSE');
            })
            .then(() => {
                server1.close((err) => {
                    expect(server1.listening).to.be.eql(false);
                    expect(server2.listening).to.be.eql(false);
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
        expect(await timeoutPromise).to.be.eql('xxx');
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
            expect(err.message).to.be.eql('some-fail');
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
            expect(err.message).to.be.eql('Promise has timed-out');
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
            expect(err.message).to.be.eql('Custom error message');
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

            expect(given).to.be.eql(expected);
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

            expect(given).to.be.eql(expected);
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

            expect(given).to.be.eql(expected);
        });
    });
});
