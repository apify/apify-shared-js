import {
    ACTOR_ENV_VARS,
    APIFY_ENV_VARS,
    APIFY_ID_REGEX,
    ENV_VARS,
    LOCAL_ACTOR_ENV_VARS,
    LOCAL_APIFY_ENV_VARS,
    LOCAL_ENV_VARS,
    PROFILE_NAME,
    USERNAME,
} from '@apify/consts';
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

    describe('PROFILE_NAME', () => {
        it('REGEX works as expected', () => {
            // Valid cases
            expect(PROFILE_NAME.REGEX.test('John Doe')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('Anonymous')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('John123')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('John-Doe')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('Org_Example')).toBe(true);
            expect(PROFILE_NAME.REGEX.test(':/JohnDoe')).toBe(true);
            expect(PROFILE_NAME.REGEX.test(':/a/Simple.Name')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('John:/Doe/')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('Simple:.//Name')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('Joh////:/n-Doe')).toBe(true);
            expect(PROFILE_NAME.REGEX.test('user:name')).toBe(true);

            // Invalid cases
            expect(PROFILE_NAME.REGEX.test('user@name')).toBe(false);
            expect(PROFILE_NAME.REGEX.test('user>name')).toBe(false);
            expect(PROFILE_NAME.REGEX.test('user<name')).toBe(false);
            expect(PROFILE_NAME.REGEX.test('example://test')).toBe(false);
            expect(PROFILE_NAME.REGEX.test('example://////test')).toBe(false);
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

    describe('ACTOR_ENV_VARS', () => {
        it('every value is "ACTOR_" + key', () => {
            Object.entries(ACTOR_ENV_VARS).forEach(([k, v]) => {
                expect(v).toBe(`ACTOR_${k}`);
            });
        });
    });

    describe('APIFY_ENV_VARS', () => {
        it('is the same as ENV_VARS', () => {
            Object.keys(APIFY_ENV_VARS).forEach((k) => {
                expect(APIFY_ENV_VARS[k]).toBe(ENV_VARS[k]);
            });
        });

        it('every value is "APIFY_" + key', () => {
            Object.entries(APIFY_ENV_VARS).forEach(([k, v]) => {
                // TODO: remove this once ACTOR_MAX_PAID_DATASET_ITEMS is removed from APIFY_ENV_VARS
                if (k === 'ACTOR_MAX_PAID_DATASET_ITEMS') return;

                expect(v).toBe(`APIFY_${k}`);
            });
        });
    });

    describe('LOCAL_ACTOR_ENV_VARS', () => {
        it('every key starts with "ACTOR_"', () => {
            Object.keys(LOCAL_ACTOR_ENV_VARS).forEach((k) => {
                expect(k.startsWith('ACTOR_')).toBe(true);
            });
        });
        it('every key has a corresponding local value in LOCAL_APIFY_ENV_VARS', () => {
            Object.entries(LOCAL_ACTOR_ENV_VARS).forEach(([k, v]) => {
                // Ignore standby as that was added later and doesn't need backwards compatibility.
                if (k.includes('STANDBY')) return;
                // We need to change 'WEB_SERVER' to 'CONTAINER' because of a rename introduced.
                if (k.includes('WEB_SERVER')) {
                    k = k.replace('WEB_SERVER', 'CONTAINER');
                }
                expect(LOCAL_APIFY_ENV_VARS[`APIFY_${k.slice(6)}`]).toBe(v);
            });
        });
    });

    describe('LOCAL_APIFY_ENV_VARS', () => {
        it('is the same as LOCAL_ENV_VARS', () => {
            Object.keys(LOCAL_APIFY_ENV_VARS).forEach((k) => {
                expect(LOCAL_APIFY_ENV_VARS[k]).toBe(LOCAL_ENV_VARS[k]);
            });
        });

        it('every key starts with "APIFY_"', () => {
            Object.keys(LOCAL_APIFY_ENV_VARS).forEach((k) => {
                expect(k.startsWith('APIFY_')).toBe(true);
            });
        });
    });
});
