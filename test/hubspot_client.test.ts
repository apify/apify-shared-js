/* eslint-disable no-underscore-dangle, no-unused-expressions */
import _ from 'underscore';
import nock from 'nock';

import { HubspotClient, cleanAndCompareWithSchema, MISSING_NAME_PLACEHOLDER } from '@apify/hubspot_client';

const HUBSPOT_URL = 'https://api.hubapi.com/crm/v3';

const BASE_CONFIG = {
    apiKey: '118d7732-273b-41c1-980b-9947f19b44e6',
    invoiceObjectId: 'p19562098_apify_invoice',
    invoiceToContactAssociation: 'platform_invoice_to_contact',
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

describe('HubspotClient', () => {
    describe('constructor()', () => {
        it('can be initialized', () => {
            const hubspotClient = new HubspotClient(BASE_CONFIG);
            expect(hubspotClient.config).toEqual(BASE_CONFIG);
        });
        it('fails if config is missing or incomplete', () => {
            let config: any = null;
            const throwingFunction = () => new HubspotClient(config);

            expect(throwingFunction).toThrow(); // Config is missing
            config = {};
            expect(throwingFunction).toThrow(); // Api key is missing
            config.apiKey = BASE_CONFIG.apiKey;
            expect(throwingFunction).toThrow(); // Invoice object id is missing
            config.invoiceObjectId = BASE_CONFIG.invoiceObjectId;
            expect(throwingFunction).toThrow(); // Invoice to contact association is missing
        });
    });

    // //
    // // Transformations
    // //

    describe('_transformUser()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('correctly transforms user data', async () => {
            const userData = {
                _id: 'TEST',
            };
            const expectedData = {
                apify_id__c: 'TEST',
                subscription_plan: '',
                subscription_price: 0,
                segment_paying_user: 'false',
            };
            const transformedData = hubspotClient._transformUser(userData);
            expect(transformedData).toEqual(expectedData);
        });
        it('sets correct name if it\'s not provided when creating user and billing info is set', async () => {
            const userData = {
                _id: 'TEST',
                lastBillingInfo: {
                    fullName: 'Some Random Name',
                },
            };
            const expectedData = {
                apify_id__c: 'TEST',
                lifecyclestage: 'customer',
                firstname: 'Some Random',
                lastname: 'Name',
                company: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: '',
                eu_vat_number__c: '',
                billing_email__c: '',
                subscription_plan: '',
                subscription_price: 0,
                segment_paying_user: 'false',
            };
            const transformedData = hubspotClient._transformUser(userData, true);
            expect(transformedData).toEqual(expectedData);
        });
        it('sets placeholder name if it\'s not provided when creating user and billing info is not set', async () => {
            const userData = {
                _id: 'TEST',
            };
            const expectedData = {
                apify_id__c: 'TEST',
                lifecyclestage: 'customer',
                lastname: MISSING_NAME_PLACEHOLDER,
                subscription_plan: '',
                subscription_price: 0,
                segment_paying_user: 'false',
            };
            const transformedData = hubspotClient._transformUser(userData, true);
            expect(transformedData).toEqual(expectedData);
        });
    });

    describe('_transformInvoice()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('correctly transforms invoice data', async () => {
            const invoiceData = {
                _id: 'TEST',
                number: '12139840934',
            };
            const expectedData = {
                apify_id__c: 'TEST',
                invoice_number: '12139840934',
                is_draft: 'false',
            };
            const transformedData = hubspotClient._transformInvoice(invoiceData);
            expect(transformedData).toEqual(expectedData);
        });
    });

    // //
    // // Contacts
    // //

    describe('searchContactByEmail()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs contact info for existing contact', async () => {
            const email = 'some@contact.com';
            const contactId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: email,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 1,
                results: [{
                    id: contactId,
                    properties: {
                        createdate: '2021-04-01T12:30:57.056Z',
                        email,
                        firstname: 'Some',
                        hs_object_id: contactId,
                        lastmodifieddate: '2021-04-14T13:16:49.951Z',
                        lastname: 'User',
                    },
                    createdAt: '2021-04-01T12:30:57.056Z',
                    updatedAt: '2021-04-14T13:16:49.951Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchContactByEmail(email);
            expect(data!.id).toEqual(contactId);
            expect(data!.properties).toEqual(networkReply.results[0].properties);
        });

        it('returns null when nothing is found', async () => {
            const email = 'some@contact.com';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: email,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 0,
                results: [],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchContactByEmail(email);
            expect(data).toBeNull();
        });

        it('throws if email is empty', async () => {
            try {
                await hubspotClient.searchContactByEmail('');
                // we should not get here
                expect(true).toEqual(false);
            } catch (error) {
                expect(error.message).toEqual('Arg "email" is required in HubspotClient.searchContactByEmail');
            }
        });
    });

    describe('searchContactByApifyUserId()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs contact info for existing contact', async () => {
            const apifyUserId = 'as4d564a6s5d46asd';
            const contactId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: apifyUserId,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 1,
                results: [{
                    id: contactId,
                    properties: {
                        createdate: '2021-04-01T12:30:57.056Z',
                        email: 'some@email.cz',
                        firstname: 'Some',
                        hs_object_id: contactId,
                        lastmodifieddate: '2021-04-14T13:16:49.951Z',
                        lastname: 'User',
                    },
                    createdAt: '2021-04-01T12:30:57.056Z',
                    updatedAt: '2021-04-14T13:16:49.951Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchContactByApifyUserId(apifyUserId);
            expect(data!.id).toEqual(contactId);
            expect(data!.properties).toEqual(networkReply.results[0].properties);
        });

        it('returns null when nothing is found', async () => {
            const apifyUserId = 'as4d564a6s5d46asd';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: apifyUserId,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 0,
                results: [],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchContactByApifyUserId(apifyUserId);
            expect(data).toBeNull();
        });

        it('throws if userId is not passed is empty', async () => {
            try {
                await hubspotClient.searchContactByApifyUserId('');
                // we should not get here
                expect(true).toEqual(false);
            } catch (error) {
                expect(error.message).toEqual('Arg "apifyUserId" is required in HubspotClient.searchContactByApifyUserId');
            }
        });
    });

    describe('lookupContactId()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        const user = {
            _id: 'random_id',
            emails: [{ address: 'some@email.cz' }],
        };

        it('outputs contact ID info if contact exists with apify ID set', async () => {
            const contactId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: user._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 1,
                results: [{
                    id: contactId,
                    properties: {
                        createdate: '2021-04-01T12:30:57.056Z',
                        email: user.emails[0].address,
                        firstname: 'Some',
                        hs_object_id: contactId,
                        lastmodifieddate: '2021-04-14T13:16:49.951Z',
                        lastname: 'User',
                    },
                    createdAt: '2021-04-01T12:30:57.056Z',
                    updatedAt: '2021-04-14T13:16:49.951Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.lookupContactId(user);
            expect(data).toEqual(contactId);
        });

        it('outputs contact ID info if contact exists with email set', async () => {
            const contactId = '100';

            const expectedIdPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: user._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const expectedEmailPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: user.emails[0].address,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const idNetworkReply = {
                total: 0,
                results: [],
            };

            const emailNetworkReply = {
                total: 1,
                results: [{
                    id: contactId,
                    properties: {
                        createdate: '2021-04-01T12:30:57.056Z',
                        email: user.emails[0].address,
                        firstname: 'Some',
                        hs_object_id: contactId,
                        lastmodifieddate: '2021-04-14T13:16:49.951Z',
                        lastname: 'User',
                    },
                    createdAt: '2021-04-01T12:30:57.056Z',
                    updatedAt: '2021-04-14T13:16:49.951Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedIdPostData).reply(200, idNetworkReply);
            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedEmailPostData).reply(200, emailNetworkReply);

            const data = await hubspotClient.lookupContactId(user);
            expect(data).toEqual(contactId);
        });

        it('outputs null if contact is not found', async () => {
            const expectedIdPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: user._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const expectedEmailPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'email',
                        operator: 'EQ',
                        value: user.emails[0].address,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const idNetworkReply = {
                total: 0,
                results: [],
            };

            const emailNetworkReply = {
                total: 0,
                results: [],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedIdPostData).reply(200, idNetworkReply);
            nock(HUBSPOT_URL, {}).post(`/objects/contacts/search?hapikey=${BASE_CONFIG.apiKey}`, expectedEmailPostData).reply(200, emailNetworkReply);

            const data = await hubspotClient.lookupContactId(user);
            expect(data).toBeNull();
        });
    });

    describe('getContact()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs contact info for existing contact', async () => {
            const contactId = '301';
            const networkReply = {
                id: contactId,
                properties: {
                    createdate: '2021-04-01T12:30:57.056Z',
                    email: 'random@user.com',
                    firstname: 'Random',
                    hs_object_id: contactId,
                    lastmodifieddate: '2021-04-14T13:16:49.951Z',
                    lastname: 'User',
                },
                createdAt: '2021-04-01T12:30:57.056Z',
                updatedAt: '2021-04-14T13:16:49.951Z',
                archived: false,
            };

            nock(HUBSPOT_URL, {}).get(`/objects/contacts/${contactId}?hapikey=${BASE_CONFIG.apiKey}`).reply(200, networkReply);

            const data = await hubspotClient.getContact(contactId);
            expect(data!.id).toEqual(contactId);
            expect(data!.properties).toEqual(networkReply.properties);
        });

        it('correctly handles not found error', async () => {
            const contactId = '301';
            nock(HUBSPOT_URL, {}).get(`/objects/contacts/${contactId}?hapikey=${BASE_CONFIG.apiKey}`).reply(404, '');

            const data = await hubspotClient.getContact(contactId);
            expect(data).toBeNull();
        });
    });

    describe('createContact()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('creates new contact in hubspot', async () => {
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

            const networkReply = {
                id: '801',
                properties: {
                    createdate: '2021-04-18T21:23:09.435Z',
                    hs_is_unworked: 'true',
                    hs_marketable_status: 'false',
                    hs_marketable_until_renewal: 'false',
                    lastmodifieddate: '2021-04-18T21:23:09.435Z',
                },
                createdAt: '2021-04-18T21:23:09.435Z',
                updatedAt: '2021-04-18T21:23:09.435Z',
                archived: false,
            };

            const transformedData = hubspotClient._transformUser(userData, true);
            nock(HUBSPOT_URL).post(`/objects/contacts?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData }).reply(200, networkReply);

            const contactId = await hubspotClient.createContact(userData);
            expect(contactId).toEqual(networkReply.id);
        });
    });

    describe('updateContact()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('updates contact in hubspot', async () => {
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
                    plan: {
                        id: 'CUSTOM',
                        monthlyBasePriceUsd: 2896,
                    },
                },
                lastBillingInfo: {},
                salesReps: [
                    {
                        userId: 'T2fpL5qYS4xDmPQW8',
                        engagementType: 'SALES_REP_MEDIUM_INVOLVEMENT',
                    },
                ],
            };

            const contactId = 801;

            const networkReply = {
                id: '801',
                properties: {
                    apify_id__c: 'TEST',
                    closedate: '2021-04-19T08:32:14.893Z',
                    email: 'test@test.cz',
                    firstname: 'Test',
                    hs_lifecyclestage_customer_date: '2021-04-19T08:32:14.893Z',
                    lastmodifieddate: '2021-04-19T08:32:14.894Z',
                    lastname: 'Test',
                    lifecyclestage: 'customer',
                    segment_paying_customer: 'true',
                    subscription_plan: 'CUSTOM',
                },
                createdAt: '2021-04-18T21:23:09.435Z',
                updatedAt: '2021-04-19T08:32:14.894Z',
                archived: false,
            };

            const transformedData = hubspotClient._transformUser(userData);
            nock(HUBSPOT_URL)
                .patch(`/objects/contacts/${contactId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(200, networkReply);

            let err = null;
            try {
                await hubspotClient.updateContact(contactId, userData);
            } catch (error) {
                err = error;
            }

            expect(err).toBeNull();
        });

        it('correctly handles not found error', async () => {
            const userData = {
                _id: 'TEST',
                emails: [{ address: 'test@test.cz' }],
            };

            const contactId = 801;

            const networkReply = {
                status: 'error',
                message: 'resource not found',
                correlationId: 'cc669b6e-ba23-41c7-afde-a25e0f1e9a51',
            };

            const transformedData = hubspotClient._transformUser(userData);
            nock(HUBSPOT_URL)
                .patch(`/objects/contacts/${contactId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(404, networkReply);

            let err = null;
            try {
                await hubspotClient.updateContact(contactId, userData);
            } catch (error) {
                err = error;
            }

            expect(err).not.toBeNull();
            expect(err.message).toEqual('Hubspot record not found');
        });
    });

    describe('deleteContact()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('deletes contact in hubspot', async () => {
            const contactId = 801;

            nock(HUBSPOT_URL).delete(`/objects/contacts/${contactId}?hapikey=${BASE_CONFIG.apiKey}`).reply(204);

            let err = null;
            try {
                await hubspotClient.deleteContact(contactId);
            } catch (error) {
                err = error;
            }

            expect(err).toBeNull();
        });
    });

    // //
    // //    INVOICES
    // //

    describe('searchInvoiceByNumber()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs invoice info for existing invoice', async () => {
            const invoiceNumber = 'INVOICE_NUMBER';
            const invoiceId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'invoice_number',
                        operator: 'EQ',
                        value: invoiceNumber,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 1,
                results: [{
                    id: invoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: invoiceId,
                    },
                    createdAt: '2021-04-21T08:14:38.702Z',
                    updatedAt: '2021-04-21T08:14:38.702Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData)
                .reply(200, networkReply);

            const data = await hubspotClient.searchInvoiceByNumber(invoiceNumber);
            expect(data!.id).toEqual(invoiceId);
            expect(data!.properties).toEqual(networkReply.results[0].properties);
        });

        it('returns null when nothing is found', async () => {
            const invoiceNumber = 'INVOICE_NUMBER';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'invoice_number',
                        operator: 'EQ',
                        value: invoiceNumber,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 0,
                results: [],
            };

            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData)
                .reply(200, networkReply);

            const data = await hubspotClient.searchInvoiceByNumber(invoiceNumber);
            expect(data).toBeNull();
        });

        it('throws if invoiceNumber is empty', async () => {
            try {
                await hubspotClient.searchInvoiceByNumber('');
                // we should not get here
                expect(true).toEqual(false);
            } catch (error) {
                expect(error.message).toEqual('Arg "invoiceNumber" is required in HubspotClient.searchInvoiceByNumber');
            }
        });
    });

    describe('searchInvoiceByApifyInvoiceId()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs invoice info for existing invoice', async () => {
            const apifyInvoiceId = 'APIFY_INVOICE_ID';
            const invoiceId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: apifyInvoiceId,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 1,
                results: [{
                    id: invoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: invoiceId,
                    },
                    createdAt: '2021-04-21T08:14:38.702Z',
                    updatedAt: '2021-04-21T08:14:38.702Z',
                    archived: false,
                }],
            };

            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData)
                .reply(200, networkReply);

            const data = await hubspotClient.searchInvoiceByApifyInvoiceId(apifyInvoiceId);
            expect(data!.id).toEqual(invoiceId);
            expect(data!.properties).toEqual(networkReply.results[0].properties);
        });

        it('returns null when nothing is found', async () => {
            const apifyInvoiceId = 'APIFY_INVOICE_ID';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: apifyInvoiceId,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const networkReply = {
                total: 0,
                results: [],
            };

            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData)
                .reply(200, networkReply);

            const data = await hubspotClient.searchInvoiceByApifyInvoiceId(apifyInvoiceId);
            expect(data).toBeNull();
        });

        it('throws if userId is not passed is empty', async () => {
            try {
                await hubspotClient.searchInvoiceByApifyInvoiceId('');
                // we should not get here
                expect(true).toEqual(false);
            } catch (error) {
                expect(error.message).toEqual('Arg "apifyInvoiceId" is required in HubspotClient.searchInvoiceByApifyInvoiceId');
            }
        });
    });

    describe('lookupInvoiceId()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        const invoice = {
            _id: 'apify_invoice_id',
            number: 'apify_invoice_number',
        };

        it('outputs invoice ID info if invoice exists with apify ID set', async () => {
            const invoiceId = '100';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: invoice._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            nock(HUBSPOT_URL, {}).post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, {
                total: 1,
                results: [{
                    id: invoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: invoiceId,
                    },
                    createdAt: '2021-04-21T08:14:38.702Z',
                    updatedAt: '2021-04-21T08:14:38.702Z',
                    archived: false,
                }],
            });

            const data = await hubspotClient.lookupInvoiceId(invoice);
            expect(data).toEqual(invoiceId);
        });

        it('outputs invoice ID info if invoice exists with email set', async () => {
            const invoiceId = '100';

            const expectedIdPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: invoice._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const expectedNumberPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'invoice_number',
                        operator: 'EQ',
                        value: invoice.number,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            // Query by _id should not return any results
            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedIdPostData)
                .reply(200, {
                    total: 0,
                    results: [],
                });

            // Query by number returns valid response
            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedNumberPostData)
                .reply(200, {
                    total: 1,
                    results: [{
                        id: invoiceId,
                        properties: {
                            hs_createdate: '2021-04-21T08:14:38.702Z',
                            hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                            hs_object_id: invoiceId,
                        },
                        createdAt: '2021-04-21T08:14:38.702Z',
                        updatedAt: '2021-04-21T08:14:38.702Z',
                        archived: false,
                    }],
                });

            const data = await hubspotClient.lookupInvoiceId(invoice);
            expect(data).toEqual(invoiceId);
        });

        it('outputs null if invoice is not found', async () => {
            const expectedIdPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'apify_id__c',
                        operator: 'EQ',
                        value: invoice._id,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const expectedNumberPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'invoice_number',
                        operator: 'EQ',
                        value: invoice.number,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedIdPostData)
                .reply(200, {
                    total: 0,
                    results: [],
                });
            nock(HUBSPOT_URL, {})
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}/search?hapikey=${BASE_CONFIG.apiKey}`, expectedNumberPostData)
                .reply(200, {
                    total: 0,
                    results: [],
                });

            const data = await hubspotClient.lookupInvoiceId(invoice);
            expect(data).toBeNull();
        });
    });
    describe('getInvoice()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('outputs invoice info for existing invoice', async () => {
            const expectedInvoiceId = '301';
            const networkReply = {
                id: expectedInvoiceId,
                properties: {
                    hs_createdate: '2021-04-21T08:14:38.702Z',
                    hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                    hs_object_id: expectedInvoiceId,
                },
                createdAt: '2021-04-21T08:14:38.702Z',
                updatedAt: '2021-04-21T08:14:38.702Z',
                archived: false,
            };

            nock(HUBSPOT_URL, {})
                .get(`/objects/${BASE_CONFIG.invoiceObjectId}/${expectedInvoiceId}?hapikey=${BASE_CONFIG.apiKey}`)
                .reply(200, networkReply);

            const data = await hubspotClient.getInvoice(expectedInvoiceId);
            expect(data!.id).toEqual(expectedInvoiceId);
            expect(data!.properties).toEqual(networkReply.properties);
        });

        it('correctly handles not found error', async () => {
            const expectedInvoiceId = '301';
            nock(HUBSPOT_URL, {}).get(`/objects/${BASE_CONFIG.invoiceObjectId}/${expectedInvoiceId}?hapikey=${BASE_CONFIG.apiKey}`).reply(404, '');

            const data = await hubspotClient.getInvoice(expectedInvoiceId);
            expect(data).toBeNull();
        });
    });
    describe('createInvoice()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('creates new invoice in hubspot', async () => {
            const expectedInvoiceId = '100';
            const expectedContactId = '101';
            const invoiceData = {
                _id: 'INVOICE_ID',
                number: '20190630502',
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
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            const transformedData = hubspotClient._transformInvoice(invoiceData);

            // Simulate getContact response
            nock(HUBSPOT_URL, {})
                .get(`/objects/contacts/${expectedContactId}?hapikey=${BASE_CONFIG.apiKey}`)
                .reply(200, {
                    id: expectedContactId,
                    properties: {
                        createdate: '2021-04-01T12:30:57.056Z',
                        email: 'random@user.com',
                        firstname: 'Random',
                        hs_object_id: expectedContactId,
                        lastmodifieddate: '2021-04-14T13:16:49.951Z',
                        lastname: 'User',
                    },
                    createdAt: '2021-04-01T12:30:57.056Z',
                    updatedAt: '2021-04-14T13:16:49.951Z',
                    archived: false,
                });

            // Simulate createInvoice api response
            nock(HUBSPOT_URL)
                .post(`/objects/${BASE_CONFIG.invoiceObjectId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(200, {
                    id: expectedInvoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: expectedInvoiceId,
                        ...transformedData,
                    },
                    createdAt: '2021-04-18T21:23:09.435Z',
                    updatedAt: '2021-04-18T21:23:09.435Z',
                    archived: false,
                });

            // Simulate associate contact with invoice
            const associationUrl = `${expectedInvoiceId}/associations/contact/${expectedContactId}/${BASE_CONFIG.invoiceToContactAssociation}`;
            nock(HUBSPOT_URL)
                .put(`/objects/${BASE_CONFIG.invoiceObjectId}/${associationUrl}?hapikey=${BASE_CONFIG.apiKey}`)
                .reply(200, {
                    id: expectedInvoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: expectedInvoiceId,
                    },
                    createdAt: '2021-04-21T08:14:38.702Z',
                    updatedAt: '2021-04-21T08:14:38.702Z',
                    archived: false,
                    associations: {
                        contacts: {
                            results: [{
                                id: expectedContactId,
                                type: 'platform_invoice_to_contact',
                            }],
                        },
                    },
                });

            const invoiceId = await hubspotClient.createInvoice(invoiceData, expectedContactId);
            expect(invoiceId).toEqual(expectedInvoiceId);
        });
        it('throws if contact does not exist', async () => {
            const expectedContactId = '101';
            const invoiceData = {
                _id: 'INVOICE_ID',
                number: '20190630502',
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
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            // Simulate getContact response
            nock(HUBSPOT_URL, {})
                .get(`/objects/contacts/${expectedContactId}?hapikey=${BASE_CONFIG.apiKey}`)
                .reply(404);

            try {
                await hubspotClient.createInvoice(invoiceData, expectedContactId);
                // we should not get here
                expect(true).toEqual(false);
            } catch (error) {
                expect(error.message).toEqual(`Hubspot with contact ID ${expectedContactId} does not exist`);
            }
        });
    });
    describe('updateInvoice()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('updates invoice in hubspot', async () => {
            const expectedInvoiceId = '100';
            const invoiceData = {
                _id: 'INVOICE_ID',
                number: '20190630502',
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
                isDraft: false,
                taxamoTransaction: {
                    tax_country_code: 'CZ',
                },
            };

            const transformedData = hubspotClient._transformInvoice(invoiceData);

            nock(HUBSPOT_URL)
                .patch(`/objects/${BASE_CONFIG.invoiceObjectId}/${expectedInvoiceId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(200, {
                    id: expectedInvoiceId,
                    properties: {
                        hs_createdate: '2021-04-21T08:14:38.702Z',
                        hs_lastmodifieddate: '2021-04-21T08:14:38.702Z',
                        hs_object_id: expectedInvoiceId,
                        ...transformedData,
                    },
                    createdAt: '2021-04-18T21:23:09.435Z',
                    updatedAt: '2021-04-18T21:23:09.435Z',
                    archived: false,
                });

            let err = null;
            try {
                await hubspotClient.updateInvoice(expectedInvoiceId, invoiceData);
            } catch (error) {
                err = error;
            }

            expect(err).toBeNull();
        });

        it('correctly handles not found error', async () => {
            const invoiceData = {
                _id: 'TEST',
                isDraft: true,
            };

            const expectedInvoiceId = 801;

            const transformedData = hubspotClient._transformUser(invoiceData);
            nock(HUBSPOT_URL)
                .patch(`/objects/${BASE_CONFIG.invoiceObjectId}/${expectedInvoiceId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(404, {
                    status: 'error',
                    message: 'resource not found',
                    correlationId: 'cc669b6e-ba23-41c7-afde-a25e0f1e9a51',
                });

            let err = null;
            try {
                await hubspotClient.updateInvoice(expectedInvoiceId, invoiceData);
            } catch (error) {
                err = error;
            }

            expect(err).not.toBeNull();
            expect(err.message).toEqual('Hubspot record not found');
        });
    });

    describe('deleteInvoice()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('deletes invoice in hubspot', async () => {
            const expectedInvoiceId = 801;

            nock(HUBSPOT_URL).delete(`/objects/${BASE_CONFIG.invoiceObjectId}/${expectedInvoiceId}?hapikey=${BASE_CONFIG.apiKey}`).reply(204);

            let err = null;
            try {
                await hubspotClient.deleteInvoice(expectedInvoiceId);
            } catch (error) {
                err = error;
            }

            expect(err).toBeNull();
        });
    });

    // //
    // //    LEADS
    // //

    describe('createLead()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('creates new lead in hubspot', async () => {
            const expectedLeadId = '901';
            const leadData = {
                firstName: 'foo',
                lastName: 'bar',
                company: 'example company',
                email: 'foo@example.com',
                mobile: '888666999',
            };

            const expectedPostLeadData = {
                lifecyclestage: 'lead',
                firstname: 'foo',
                lastname: 'bar',
                company: 'example company',
                email: 'foo@example.com',
                mobilephone: '888666999',
            };

            nock(HUBSPOT_URL).post(`/objects/contacts?hapikey=${BASE_CONFIG.apiKey}`, {
                properties: expectedPostLeadData,
            }).reply(200, {
                id: expectedLeadId,
                properties: {
                    company: 'example company',
                    createdate: '2021-04-21T18:40:41.876Z',
                    email: 'foo@example.com',
                    firstname: 'foo',
                    hs_is_unworked: 'true',
                    hs_lifecyclestage_lead_date: '2021-04-21T18:40:41.876Z',
                    hs_marketable_status: 'false',
                    hs_marketable_until_renewal: 'false',
                    lastmodifieddate: '2021-04-21T18:40:41.876Z',
                    lastname: 'bar',
                    lifecyclestage: 'lead',
                    mobilephone: '888666999',
                },
                createdAt: '2021-04-21T18:40:41.876Z',
                updatedAt: '2021-04-21T18:40:41.876Z',
                archived: false,
            });

            const contactId = await hubspotClient.createLead(leadData);
            expect(contactId).toEqual(expectedLeadId);
        });
    });

    /*

    describe('createEmailEvent()', () => {
        it('create event works', async () => {
            const hubspotClient = new HubspotClient(BASE_CONFIG);
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

            const event = await hubspotClient.createEmailEvent(data);

            expect(event.id).toEqual(expectedReply.id);
        });
    });

    */
});
