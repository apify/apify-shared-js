/* eslint-disable no-underscore-dangle */

import { URLSearchParams } from 'url';
import _ from 'underscore';
import nock from 'nock';

import { SalesforceClient, cleanAndCompareWithSchema, MISSING_NAME_PLACEHOLDER } from '@apify/salesforce_client';

const BASE_CONFIG = {
    tokenUrl: 'https://test.salesforce.com/services/oauth2/token',
    clientId: 'dummy_clientId',
    clientSecret: 'dummy_secret',
    username: 'dummy_user@example.com',
    password: 'dummy_password',
};

const DEFAULT_TOKEN_REPLY = {
    access_token: 'dummy_token',
    instance_url: 'https://example.my.salesforce.com',
    id: 'https://test.salesforce.com/id/dummy/dummy',
    token_type: 'Bearer',
    issued_at: '1566909508249',
    signature: 'dummy_signature',
};

// Test for the cleaning function used in the client
describe('cleanAndCompareWithSchema', () => {
    const testingSchema = {
        someString: _.isString,
        someNumber: _.isNumber,
        someDate: _.isDate,
        someBoolean: _.isBoolean,
        someObject: {
            hasSubObject: {
                containingString: _.isString,
            },
            someSubstring: _.isString,
            someSubnumber: _.isNumber,
        },
        someArrayOfObjects: [
            {
                someObjectsString: _.isString,
                someSubobject: {
                    withSomeNumber: _.isNumber,
                },
            },
        ],
        someArrayOfStrings: [_.isString],
        someArrayOfNumbers: [_.isNumber],
    };

    it('works for empty object', () => {
        const testingData = {};
        const expectedData = {};
        const cleanedData = cleanAndCompareWithSchema(testingData, testingSchema);
        expect(cleanedData).toEqual(expectedData);
    });

    it('works for complete object', () => {
        const testingDate = new Date();
        const testingData = {
            someString: 'someString',
            someNumber: 1234,
            someDate: testingDate,
            someBoolean: false,
            someObject: {
                hasSubObject: {
                    containingString: 'someString',
                },
                someSubstring: 'someString',
                someSubnumber: 1234.5,
            },
            someArrayOfObjects: [
                {
                    someObjectsString: 'someString',
                    someSubobject: {
                        withSomeNumber: 1234.5,
                    },
                },
            ],
            someArrayOfStrings: ['someString', 'anotherString'],
            someArrayOfNumbers: [1234],
            someUnexpectedString: 'Unexpected string',
            someUnexpectedNumber: 0,
            someUnexpectedDate: new Date(Date.now() - 100),
            someUnexpectedArray: ['a', 'b', 'c'],
            someUnexpectedObject: { a: 'b' },
        };
        const expectedData = {
            someString: 'someString',
            someNumber: 1234,
            someDate: JSON.stringify(testingDate).replace(/"/g, ''),
            someBoolean: false,
            someObject: {
                hasSubObject: {
                    containingString: 'someString',
                },
                someSubstring: 'someString',
                someSubnumber: 1234.5,
            },
            someArrayOfObjects: [
                {
                    someObjectsString: 'someString',
                    someSubobject: {
                        withSomeNumber: 1234.5,
                    },
                },
            ],
            someArrayOfStrings: ['someString', 'anotherString'],
            someArrayOfNumbers: [1234],
        };
        const cleanedData = cleanAndCompareWithSchema(testingData, testingSchema);
        expect(cleanedData).toEqual(expectedData);
    });
    /* This test is disabled for now, because the salesforce API contains error
    it('keeps null values and ignores undefined data', () => {
        const testingData = {
            someString: null,
            someNumber: null,
            someDate: null,
            someObject: null,
        };
        const expectedData = testingData;
        const cleanedData = cleanAndCompareWithSchema(testingData, testingSchema);
        expect(cleanedData).toEqual(expectedData);
    });
    */
    it('throws errors for incorrect types', () => {
        let testingData: any;
        const shouldThrow = () => cleanAndCompareWithSchema(testingData, testingSchema);

        testingData = { someString: 46 };
        expect(shouldThrow).toThrow();
        testingData = { someNumber: 'asd' };
        expect(shouldThrow).toThrow();
        testingData = { someDate: 'asd' };
        expect(shouldThrow).toThrow();
        testingData = { someObject: 'asd' };
        expect(shouldThrow).toThrow();
        testingData = { someArrayOfNumbers: 'asd' };
        expect(shouldThrow).toThrow();
        testingData = { someObject: { someSubstring: 123 } };
        expect(shouldThrow).toThrow();
        testingData = { someArrayOfObjects: ['asd'] };
        expect(shouldThrow).toThrow();
    });
});

let tokenScope: any;
describe('SalesforceClient', () => {
    beforeAll(() => {
        const query = new URLSearchParams([
            ['grant_type', 'password'],
            ['client_id', BASE_CONFIG.clientId],
            ['client_secret', BASE_CONFIG.clientSecret],
            ['username', BASE_CONFIG.username],
            ['password', BASE_CONFIG.password],
        ]);
        tokenScope = nock('https://test.salesforce.com')
            .persist()
            .post(`/services/oauth2/token?${query.toString()}`)
            .reply(200, DEFAULT_TOKEN_REPLY);
    });
    afterAll(() => {
        tokenScope.persist(false);
    });

    describe('constructor()', () => {
        it('can be initialized', () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            expect(salesforceClient.config).toEqual(BASE_CONFIG);
            expect(salesforceClient.auth).toEqual(null);
        });
        it('fails if config is missing or incomplete', () => {
            let config: any = null;
            const throwingFunction = () => new SalesforceClient(config);

            expect(throwingFunction).toThrow(); // Config is missing
            config = {};
            expect(throwingFunction).toThrow(); // client id is missing
            config.clientId = BASE_CONFIG.clientId;
            expect(throwingFunction).toThrow(); // client secret is missing
            config.clientSecret = BASE_CONFIG.clientSecret;
            expect(throwingFunction).toThrow(); // username is missing
            config.username = BASE_CONFIG.username;
            expect(throwingFunction).toThrow(); // password is missing
        });
    });
    describe('getToken()', () => {
        it('works', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            expect(salesforceClient.auth).toEqual(null);
            await salesforceClient.getToken();
            expect(salesforceClient.auth).toBeInstanceOf(Object);
            expect(typeof salesforceClient.auth!.instanceUrl).toBe('string');
            expect(typeof salesforceClient.auth!.token).toBe('string');
            expect(salesforceClient.auth!.expiresAt).toBeInstanceOf(Date);
        });
        it('throws 400 error if credentials are incorrect', async () => {
            const salesforceClient = new SalesforceClient({ ...BASE_CONFIG });
            salesforceClient.config.password = 'NOT_FUNCTIONAL';

            const query = new URLSearchParams([
                ['grant_type', 'password'],
                ['client_id', salesforceClient.config.clientId],
                ['client_secret', salesforceClient.config.clientSecret],
                ['username', salesforceClient.config.username],
                ['password', salesforceClient.config.password],
            ]);

            nock('https://test.salesforce.com')
                .post(`/services/oauth2/token?${query.toString()}`)
                .reply(400, { error: 'invalid_grant' });

            try {
                await salesforceClient.getToken();
                throw new Error('Line above is supposed to throw');
            } catch (error) {
                expect(error.response.status).toEqual(400);
                expect(error.response.data).toBeInstanceOf(Object);
                expect(error.response.data.error).toEqual('invalid_grant');
            }
        });
    });
    describe('_callApexrestApi()', () => {
        it('works for all used method types', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            await salesforceClient.getToken();

            const SUCCESS = { status: 'success' };

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .get('/services/apexrest/testApiCall').reply(200, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .post('/services/apexrest/testApiCall', { id: '1' }).reply(201, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/testApiCall', { id: '1' }).reply(200, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .delete('/services/apexrest/testApiCall').reply(200, SUCCESS);

            let data = await salesforceClient._callApexrestApi('testApiCall', 'GET');
            expect(data).toEqual(SUCCESS);
            data = await salesforceClient._callApexrestApi('testApiCall', 'DELETE');
            expect(data).toEqual(SUCCESS);
            data = await salesforceClient._callApexrestApi('testApiCall', 'POST', { id: '1' });
            expect(data).toEqual(SUCCESS);
            data = await salesforceClient._callApexrestApi('testApiCall', 'PATCH', { id: '1' });
            expect(data).toEqual(SUCCESS);

            try {
                await salesforceClient._callApexrestApi('testApiCall', 'PUT', { id: '1' });
                expect('Method PUT is not allowed in this client.').toEqual('');
            } catch (error) {
                // do nothing
            }
        });

        it('requests new token on first call', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/testApiCall').reply(200, { status: 'success' });
            await salesforceClient._callApexrestApi('testApiCall', 'GET');

            expect(salesforceClient.auth).toBeInstanceOf(Object);
            expect(typeof salesforceClient.auth!.instanceUrl).toBe('string');
            expect(typeof salesforceClient.auth!.token).toBe('string');
            expect(salesforceClient.auth!.expiresAt).toBeInstanceOf(Date);
        });

        it('requests new token when old token expires', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            salesforceClient.auth = {
                token: 'OLD_TOKEN',
                instanceUrl: DEFAULT_TOKEN_REPLY.instance_url,
                expiresAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            };

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/testApiCall').reply(200, { status: 'success' });
            await salesforceClient._callApexrestApi('testApiCall', 'GET');

            expect(salesforceClient.auth).toBeInstanceOf(Object);
            expect(typeof salesforceClient.auth.instanceUrl).toBe('string');
            expect(typeof salesforceClient.auth.token).toBe('string');
            expect(salesforceClient.auth.token).toEqual(DEFAULT_TOKEN_REPLY.access_token);
            expect(salesforceClient.auth.expiresAt).toBeInstanceOf(Date);
        });

        it('requests new token when old token does not work', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            salesforceClient.auth = {
                token: 'OLD_TOKEN',
                instanceUrl: DEFAULT_TOKEN_REPLY.instance_url,
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            };

            const functionalApiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, functionalApiCallOptions).get('/services/apexrest/testApiCall').reply(200, { status: 'success' });

            const failingApiCallOptions = {
                reqheaders: {
                    authorization: 'Bearer OLD_TOKEN',
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, failingApiCallOptions).get('/services/apexrest/testApiCall').reply(401, {
                message: 'Session expired or invalid',
                errorCode: 'INVALID_SESSION_ID',
            });

            await salesforceClient._callApexrestApi('testApiCall', 'GET');

            expect(salesforceClient.auth).toBeInstanceOf(Object);
            expect(typeof salesforceClient.auth.instanceUrl).toBe('string');
            expect(typeof salesforceClient.auth.token).toBe('string');
            expect(salesforceClient.auth.token).toEqual(DEFAULT_TOKEN_REPLY.access_token);
            expect(salesforceClient.auth.expiresAt).toBeInstanceOf(Date);
        });
    });

    describe('_transformUser()', () => {
        it('correctly transforms user data', async () => {
            const userData = {
                _id: 'TEST',
                salesReps: [
                    { userId: '1', engagementType: 'TEST', description: 'Something' },
                ],
            };
            const expectedData = {
                apifyId: 'TEST',
                salesReps: [
                    { userId: '1', engagementType: 'TEST' },
                ],
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedData = salesforceClient._transformUser(userData);
            expect(transformedData).toEqual(expectedData);
        });
        it('sets correct name if it\'s not provided when creating user and billing info is set', async () => {
            const userData = {
                _id: 'TEST',
                lastBillingInfo: {
                    fullName: 'Jaroslav Petr Hejlek',
                },
                salesReps: [
                    { userId: '1', engagementType: 'TEST', description: 'Something' },
                ],
            };
            const expectedData = {
                apifyId: 'TEST',
                profile: {
                    firstName: 'Jaroslav Petr',
                    lastName: 'Hejlek',
                },
                lastBillingInfo: {
                    fullName: 'Jaroslav Petr Hejlek',
                },
                salesReps: [
                    { userId: '1', engagementType: 'TEST' },
                ],
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedData = salesforceClient._transformUser(userData, true);
            expect(transformedData).toEqual(expectedData);
        });
        it('sets email as name if it\'s not provided when creating user and email is set', async () => {
            const userData = {
                _id: 'TEST',
                emails: [
                    { address: 'test@email.com' },
                ],
                salesReps: [
                    { userId: '1', engagementType: 'TEST', description: 'Something' },
                ],
            };
            const expectedData = {
                apifyId: 'TEST',
                emails: [
                    { address: 'test@email.com' },
                ],
                profile: {
                    lastName: 'test@email.com',
                },
                salesReps: [
                    { userId: '1', engagementType: 'TEST' },
                ],
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedData = salesforceClient._transformUser(userData, true);
            expect(transformedData).toEqual(expectedData);
        });
        it('sets placeholder name if it\'s not provided when creating user and billing info is not set', async () => {
            const userData = {
                _id: 'TEST',
                salesReps: [
                    { userId: '1', engagementType: 'TEST', description: 'Something' },
                ],
            };
            const expectedData = {
                apifyId: 'TEST',
                profile: {
                    lastName: MISSING_NAME_PLACEHOLDER,
                },
                salesReps: [
                    { userId: '1', engagementType: 'TEST' },
                ],
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedData = salesforceClient._transformUser(userData, true);
            expect(transformedData).toEqual(expectedData);
        });
        it("set's salesReps to empty array if not provided", async () => {
            const userData = {
                _id: 'TEST',
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedUser = salesforceClient._transformUser(userData);
            expect(transformedUser.salesReps).toEqual([]);
        });
    });

    // //
    // // Accounts
    // //

    describe('getAccount()', () => {
        it('outputs account info for existing account', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const userId = 'USER';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                type: null,
                salesReps: [],
                salesforceId: '0015E00000oQYKYQA4',
                profile: {},
                lastBillingInfo: {},
                emails: [],
                createdAt: '2018-06-17T21:23:06Z',
                apifyId: 'USER',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/ApifyAccount/USER').reply(200, expectedReply);

            const data = await salesforceClient.getAccount(userId);
            expect(data).toEqual(expectedReply);
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const userId = 'USER';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/ApifyAccount/USER').reply(404, expectedReply);

            const account = await salesforceClient.getAccount(userId);
            // Method above should throw error
            expect(account).toEqual(null);
        });
    });

    describe('createAccount()', () => {
        it('creates new account in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                _id: 'TEST',
                createdAt: new Date('2018-06-17T21:23:06.946Z'),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: new Date('2019-05-13T08:40:30.534Z'),
                    priceQuote: {
                        currencyCode: 'USD',
                        planMonthlyPrice: 2896,
                        taxCountryCode: 'DK',
                    },
                    braintreeSubscriptionId: 'AAAAA',
                },
                lastBillingInfo: {},
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'success',
                salesReps: [
                    {
                        status: 'success',
                        salesforceId: 'a025E000005ENh4QAG',
                        apifyId: 'T2fpL5qYS4xDmPQW8',
                    },
                ],
                salesforceId: '0015E00000oWzTIQA0',
                apifyId: 'TEST',
            };

            const transformedData = salesforceClient._transformUser(userData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/apexrest/ApifyAccount', transformedData).reply(200, expectedReply);

            const response = await salesforceClient.createAccount(userData);
            expect(response).toEqual(expectedReply.salesforceId);
        });

        it('correctly handles duplication error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                _id: 'TEST',
                createdAt: new Date('2018-06-17T21:23:06.946Z'),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: new Date('2018-06-17T21:23:06.946Z'),
                    priceQuote: {
                        currencyCode: 'USD',
                        planMonthlyPrice: 2896,
                        taxCountryCode: 'DK',
                    },
                    braintreeSubscriptionId: 'AAAAA',
                },
                lastBillingInfo: {},
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'error',
                message: 'This object exists in the SF',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformUser(userData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/apexrest/ApifyAccount', transformedData).reply(409, expectedReply);

            try {
                await salesforceClient.createAccount(userData);
                // Method above should throw error
                expect('').toEqual('Salesforce record already exists');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record already exists');
            }
        });
        it('correctly handles errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                _id: 'TEST',
                createdAt: new Date('2018-06-17T21:23:06.946Z'),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: new Date('2018-06-17T21:23:06.946Z'),
                    priceQuote: {
                        currencyCode: 'USD',
                        planMonthlyPrice: 2896,
                        taxCountryCode: 'DK',
                    },
                    braintreeSubscriptionId: 'AAAAA',
                },
                lastBillingInfo: {},
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformUser(userData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/apexrest/ApifyAccount', transformedData).reply(500, expectedReply);

            try {
                await salesforceClient.createAccount(userData);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    describe('updateAccount()', () => {
        it('updates account in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                emails: [{ address: 'new-test@test.cz' }],
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'success',
                salesReps: [
                    {
                        status: 'success',
                        salesforceId: 'a025E000005ENkdQAG',
                        apifyId: 'T2fpL5qYS4xDmPQW8',
                    },
                ],
                salesforceId: '0015E00000oWzTIQA0',
                apifyId: 'TEST',
            };

            const transformedData = salesforceClient._transformUser(userData);
            transformedData.apifyId = 'TEST';
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyAccount', transformedData)
                .reply(200, expectedReply);

            await salesforceClient.updateAccount('TEST', userData);
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                emails: [{ address: 'new-test@test.cz' }],
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformUser(userData);
            transformedData.apifyId = 'TEST';
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyAccount', transformedData)
                .reply(404, expectedReply);

            try {
                await salesforceClient.updateAccount('TEST', userData);
                // Method above should throw error
                expect('').toEqual('Salesforce record not found');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record not found');
            }
        });

        it('correctly handles other errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const userData = {
                emails: [{ address: 'new-test@test.cz' }],
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformUser(userData);
            transformedData.apifyId = 'TEST';
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyAccount', transformedData)
                .reply(500, expectedReply);

            try {
                await salesforceClient.updateAccount('TEST', userData);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    describe('deleteAccount()', () => {
        it('deletes account in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const userId = 'TEST';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'success',
                message: 'Record was removed',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete(`/services/apexrest/ApifyAccount/${userId}`).reply(200, expectedReply);

            await salesforceClient.deleteAccount('TEST');
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const userId = 'TEST';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete(`/services/apexrest/ApifyAccount/${userId}`).reply(404, expectedReply);

            try {
                await salesforceClient.deleteAccount(userId);
                // Method above should throw error
                expect('').toEqual('Salesforce record not found');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record not found');
            }
        });

        it('correctly handles other errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const userId = 'TEST';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete(`/services/apexrest/ApifyAccount/${userId}`).replyWithError(expectedReply);

            try {
                await salesforceClient.deleteAccount(userId);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    // //
    // //    INVOICES
    // //

    describe('_transformInvoice()', () => {
        it('correctly transforms invoice data', async () => {
            const invoiceData = {
                _id: 'TEST',
                number: '12139840934',
            };
            const expectedData = {
                apifyId: 'TEST',
                invoiceNumber: '12139840934',
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedData = salesforceClient._transformInvoice(invoiceData);
            expect(transformedData).toEqual(expectedData);
        });
    });

    describe('getInvoice()', () => {
        it('outputs invoice info for existing invoice', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                userId: 'AAAAAAAAAAAAAAA',
                taxamoTransaction: {},
                salesforceId: 'a005E000008NHsKQAW',
                priceUsd: 12016.276005,
                priceBeforeTaxUsd: 9930.8064,
                priceBeforeTax: 228294.40,
                price: 276236.23,
                paymentStatus: 'PAID_USING_WIRE_TRANSFER',
                paidAt: '2018-06-17T21:23:06.946Z',
                issuedAt: '2018-06-17T21:23:06.946Z',
                invoiceType: 'ONE_TIME',
                invoiceNumber: '20190630502',
                description: '',
                currencyIsoCode: 'CZK',
                apifyId: 'INVOICE',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/ApifyInvoice/INVOICE').reply(200, expectedReply);

            const data = await salesforceClient.getInvoice(invoiceId);
            expect(data).toEqual(expectedReply);
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .get('/services/apexrest/ApifyInvoice/INVOICE')
                .reply(404, expectedReply);

            const invoice = await salesforceClient.getInvoice(invoiceId);
            // Method above should throw error
            expect(invoice).toEqual(null);
        });
    });

    describe('createInvoice()', () => {
        it('creates new Invoice in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                apifyId: 'INVOICE_ID',
                currencyIsoCode: 'CZK',
                paymentStatus: 'PAID_USING_WIRE_TRANSFER',
                invoiceType: 'ONE_TIME',
                userId: 'USER_ID',
                issuedAt: new Date('2018-06-17T21:23:06.946Z'),
                paidAt: new Date('2018-06-17T21:23:06.946Z'),
                description: 'DESCRIPTION',
                price: 276236.23,
                priceBeforeTax: 228294.4,
                priceUsd: 12016.276005,
                priceBeforeTaxUsd: 9930.8064,
                invoiceNumber: '20190630502',
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            const expectedReply = {
                status: 'success',
                salesforceId: '0015E00000oWzTIQA0',
                apifyId: 'INVOICE_ID',
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .post('/services/apexrest/ApifyInvoice', transformedData)
                .reply(200, expectedReply);

            const response = await salesforceClient.createInvoice(invoiceData);
            expect(response).toEqual(expectedReply.salesforceId);
        });

        it('correctly handles duplication error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                apifyId: 'INVOICE_ID',
                currencyIsoCode: 'CZK',
                paymentStatus: 'PAID_USING_WIRE_TRANSFER',
                invoiceType: 'ONE_TIME',
                userId: 'USER_ID',
                issuedAt: new Date('2018-06-17T21:23:06.946Z'),
                paidAt: new Date('2018-06-17T21:23:06.946Z'),
                description: 'DESCRIPTION',
                price: 276236.23,
                priceBeforeTax: 228294.4,
                priceUsd: 12016.276005,
                priceBeforeTaxUsd: 9930.8064,
                invoiceNumber: '20190630502',
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'This object exists in the SF',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .post('/services/apexrest/ApifyInvoice', transformedData)
                .reply(409, expectedReply);

            try {
                await salesforceClient.createInvoice(invoiceData);
                // Method above should throw error
                expect('').toEqual('Salesforce record already exists');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record already exists');
            }
        });
        it('correctly handles errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                apifyId: 'INVOICE_ID',
                currencyIsoCode: 'CZK',
                paymentStatus: 'PAID_USING_WIRE_TRANSFER',
                invoiceType: 'ONE_TIME',
                userId: 'USER_ID',
                issuedAt: new Date('2018-06-17T21:23:06.946Z'),
                paidAt: new Date('2018-06-17T21:23:06.946Z'),
                description: 'DESCRIPTION',
                price: 276236.23,
                priceBeforeTax: 228294.4,
                priceUsd: 12016.276005,
                priceBeforeTaxUsd: 9930.8064,
                invoiceNumber: '20190630502',
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/apexrest/ApifyInvoice', transformedData).reply(500, expectedReply);

            try {
                await salesforceClient.createInvoice(invoiceData);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    describe('updateInvoice()', () => {
        it('updates Invoice in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE_ID';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                priceUsd: 13000,
            };

            const expectedReply = {
                status: 'success',
                salesforceId: '0015E00000oWzTIQA0',
                apifyId: invoiceId,
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            transformedData.apifyId = invoiceId;
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyInvoice', transformedData)
                .reply(200, expectedReply);

            await salesforceClient.updateInvoice(invoiceId, invoiceData);
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE_ID';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                priceUsd: 13000,
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            transformedData.apifyId = invoiceId;
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyInvoice', transformedData)
                .reply(404, expectedReply);

            try {
                await salesforceClient.updateInvoice(invoiceId, invoiceData);
                // Method above should throw error
                expect('').toEqual('Salesforce record not found');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record not found');
            }
        });

        it('correctly handles other errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE_ID';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const invoiceData = {
                priceUsd: 13000,
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            const transformedData = salesforceClient._transformInvoice(invoiceData);
            transformedData.apifyId = invoiceId;
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .patch('/services/apexrest/ApifyInvoice', transformedData)
                .reply(500, expectedReply);

            try {
                await salesforceClient.updateInvoice(invoiceId, invoiceData);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    describe('deleteInvoice()', () => {
        it('deletes Invoice in salesforce', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'INVOICE_ID';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'success',
                message: 'Record was removed',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete(`/services/apexrest/ApifyInvoice/${invoiceId}`).reply(200, expectedReply);

            await salesforceClient.deleteInvoice(invoiceId);
        });

        it('correctly handles not found error', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'TEST';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'No record found.',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete(`/services/apexrest/ApifyInvoice/${invoiceId}`).reply(404, expectedReply);

            try {
                await salesforceClient.deleteInvoice(invoiceId);
                // Method above should throw error
                expect('').toEqual('Salesforce record not found');
            } catch (error) {
                expect(error.message).toEqual('Salesforce record not found');
            }
        });

        it('correctly handles other errors', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const invoiceId = 'TEST';

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                status: 'error',
                message: 'This is custom error message',
                errorCode: 666,
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .delete(`/services/apexrest/ApifyInvoice/${invoiceId}`)
                .replyWithError(expectedReply);

            try {
                await salesforceClient.deleteInvoice(invoiceId);
                // Method above should throw error
                expect('').toEqual(expectedReply.message);
            } catch (error) {
                expect(error.message).toEqual(expectedReply.message);
            }
        });
    });

    describe('createLead()', () => {
        it('create lead works', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const data = { firstName: 'foo', lastName: 'bar', company: 'example company', email: 'foo@example.com', mobile: '888666999' };
            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                id: 'leadId',
                status: 'success',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/data/v49.0/sobjects/Lead').reply(200, expectedReply);

            const lead = await salesforceClient.createLead(data);

            expect(lead.id).toEqual(expectedReply.id);
        });
    });

    describe('createEmailEvent()', () => {
        it('create event works', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const data = { whoId: 'leadId', subject: 'Request form submitted', message: 'Hey, I want to explain enterprise plans.' };
            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                id: 'eventId',
                status: 'success',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/data/v49.0/sobjects/Event').reply(200, expectedReply);

            const event = await salesforceClient.createEmailEvent(data);

            expect(event.id).toEqual(expectedReply.id);
        });
    });

    describe('getLeadByEmail()', () => {
        it('get lead works', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const email = 'test@example.com';
            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            const expectedReply = {
                Id: 'leadId',
                status: 'success',
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .get(`/services/data/v49.0/sobjects/Lead/email/${encodeURIComponent(email)}`)
                .reply(200, expectedReply);

            const lead = await salesforceClient.getLeadByEmail(email) as any;

            expect(lead.Id).toEqual(expectedReply.Id);
        });

        it('returns null if lead doest not exist', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const email = 'test2@example.com';
            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions)
                .get(`/services/data/v49.0/sobjects/Lead/email/${encodeURIComponent(email)}`)
                .reply(404);

            const lead = await salesforceClient.getLeadByEmail(email);

            expect(lead).toEqual(null);
        });
    });
});
