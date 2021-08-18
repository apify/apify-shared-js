import qrcode from 'qrcode';

interface CzkQRCodeInputData {
    iban: string;
    amount: number;
    currencyCode: string; // 3 letter currency code
    message: string; // e.g. invoice number
    beneficiaryName: string;
}
/*
 * This function encodes provided data into a single string complying with CZK QR code payment protocol.
 * The protocol is issued by Czech Bank Association and can be found
 * at https://cbaonline.cz/upload/1645-standard-qr-v1-2-cerven-2021.pdf
 */
export function encodeInputDateToRawQrCodeInputString(data: CzkQRCodeInputData): string {
    const { iban, amount, currencyCode, message, beneficiaryName } = data;
    return `SPD*1.0*RN:${beneficiaryName}*ACC:${iban}*AM:${amount}*CC:${currencyCode.toUpperCase()}*MSG:${message}`;
}

/**
 * This function generates CZK QR code that can be used for domestic QR code payment.
 * It returns the QR code encoded as data URL that can be directly viewed in browser or used in <img> tag.
 */
export async function generateCzkPaymentQrCodeDataUrl(data: CzkQRCodeInputData): Promise<string> {
    const code = qrcode.create(encodeInputDateToRawQrCodeInputString(data), {});
    return qrcode.toDataURL(code.segments);
}
