import { USERNAME } from '@apify/consts';

describe('consts', () => {
    describe('USERNAME', () => {
        it('REGEX works as expected', () => {
            expect(USERNAME.REGEX.test('anonymous')).toBe(true);
            expect(USERNAME.REGEX.test('---')).toBe(true);
            expect(USERNAME.REGEX.test('john.doe')).toBe(true);
            expect(USERNAME.REGEX.test('john')).toBe(true);
            expect(USERNAME.REGEX.test('john-doe')).toBe(true);
            expect(USERNAME.REGEX.test('JOHN_doe')).toBe(true);
            expect(USERNAME.REGEX.test('favicon.icox')).toBe(true);
            expect(USERNAME.REGEX.test('xfavicon.ico')).toBe(true);
            expect(USERNAME.REGEX.test('karl12345')).toBe(true);
            expect(USERNAME.REGEX.test('45678')).toBe(true);
        });
    });
});
