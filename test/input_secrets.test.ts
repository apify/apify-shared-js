import { createPrivateKey, createPublicKey } from 'node:crypto';

import { decryptInputSecrets, encryptInputSecrets } from '@apify/input_secrets';

const publicKey = createPublicKey({
    // eslint-disable-next-line max-len
    key: Buffer.from('LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQklqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FROEFNSUlCQ2dLQ0FRRUF0dis3NlNXbklhOFFKWC94RUQxRQpYdnBBQmE3ajBnQnVYenJNUU5adjhtTW1RU0t2VUF0TmpOL2xacUZpQ0haZUQxU2VDcGV1MnFHTm5XbGRxNkhUCnh5cXJpTVZEbFNKaFBNT09QSENISVNVdFI4Tk5lR1Y1MU0wYkxJcENabHcyTU9GUjdqdENWejVqZFRpZ1NvYTIKQWxrRUlRZWQ4UVlDKzk1aGJoOHk5bGcwQ0JxdEdWN1FvMFZQR2xKQ0hGaWNuaWxLVFFZay9MZzkwWVFnUElPbwozbUppeFl5bWFGNmlMZTVXNzg1M0VHWUVFVWdlWmNaZFNjaGVBMEdBMGpRSFVTdnYvMEZjay9adkZNZURJOTVsCmJVQ0JoQjFDbFg4OG4wZUhzUmdWZE5vK0NLMDI4T2IvZTZTK1JLK09VaHlFRVdPTi90alVMdGhJdTJkQWtGcmkKOFFJREFRQUIKLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tCg==', 'base64'),
});
const privateKey = createPrivateKey({
    // eslint-disable-next-line max-len
    key: Buffer.from('LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpQcm9jLVR5cGU6IDQsRU5DUllQVEVECkRFSy1JbmZvOiBERVMtRURFMy1DQkMsNTM1QURERjIzNUQ4QkFGOQoKMXFWUzl0S0FhdkVhVUVFMktESnpjM3plMk1lZkc1dmVEd2o1UVJ0ZkRaMXdWNS9VZmIvcU5sVThTSjlNaGhKaQp6RFdrWExueUUzSW0vcEtITVZkS0czYWZkcFRtcis2TmtidXptd0dVMk0vSWpzRjRJZlpad0lGbGJoY09jUnp4CmZmWVIvTlVyaHNrS1RpNGhGV0lBUDlLb3Z6VDhPSzNZY3h6eVZQWUxYNGVWbWt3UmZzeWkwUU5Xb0tGT3d0ZC8KNm9HYzFnd2piRjI5ZDNnUThZQjFGWmRLa1AyMTJGbkt1cTIrUWgvbE1zTUZrTHlTQTRLTGJ3ZG1RSXExbE1QUwpjbUNtZnppV3J1MlBtNEZoM0dmWlQyaE1JWHlIRFdEVzlDTkxKaERodExOZ2RRamFBUFpVT1E4V2hwSkE5MS9vCjJLZzZ3MDd5Z2RCcVd5dTZrc0pXcjNpZ1JpUEJ5QmVNWEpEZU5HY3NhaUZ3Q2c5eFlja1VORXR3NS90WlRsTjIKSEdZV0NpVU5Ed0F2WllMUHR1SHpIOFRFMGxsZm5HR0VuVC9QQlp1UHV4andlZlRleE1mdzFpbGJRU3lkcy9HMgpOOUlKKzkydms0N0ZXR2NOdGh1Q3lCbklva0NpZ0c1ZlBlV2IwQTdpdjk0UGtwRTRJZ3plc0hGQ0ZFQWoxWldLCnpQdFRBQlkwZlJrUzBNc3UwMHYxOXloTTUrdFUwYkVCZWo2eWpzWHRoYzlwS01hcUNIZWlQTC9TSHRkaWsxNVMKQmU4Sml4dVJxZitUeGlYWWVuNTg2aDlzTFpEYzA3cGpkUGp2NVNYRnBYQjhIMlVxQ0tZY2p4R3RvQWpTV0pjWApMNHc3RHNEby80bVg1N0htR09iamlCN1ZyOGhVWEJDdFh2V0dmQXlmcEFZNS9vOXowdm4zREcxaDc1NVVwdDluCkF2MFZrbm9qcmJVYjM1ZlJuU1lYTVltS01LSnpNRlMrdmFvRlpwV0ZjTG10cFRWSWNzc0JGUEYyZEo3V1c0WHMKK0d2Vkl2eFl3S2wyZzFPTE1TTXRZa09vekdlblBXTzdIdU0yMUVKVGIvbHNEZ25GaTkrYWRGZHBLY3R2cm0zdgpmbW1HeG5pRmhLU05GU0xtNms5YStHL2pjK3NVQVBhb2FZNEQ3NHVGajh0WGp0eThFUHdRRGxVUGRVZld3SE9PClF3bVgyMys1REh4V0VoQy91Tm8yNHNNY2ZkQzFGZUpBV281bUNuVU5vUVVmMStNRDVhMzNJdDhhMmlrNUkxUWoKeSs1WGpRaG0xd3RBMWhWTWE4aUxBR0toT09lcFRuK1VBZHpyS0hvNjVtYzNKbGgvSFJDUXJabnVxWkErK0F2WgpjeWU0dWZGWC8xdmRQSTdLb2Q0MEdDM2dlQnhweFFNYnp1OFNUcGpOcElJRkJvRVc5dFRhemUzeHZXWnV6dDc0CnFjZS8xWURuUHBLeW5lM0xGMk94VWoyYWVYUW5YQkpYcGhTZTBVTGJMcWJtUll4bjJKWkl1d09RNHV5dm94NjUKdG9TWGNac054dUs4QTErZXNXR3JSN3pVc0djdU9QQTFERE9Ja2JjcGtmRUxMNjk4RTJRckdqTU9JWnhrcWdxZQoySE5VNktWRmV2NzdZeEJDbm1VcVdXZEhYMjcyU2NPMUYzdWpUdFVnRVBNWGN0aEdBckYzTWxEaUw1Q0k0RkhqCnhHc3pVemxzalRQTmpiY2MzdUE2MjVZS3VVZEI2c1h1Rk5NUHk5UDgwTzBpRWJGTXl3MWxmN2VpdFhvaUUxWVoKc3NhMDVxTUx4M3pPUXZTLzFDdFpqaFp4cVJMRW5pQ3NWa2JVRlVYclpodEU4dG94bGpWSUtpQ25qbitORmtqdwo2bTZ1anpBSytZZHd2Nk5WMFB4S0gwUk5NYVhwb1lmQk1oUmZ3dGlaS3V3Y2hyRFB5UEhBQ2J3WXNZOXdtUE9rCnpwdDNxWi9JdDVYTmVqNDI0RzAzcGpMbk1sd1B1T1VzYmFQUWQ2VHU4TFhsckZReUVjTXJDNHdjUTA1SzFVN3kKM1NNN3RFaTlnbjV3RjY1YVI5eEFBR0grTUtMMk5WNnQrUmlTazJVaWs1clNmeDE4Mk9wYmpSQ2grdmQ4UXhJdwotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=', 'base64'),
    passphrase: 'pwd1234',
});

