import { assert } from 'chai';
import { USERNAME } from '../build/consts';

describe('consts', () => {
    describe('USERNAME', () => {
        it('REGEX works as expected', () => {
            assert(USERNAME.REGEX.test('anonymous'));
            assert(USERNAME.REGEX.test('---'));
            assert(USERNAME.REGEX.test('john.doe'));
            assert(USERNAME.REGEX.test('john'));
            assert(USERNAME.REGEX.test('john-doe'));
            assert(USERNAME.REGEX.test('JOHN_doe'));
            assert(USERNAME.REGEX.test('favicon.icox'));
            assert(USERNAME.REGEX.test('xfavicon.ico'));
            assert(USERNAME.REGEX.test('karl12345'));
            assert(USERNAME.REGEX.test('45678'));
        });
    });
});
