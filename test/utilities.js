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

    describe('#splitFullName()', () => {
        it('it works', () => {
            // invalid args
            assert.deepEqual(
                utils.splitFullName(''),
                [null, null],
            );
            assert.deepEqual(
                utils.splitFullName(null),
                [null, null],
            );
            assert.deepEqual(
                utils.splitFullName({}),
                [null, null],
            );
            assert.deepEqual(
                utils.splitFullName(123456),
                [null, null],
            );

            // valid args
            assert.deepEqual(
                utils.splitFullName(''),
                [null, null],
            );
            assert.deepEqual(
                utils.splitFullName('        '),
                [null, null],
            );
            assert.deepEqual(
                utils.splitFullName('   John Newman     '),
                ['John', 'Newman'],
            );
            assert.deepEqual(
                utils.splitFullName('   John \t\n\r Newman     '),
                ['John', '\t\n\r Newman'],
            );
            assert.deepEqual(
                utils.splitFullName('John Paul New\nman'),
                ['John', 'Paul New\nman'],
            );
            assert.deepEqual(
                utils.splitFullName('John Paul Newman  Karl   Ludvig   III'),
                ['John', 'Paul Newman Karl Ludvig III'],
            );
            assert.deepEqual(
                utils.splitFullName('New-man'),
                [null, 'New-man'],
            );
            assert.deepEqual(
                utils.splitFullName('  New  man  '),
                ['New', 'man'],
            );
            assert.deepEqual(
                utils.splitFullName('More    Spaces Between'),
                ['More', 'Spaces Between'],
            );
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

    it('getPublicCrawlerNicePath()', () => {
        const nicePath = utils.getPublicCrawlerNicePath('1234567890', 'example-crawler');
        expect(nicePath).to.be.eql('12345-api-example-crawler');
    });
});