const inputSchema = {
    title: 'Test Schema',
    type: 'object',
    schemaVersion: 1,
    properties: {
        secure: {
            title: 'Secure String',
            type: 'string',
            editor: 'textfield',
            isSecret: true,
            description: 'Description',
        },
        customString: {
            title: 'String',
            type: 'string',
            editor: 'textfield',
            description: 'Description',
        },
    },
    required: ['customString'],
};

describe('input secrets', () => {
    it('should decrypt encrypted values correctly', () => {
        const testInput = { secure: 'my secret string', customString: 'just string' };
        const encryptedInput = encryptInputSecrets({ input: testInput, inputSchema, publicKey });
        expect(encryptedInput.secure).not.toEqual(testInput.secure);
        expect(encryptedInput.customString).toEqual(testInput.customString);
        expect(testInput).toStrictEqual(decryptInputSecrets({ input: encryptedInput, privateKey }));
    });

    it('should not decrypt already decrypted values', () => {
        const testInput = { secure: 'my secret', customString: 'just string' };
        const encrypted1 = encryptInputSecrets({ input: testInput, inputSchema, publicKey });
        const encrypted2 = encryptInputSecrets({ input: encrypted1, inputSchema, publicKey });
        expect(testInput).toStrictEqual(decryptInputSecrets({ input: encrypted2, privateKey }));
    });

    it('should throw if private key is not valid', () => {
        const testInput = { secure: 'a secret string', customString: 'another string' };
        const encryptedInput = encryptInputSecrets({ input: testInput, inputSchema, publicKey });
        expect(encryptedInput.secure).not.toEqual(testInput.secure);
        expect(encryptedInput.customString).toEqual(testInput.customString);
        expect(() => decryptInputSecrets({ input: encryptedInput, privateKey: publicKey }))
            .toThrow(`The input field "secure" could not be decrypted. Try updating the field's value in the input editor.`);
    });
});
