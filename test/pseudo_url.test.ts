import { PseudoUrl, purlToRegExp } from '@apify/pseudo_url';

describe('PseudoUrl', () => {
    test('should convert PURL string into RegExp object instance', () => {
        const purlInput = 'http://www.example.com/PAGES/[(\\w|-)*]';
        const purl = new PseudoUrl(purlInput);
        expect(purl.regex).toBeInstanceOf(RegExp);
        expect(String(purl.regex)).not.toEqual(String(purlInput));
    });

    test('should accept RegExp on input', () => {
        const regexpInput = /example\.com\/pages/;
        const purl = new PseudoUrl(regexpInput);
        expect(purl.regex).toBeInstanceOf(RegExp);
        expect(String(purl.regex)).toEqual(String(regexpInput));
    });

    test('matches() should work', () => {
        let purl = new PseudoUrl('http://www.example.com/PAGES/[(\\w|-)*]');

        expect(purl.matches('http://www.example.com/PAGES/')).toBe(true);
        expect(purl.matches('http://www.example.com/pages/my-awesome-page')).toBe(true);
        expect(purl.matches('http://www.example.com/PAGES/not@working')).toBe(false);

        purl = new PseudoUrl(/example\.com\/pages/);

        expect(purl.matches('http://www.example.com/PAGES/')).toBe(false);
        expect(purl.matches('http://www.example.com/pages/my-awesome-page')).toBe(true);
        expect(purl.matches('http://www.example.com/pages/not@working')).toBe(true);
    });
});

describe('purlToRegExp', () => {
    test('should return RegExp object instance', () => {
        const regex = purlToRegExp('http://www.example.com/PAGES/[(\\w|-)*]');
        expect(regex).toBeInstanceOf(RegExp);
    });
});
