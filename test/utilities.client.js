import { assert } from 'chai';
import * as utils from '../build/utilities.client';

describe('utilities.client', () => {
    describe('#getOrdinalSuffix()', () => {
        it('works as expected', () => {
            const dir = {
                1: 'st',
                2: 'nd',
                3: 'rd',
                21: 'st',
                22: 'nd',
                23: 'rd',
                31: 'st',
                32: 'nd',
                33: 'rd',
                41: 'st',
                42: 'nd',
                43: 'rd',
                51: 'st',
                52: 'nd',
                53: 'rd',
                61: 'st',
                62: 'nd',
                63: 'rd',
                71: 'st',
                72: 'nd',
                73: 'rd',
                81: 'st',
                82: 'nd',
                83: 'rd',
                91: 'st',
                92: 'nd',
                93: 'rd',
                101: 'st',
                102: 'nd',
                103: 'rd',
            };

            for (let i = -100; i < 120; i++) {
                const expected = dir[i] || 'th';
                assert.deepEqual(utils.getOrdinalSuffix(i), expected);
            }
        });
    });

    describe('#normalizeUrl', () => {
        it('should return null for invalid URLs', () => {
            assert.equal(
                utils.normalizeUrl('example.com'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('something'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('     127.0.0.1   '),
                null,
            );

            assert.equal(
                utils.normalizeUrl('http://'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('   http://'),
                null,
            );

            assert.equal(
                utils.normalizeUrl('   http://     '),
                null,
            );

            assert.equal(
                utils.normalizeUrl(''),
                null,
            );

            assert.equal(
                utils.normalizeUrl('    '),
                null,
            );

            assert.equal(
                utils.normalizeUrl(),
                null,
            );

            assert.equal(
                utils.normalizeUrl(null),
                null,
            );

            assert.equal(
                utils.normalizeUrl(undefined),
                null,
            );

            assert.equal(
                utils.normalizeUrl({}),
                null,
            );
        });

        it('should persist protocols', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('https://example.com'),
                'https://example.com',
            );
        });

        it('should lowercase hostname and protocols', () => {
            assert.equal(
                utils.normalizeUrl('httpS://EXAMPLE.cOm'),
                'https://example.com',
            );

            assert.equal(
                utils.normalizeUrl('hTTp://www.EXAMPLE.com'),
                'http://www.example.com',
            );

            assert.equal(
                utils.normalizeUrl('SOMETHING://www.EXAMPLE.com/test'),
                'something://www.example.com/test',
            );
        });

        it('should remove trailing slash', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('ftp://example.com/'),
                'ftp://example.com',
            );

            assert.equal(
                utils.normalizeUrl('anything://example.com/test/'),
                'anything://example.com/test',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/test.html'),
                'http://example.com/test.html',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/test.html/'),
                'http://example.com/test.html',
            );
        });

        it('should remove ? when empty QSA', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/something?'),
                'http://example.com/something',
            );
        });

        it('should remove common tracking parameters', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_source=xyz'),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_campaign=xyz&param=val'),
                'http://example.com?param=val',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?utm_campaign=xyz&utm_source=neco'),
                'http://example.com',
            );
        });

        it('should sort parameters alphabetically', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?a=a&b=b&c=c'),
                'http://example.com?a=a&b=b&c=c',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com/?b=a&c=b&a=c'),
                'http://example.com?a=c&b=a&c=b',
            );
        });

        it('should handle keepFragment parameter correctly', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com#fragment', false),
                'http://example.com',
            );
            assert.equal(
                utils.normalizeUrl('http://example.com#', false),
                'http://example.com',
            );

            assert.equal(
                utils.normalizeUrl('http://example.com#fragment', true),
                'http://example.com#fragment',
            );
            assert.equal(
                utils.normalizeUrl('http://example.com#', true),
                'http://example.com',
            );


            assert.equal(
                utils.normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', true),
                'https://www.example.com#keyB=val1&keyA=val2',
            );
            assert.equal(
                utils.normalizeUrl('https://www.example.com#keyB=val1&keyA=val2', false),
                'https://www.example.com',
            );
        });

        it('should not touch invalid or empty params', () => {
            assert.equal(
                utils.normalizeUrl('http://example.com/?neco=&dalsi'),
                'http://example.com?dalsi&neco=',
            );
        });

        it('should normalize real-world URLs', () => {
            assert.equal(
                utils.normalizeUrl('https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt'
                    + '?utm_source=heureka.cz'
                    + '&utm_medium=cpc'
                    + '&utm_campaign=Notebooky'
                    + '&utm_term=Dell_XPS_15_9550_Touch_stribrna'),
                'https://www.czc.cz/dell-xps-15-9550-touch-stribrna_3/183874/produkt',
            );

            assert.equal(
                utils.normalizeUrl('http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580/'),
                'http://notebooky.heureka.cz/f:2111:25235;2278:9720,9539;p:579,580',
            );
        });

        it('should trim all parts of URL', () => {
            assert.equal(
                utils.normalizeUrl('    http    ://     test    # fragment   '),
                'http://test',
            );

            assert.equal(
                utils.normalizeUrl('    http   ://     test    # fragment   ', true),
                'http://test#fragment',
            );
        });
    });
});
