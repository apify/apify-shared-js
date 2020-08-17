/* eslint-disable no-underscore-dangle */

import { URLSearchParams } from 'url';
import _ from 'underscore';
import moment from 'moment';
import { expect } from 'chai';
import nock from 'nock';

import { SalesforceClient, cleanAndCompareWithSchema, MISSING_NAME_PLACEHOLDER } from '../src/salesforce_client';

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
        expect(cleanedData).to.be.deep.equal(expectedData);
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
        expect(cleanedData).to.be.deep.equal(expectedData);
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
        expect(cleanedData).to.be.deep.equal(expectedData);
    });
    */
    it('throws errors for incorrect types', () => {
        let testingData;
        const shouldThrow = () => cleanAndCompareWithSchema(testingData, testingSchema);

        testingData = { someString: 46 };
        expect(shouldThrow).to.throw();
        testingData = { someNumber: 'asd' };
        expect(shouldThrow).to.throw();
        testingData = { someDate: 'asd' };
        expect(shouldThrow).to.throw();
        testingData = { someObject: 'asd' };
        expect(shouldThrow).to.throw();
        testingData = { someArrayOfNumbers: 'asd' };
        expect(shouldThrow).to.throw();
        testingData = { someObject: { someSubstring: 123 } };
        expect(shouldThrow).to.throw();
        testingData = { someArrayOfObjects: ['asd'] };
        expect(shouldThrow).to.throw();
    });
});

