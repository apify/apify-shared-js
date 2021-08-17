import {
    encodeInputDateToRawQrCodeInputString,
    generateCzkPaymentQrCodeDataUrl,
} from '@apify/payment_qr_codes';

describe('CZK payment QR code generation', () => {
    it('can encode payment data to QR cod estring', () => {
        expect(encodeInputDateToRawQrCodeInputString({
            iban: 'CZ6508000000192000145399', // testing IBAN from https://www.cnb.cz/cs/platebni-styk/iban/iban-mezinarodni-format-cisla-uctu/
            amount: 123.45,
            currencyCode: 'czk',
            message: 'Test message',
        })).toBe('SPD*1.0*ACC:CZ6508000000192000145399*AM:123.45*CC:CZK*MSG:Test message');

        expect(encodeInputDateToRawQrCodeInputString({
            iban: 'CZ6508000000192000145399', // testing IBAN from https://www.cnb.cz/cs/platebni-styk/iban/iban-mezinarodni-format-cisla-uctu/
            amount: 123.45,
            currencyCode: 'EUR',
            message: 'Test message',
        })).toBe('SPD*1.0*ACC:CZ6508000000192000145399*AM:123.45*CC:EUR*MSG:Test message');
    });

    it('test', async () => {
        const code = await generateCzkPaymentQrCodeDataUrl({
            iban: 'CZ6508000000192000145399', // testing IBAN from https://www.cnb.cz/cs/platebni-styk/iban/iban-mezinarodni-format-cisla-uctu/
            amount: 123.45,
            currencyCode: 'czk',
            message: 'Test message',
        });
        // eslint-disable-next-line max-len
        expect(code).toBe('data:image/png;base64,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');
    });
});
