import crypto from 'crypto';
import { cryptoRandomObjectId } from './utilities';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY_LENGTH = 32;
const ENCRYPTION_IV_LENGTH = 16;
const ENCRYPTION_AUTH_TAG_LENGTH = 16;

/**
 * It encrypts the given value using AES cipher and the password for encryption using the public key.
 * NOTE: The encryption password is a string of encryption key and initial vector used for cipher.
 * It returns the encrypted password and encrypted value in BASE64 format.
 *
 * @param publicKey {Buffer} Public key used for encryption
 * @param value {string} Value to be encrypted
 * @returns {Object<encryptedPassword, encryptedValue>}
 */
export function publicEncrypt(publicKey: Buffer, value: string) {
    const key = cryptoRandomObjectId(ENCRYPTION_KEY_LENGTH);
    const initVector = cryptoRandomObjectId(ENCRYPTION_IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, initVector);

    const bufferFromValue = Buffer.from(value, 'utf-8');
    const bufferFromKey = Buffer.from(key, 'utf-8');
    const bufferFromInitVector = Buffer.from(initVector, 'utf-8');
    const passwordBuffer = Buffer.concat([bufferFromKey, bufferFromInitVector]);

    // NOTE: Auth Tag is appended to the end of the encrypted data, it has length of 16 bytes and ensures integrity of the data.
    const encryptedValue = Buffer.concat([cipher.update(bufferFromValue), cipher.final(), cipher.getAuthTag()]);
    const encryptedPassword = crypto.publicEncrypt(publicKey, passwordBuffer);

    return {
        encryptedPassword: encryptedPassword.toString('base64'),
        encryptedValue: encryptedValue.toString('base64'),
    };
}

/**
 * It decrypts encrypted password using private key
 * and uses the password(consists of encrypted key and initial vector)
 * to decrypt the encrypted value.
 *
 * @param privateKey {Buffer} Private key used for decryption
 * @param passphrase {string} Passphrase from private key
 * @param encryptedPassword {string} Password in Base64 encrypted using private key
 * @param encryptedValue {string} Content in Base64 encrypted using AES cipher
 * @returns {string}
 */
export function privateDecrypt(privateKey: Buffer, passphrase: string, encryptedPassword: string, encryptedValue: string): string {
    const encryptedValueBuffer = Buffer.from(encryptedValue, 'base64');
    const encryptedPasswordBuffer = Buffer.from(encryptedPassword, 'base64');

    const passwordBuffer = crypto.privateDecrypt({ key: privateKey, passphrase }, encryptedPasswordBuffer);
    if (passwordBuffer.length !== ENCRYPTION_KEY_LENGTH + ENCRYPTION_IV_LENGTH) {
        throw new Error('privateDecrypt: Decryption failed, invalid password length!');
    }

    // Slice Auth tag from the final value cipher
    const authTagBuffer = encryptedValueBuffer.slice(encryptedValueBuffer.length - ENCRYPTION_AUTH_TAG_LENGTH);
    const encryptedDataBuffer = encryptedValueBuffer.slice(0, encryptedValueBuffer.length - ENCRYPTION_AUTH_TAG_LENGTH);

    const encryptedKeyBuffer = passwordBuffer.slice(0, ENCRYPTION_KEY_LENGTH);
    const initVectorBuffer = passwordBuffer.slice(ENCRYPTION_KEY_LENGTH);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, encryptedKeyBuffer, initVectorBuffer);
    decipher.setAuthTag(authTagBuffer);

    return Buffer.concat([decipher.update(encryptedDataBuffer), decipher.final()]).toString('utf-8');
}
