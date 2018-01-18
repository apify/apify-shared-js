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
});
