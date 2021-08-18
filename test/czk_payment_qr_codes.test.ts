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
        expect(code).toMatchSnapshot();
    });
});