let tokenScope;
describe('SalesforceClient', () => {
    before(() => {
        const query = new URLSearchParams([
            ['grant_type', 'password'],
            ['client_id', BASE_CONFIG.clientId],
            ['client_secret', BASE_CONFIG.clientSecret],
            ['username', BASE_CONFIG.username],
            ['password', BASE_CONFIG.password],
        ]);
        tokenScope = nock('https://test.salesforce.com').persist().post(`/services/oauth2/token?${query.toString()}`).reply(200, DEFAULT_TOKEN_REPLY);
    });
    after(() => {
        tokenScope.persist(false);
    });

    describe('constructor()', () => {
        it('can be initialized', () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            expect(salesforceClient.config).to.be.eql(BASE_CONFIG);
            expect(salesforceClient.auth).to.be.eql(null);
        });
        it('fails if config is missing or incomplete', () => {
            let config = null;
            const throwingFunction = () => new SalesforceClient(config);

            expect(throwingFunction).to.throw(); // Config is missing
            config = {};
            expect(throwingFunction).to.throw(); // client id is missing
            config.clientId = BASE_CONFIG.clientId;
            expect(throwingFunction).to.throw(); // client secret is missing
            config.clientSecret = BASE_CONFIG.clientSecret;
            expect(throwingFunction).to.throw(); // username is missing
            config.username = BASE_CONFIG.username;
            expect(throwingFunction).to.throw(); // password is missing
        });
    });
    describe('getToken()', () => {
        it('works', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            expect(salesforceClient.auth).to.be.eql(null);
            await salesforceClient.getToken();
            expect(salesforceClient.auth).to.be.instanceOf(Object);
            expect(salesforceClient.auth.instanceUrl).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.a('string');
            expect(salesforceClient.auth.expiresAt).to.be.instanceOf(Date);
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

            nock('https://test.salesforce.com').post(`/services/oauth2/token?${query.toString()}`).reply(400, {
                error: 'invalid_grant',
            });

            try {
                await salesforceClient.getToken();
                throw new Error('Line above is supposed to throw');
            } catch (error) {
                expect(error.response.status).to.be.eql(400);
                expect(error.response.data).to.be.instanceOf(Object);
                expect(error.response.data.error).to.be.eql('invalid_grant');
            }
        });
    });
    describe('_callApi()', () => {
        it('works for all used method types', async () => {
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            await salesforceClient.getToken();

            const SUCCESS = { status: 'success' };

            const apiCallOptions = {
                reqheaders: {
                    authorization: `Bearer ${DEFAULT_TOKEN_REPLY.access_token}`,
                },
            };

            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).get('/services/apexrest/testApiCall').reply(200, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).post('/services/apexrest/testApiCall', { id: '1' }).reply(201, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).patch('/services/apexrest/testApiCall', { id: '1' }).reply(200, SUCCESS);
            nock(DEFAULT_TOKEN_REPLY.instance_url, apiCallOptions).delete('/services/apexrest/testApiCall').reply(200, SUCCESS);

            let data = await salesforceClient._callApi('testApiCall', 'GET');
            expect(data).to.be.deep.equal(SUCCESS);
            data = await salesforceClient._callApi('testApiCall', 'DELETE');
            expect(data).to.be.deep.equal(SUCCESS);
            data = await salesforceClient._callApi('testApiCall', 'POST', { id: '1' });
            expect(data).to.be.deep.equal(SUCCESS);
            data = await salesforceClient._callApi('testApiCall', 'PATCH', { id: '1' });
            expect(data).to.be.deep.equal(SUCCESS);

            try {
                await salesforceClient._callApi('testApiCall', 'PUT', { id: '1' });
                expect('Method PUT is not allowed in this client.').to.be.eql('');
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
            await salesforceClient._callApi('testApiCall', 'GET');

            expect(salesforceClient.auth).to.be.instanceOf(Object);
            expect(salesforceClient.auth.instanceUrl).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.a('string');
            expect(salesforceClient.auth.expiresAt).to.be.instanceOf(Date);
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
            await salesforceClient._callApi('testApiCall', 'GET');

            expect(salesforceClient.auth).to.be.instanceOf(Object);
            expect(salesforceClient.auth.instanceUrl).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.eql(DEFAULT_TOKEN_REPLY.access_token);
            expect(salesforceClient.auth.expiresAt).to.be.instanceOf(Date);
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

            await salesforceClient._callApi('testApiCall', 'GET');

            expect(salesforceClient.auth).to.be.instanceOf(Object);
            expect(salesforceClient.auth.instanceUrl).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.a('string');
            expect(salesforceClient.auth.token).to.be.eql(DEFAULT_TOKEN_REPLY.access_token);
            expect(salesforceClient.auth.expiresAt).to.be.instanceOf(Date);
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
            expect(transformedData).to.be.deep.eql(expectedData);
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
            expect(transformedData).to.be.deep.eql(expectedData);
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
            expect(transformedData).to.be.deep.eql(expectedData);
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
            expect(transformedData).to.be.deep.eql(expectedData);
        });
        it("set's salesReps to empty array if not provided", async () => {
            const userData = {
                _id: 'TEST',
            };
            const salesforceClient = new SalesforceClient(BASE_CONFIG);
            const transformedUser = salesforceClient._transformUser(userData);
            expect(transformedUser.salesReps).to.be.deep.equal([]);
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
            expect(data).to.be.deep.equal(expectedReply);
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
            expect(account).to.be.eql(null);
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
                createdAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: moment('2019-05-13T08:40:30.534Z').toDate(),
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
            expect(response).to.be.deep.equal(expectedReply.salesforceId);
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
                createdAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: moment('2018-06-17T21:23:06.946Z').toDate(),
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
                expect('').to.be.eql('Salesforce record already exists');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record already exists');
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
                createdAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                emails: [{ address: 'test@test.cz' }],
                profile: {
                    pictureUrl: 'http://picture.com',
                    firstName: 'Test',
                    lastName: 'Test',
                },
                subscription: {
                    planId: 'CUSTOM',
                    createdAt: moment('2018-06-17T21:23:06.946Z').toDate(),
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
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
                expect('').to.be.eql('Salesforce record not found');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record not found');
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
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
                expect('').to.be.eql('Salesforce record not found');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record not found');
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
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
            expect(transformedData).to.be.deep.eql(expectedData);
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
            expect(data).to.be.deep.equal(expectedReply);
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
            expect(invoice).to.be.eql(null);
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
                issuedAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                paidAt: moment('2018-06-17T21:23:06.946Z').toDate(),
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
            expect(response).to.be.deep.equal(expectedReply.salesforceId);
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
                issuedAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                paidAt: moment('2018-06-17T21:23:06.946Z').toDate(),
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
                expect('').to.be.eql('Salesforce record already exists');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record already exists');
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
                issuedAt: moment('2018-06-17T21:23:06.946Z').toDate(),
                paidAt: moment('2018-06-17T21:23:06.946Z').toDate(),
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
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
                expect('').to.be.eql('Salesforce record not found');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record not found');
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
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
                expect('').to.be.eql('Salesforce record not found');
            } catch (error) {
                expect(error.message).to.be.eql('Salesforce record not found');
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
                expect('').to.be.eql(expectedReply.message);
            } catch (error) {
                expect(error.message).to.be.eql(expectedReply.message);
            }
        });
    });
});
