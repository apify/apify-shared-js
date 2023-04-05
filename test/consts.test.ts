import { USERNAME, APIFY_ID_REGEX } from '@apify/consts';
import { cryptoRandomObjectId } from '@apify/utilities';

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

    describe('APIFY_ID_REGEX', () => {
        it('matches testing apify IDs', () => {
            const testingStrings = {
                valid: [
                    'S64xo2hmHBFHbqZQq',
                    'Z7rgePnfc04QHshc2',
                ],
                invalid: [
                    // Invalid length
                    'Z7rgePnfc04QHshc',
                    // Invalid chars
                    '_7rgePnfc04QHshc2',
                    '-7rgePnfc04QHshc2',
                    '~7rgePnfc04QHshc2',
                    '}7rgePnfc04QHshc2',
                    '(7rgePnfc04QHshc2',
                ],
            };
            testingStrings.valid.forEach((str) => {
                expect(str).toMatch(APIFY_ID_REGEX);
            });
            testingStrings.invalid.forEach((str) => {
                expect(str).not.toMatch(APIFY_ID_REGEX);
            });
        });

        it('matches Id generated by cryptoRandomObjectId', () => {
            for (let i = 0; i < 1000; i++) {
                expect(cryptoRandomObjectId()).toMatch(APIFY_ID_REGEX);
            }
        });
    });
});


