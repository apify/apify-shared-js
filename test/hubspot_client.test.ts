/* eslint-disable no-underscore-dangle, no-unused-expressions */
import _ from 'underscore';
import nock from 'nock';

import { HubspotClient, cleanAndCompareWithSchema, MISSING_NAME_PLACEHOLDER } from '@apify/hubspot_client';

const HUBSPOT_URL = 'https://api.hubapi.com/crm/v3';

const BASE_CONFIG = {
    // Use env variable in case of debugging tests so that you won't accidentally commit the API key!!!
    apiKey: process.env.HUBSPOT_API_KEY || 'dummy-api-key',
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
                customer_segment: '',
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
                customer_segment: '',
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
                customer_segment: '',
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
                }, {
                    filters: [{
                        propertyName: 'hs_additional_emails',
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
                }, {
                    filters: [{
                        propertyName: 'hs_additional_emails',
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
            } catch (_error) {
                const error = _error as Error;
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
            } catch (_error) {
                const error = _error as Error;
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
                }, {
                    filters: [{
                        propertyName: 'hs_additional_emails',
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
                }, {
                    filters: [{
                        propertyName: 'hs_additional_emails',
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
                kanbanUrl: 'https://console-securitybyobscurity.apify.com/orders/iJuo3Rvyg5LTbsB6F',
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
                    apify_kanban_link_: 'https://console-securitybyobscurity.apify.com/orders/iJuo3Rvyg5LTbsB6F',
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

            let err: Error = null!;
            try {
                await hubspotClient.updateContact(contactId, userData);
            } catch (error) {
                err = error as Error;
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
            } catch (_error) {
                const error = _error as Error;
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
            } catch (_error) {
                const error = _error as Error;
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
            } catch (_error) {
                const error = _error as Error;
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

            let err: Error = null!;
            try {
                await hubspotClient.updateInvoice(expectedInvoiceId, invoiceData);
            } catch (error) {
                err = error as Error;
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

    // //
    // //    COMPANIES
    // //
    describe('searchCompanyByName()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('returns company info', async () => {
            const name = 'Apify';
            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'name',
                        operator: 'EQ',
                        value: name,
                    }],
                }],
                sorts: [],
                properties: [],
                limit: 1,
                after: 0,
            };

            const companyId = '5695300523';
            const networkReply = {
                total: 1,
                results: [{
                    id: companyId,
                    properties: {
                        createdate: '2021-03-23T18:03:33.781Z',
                        domain: 'apify.com',
                        hs_lastmodifieddate: '2021-07-25T14:59:54.176Z',
                        hs_object_id: companyId,
                        name,
                    },
                    createdAt: '2021-03-23T18:03:33.781Z',
                    updatedAt: '2021-07-25T14:59:54.176Z',
                    associations: undefined,
                    archived: false,
                    archivedAt: undefined,
                }],
            };

            nock(HUBSPOT_URL, {}).post(`/objects/companies/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchCompanyByName(name);

            expect(data!.id).toEqual(companyId);
            expect(data!.properties).toEqual(networkReply.results[0].properties);
        });
        it('returns null when nothing is found', async () => {
            const name = 'FOOOOO';

            const expectedPostData = {
                filterGroups: [{
                    filters: [{
                        propertyName: 'name',
                        operator: 'EQ',
                        value: name,
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

            nock(HUBSPOT_URL, {}).post(`/objects/companies/search?hapikey=${BASE_CONFIG.apiKey}`, expectedPostData).reply(200, networkReply);

            const data = await hubspotClient.searchCompanyByName(name);
            expect(data).toBeNull();
        });
        it('throws without company name', async () => {
            try {
                await hubspotClient.searchCompanyByName('');
                // we should not get here
                expect(true).toEqual(false);
            } catch (_error) {
                const error = _error as Error;
                expect(error.message).toEqual('Arg "name" is required in HubspotClient.searchCompanyByName');
            }
        });
    });

    describe('createCompany()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('creates new company and return its id', async () => {
            const companyData = {
                name: 'TESTING COMPANY',
                domain: 'example.com',
                industry: 'Information Technology and Services',
                city: 'Prague',
                country: 'Czech Republic',
                description: 'Some long\nDescription',
                numberOfEmployees: 2,
                zip: '11100',
                address: 'test',
                foundedYear: '2015',
                state: '',
                annualRevenue: 150,
                website: '',
                aboutUs: 'Best company in a world',
            };

            const companyId = '6651071273';
            const networkReply = {
                id: companyId,
                properties: {
                    about_us: 'Best company in a world',
                    annualrevenue: '150',
                    city: 'Prague',
                    country: 'Czech Republic',
                    createdate: '2021-07-29T06:39:34.605Z',
                    description: 'Some long\nDescription',
                    domain: 'example.com',
                    founded_year: '2015',
                    hs_lastmodifieddate: '2021-07-29T06:39:34.605Z',
                    hs_object_id: '6651071273',
                    industry: 'Information Technology and Services',
                    name: 'TESTING COMPANY',
                    numberofemployees: '2',
                    state: null,
                    website: 'example.com',
                    zip: '11100',
                },
                createdAt: '2021-07-29T06:39:34.605Z',
                updatedAt: '2021-07-29T06:39:34.605Z',
                associations: undefined,
                archived: false,
                archivedAt: undefined,
            };

            const transformedData = hubspotClient._transformCompany(companyData);
            nock(HUBSPOT_URL).post(`/objects/companies?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData }).reply(200, networkReply);

            const createdCompanyId = await hubspotClient.createCompany(companyData);
            expect(createdCompanyId).toEqual(networkReply.id);
        });
    });

    describe('updateCompany()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('updates company', async () => {
            const modifier = {
                numberOfEmployees: 10,
                annualRevenue: 15000,
            };

            const companyId = '6651071273';
            const networkReply = {
                id: '6651071273',
                properties: {
                    annualrevenue: '15000',
                    createdate: '2021-07-29T06:39:34.605Z',
                    hs_lastmodifieddate: '2021-07-29T06:41:30.879Z',
                    hs_object_id: '6651071273',
                    numberofemployees: '10',
                },
                createdAt: '2021-07-29T06:39:34.605Z',
                updatedAt: '2021-07-29T06:41:30.879Z',
                associations: undefined,
                archived: false,
                archivedAt: undefined,
            };

            const transformedData = hubspotClient._transformCompany(modifier);
            nock(HUBSPOT_URL).patch(`/objects/companies/${companyId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(200, networkReply);

            let err = null;
            try {
                await hubspotClient.updateCompany(companyId, modifier);
            } catch (error) {
                err = error;
            }
            expect(err).toBeNull();
        });
        it('correctly handles not found error', async () => {
            const modifier = {
                numberOfEmployees: 10,
                annualRevenue: 15000,
            };

            const companyId = 665107127999;

            const networkReply = {
                status: 'error',
                message: 'resource not found',
                correlationId: 'ce66224e-809e-4161-ae99-e8cd86905b97',
            };

            const transformedData = hubspotClient._transformUser(modifier);
            nock(HUBSPOT_URL)
                .patch(`/objects/companies/${companyId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: transformedData })
                .reply(404, networkReply);

            let err: Error = null!;
            try {
                await hubspotClient.updateCompany(companyId, modifier);
            } catch (error) {
                err = error as Error;
            }

            expect(err).not.toBeNull();
            expect(err.message).toEqual('Hubspot record not found');
        });
    });

    describe('associateContactWithCompany', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('creates association', async () => {
            const companyId = 6651071273;
            const contactId = 6251;

            const networkReply = {
                id: '6651071273',
                properties: {
                    createdate: '2021-07-29T06:39:34.605Z',
                    hs_lastmodifieddate: '2021-07-29T06:41:30.879Z',
                    hs_object_id: '6651071273',
                },
                createdAt: '2021-07-29T06:39:34.605Z',
                updatedAt: '2021-07-29T06:41:30.879Z',
                associations: {
                    contacts: {
                        results: [
                            {
                                id: '6251',
                                type: 'contact_to_company',
                            },
                        ],
                    },
                },
                archived: false,
                archivedAt: undefined,
            };
            const path = `/objects/companies/${companyId}/associations/contacts/${contactId}/company_to_contact?hapikey=${BASE_CONFIG.apiKey}`;
            nock(HUBSPOT_URL).put(path).reply(200, networkReply);

            let err = null;
            try {
                await hubspotClient.associateContactWithCompany(contactId, companyId);
            } catch (e) {
                err = e;
            }

            expect(err).toBeNull();
        });
        it('correctly handles not found error', async () => {
            const companyId = 6651071273;
            const contactId = 666251;

            const networkReply = {
                status: 'error',
                message: `No contact with ID ${contactId} exists`,
                correlationId: '715247cb-58d0-4bc9-b965-336fb1f7c03e',
                context: {
                    objectType: ['contact'],
                    id: [`${contactId}`],
                },
                category: 'OBJECT_NOT_FOUND',
                subCategory: 'crm.associations.TO_OBJECT_NOT_FOUND',
            };

            const path = `/objects/companies/${companyId}/associations/contacts/${contactId}/company_to_contact?hapikey=${BASE_CONFIG.apiKey}`;
            nock(HUBSPOT_URL).put(path).reply(404, networkReply);

            let err: Error = null!;
            try {
                await hubspotClient.associateContactWithCompany(contactId, companyId);
            } catch (error) {
                err = error as Error;
            }

            expect(err).not.toBeNull();
            expect(err.message).toEqual('Hubspot record not found');
        });
    });

    describe('updateDeal()', () => {
        const hubspotClient = new HubspotClient(BASE_CONFIG);
        it('update deal works', async () => {
            const dealId = '7794475337';
            const modifier = {
                amount: '250',
            };

            const networkReply = {
                id: '7794475337',
                properties: {
                    amount: '250',
                    amount_in_home_currency: '250',
                    closedate: '2022-02-28T09:32:16.781Z',
                    createdate: '2022-02-02T09:32:16.781Z',
                    days_to_close: '26',
                    dealstage: 'ef8031bf-96e6-4db8-a8ad-176582c59f71',
                    hs_all_owner_ids: '119818406',
                    hs_closed_amount: '0',
                    hs_closed_amount_in_home_currency: '0',
                    hs_created_by_user_id: '27227679',
                    hs_deal_stage_probability: '0.1000000000000000055511151231257827021181583404541015625',
                    hs_deal_stage_probability_shadow: '0.1000000000000000055511151231257827021181583404541015625',
                    hs_forecast_amount: '250',
                    hs_is_closed: 'false',
                    hs_is_closed_won: 'false',
                    hs_lastmodifieddate: '2022-02-02T10:16:07.597Z',
                    hs_object_id: '7794475337',
                    hs_projected_amount: '25.0000000000000013877787807814456755295395851135253906250',
                    hs_projected_amount_in_home_currency: '25.0000000000000013877787807814456755295395851135253906250',
                    hs_updated_by_user_id: '27227679',
                    hs_user_ids_of_all_owners: '27227679',
                    hubspot_owner_assigneddate: '2022-02-02T09:32:35.096Z',
                    hubspot_owner_id: '119818406',
                    pipeline: '05b8dec2-0ece-4d2c-b37e-13c609b5b3f5',
                },
                createdAt: '2022-02-02T09:32:16.781Z',
                updatedAt: '2022-02-02T10:16:07.597Z',
                archived: false,
                archivedAt: undefined,
            };

            nock(HUBSPOT_URL).patch(`/objects/deals/${dealId}?hapikey=${BASE_CONFIG.apiKey}`, { properties: modifier })
                .reply(200, networkReply);

            let err: Error = null!;
            try {
                await hubspotClient.updateDeal(dealId, modifier);
            } catch (error) {
                err = error as Error;
            }
            expect(err).toBeNull();
        });
        it('correctly handles not found error', async () => {
            const dealId = '111222';
            const modifier = {
                amount: '250',
            };

            const networkReply = {
                status: 'error',
                message: 'resource not found',
                correlationId: '1a88e0d3-5126-49b6-8618-10af5b34f1ed',
            };

            const path = `/objects/deals/${dealId}?hapikey=${BASE_CONFIG.apiKey}`;
            nock(HUBSPOT_URL).patch(path, { properties: modifier }).reply(404, networkReply);

            let err: Error = null!;
            try {
                await hubspotClient.updateDeal(dealId, modifier);
            } catch (error) {
                err = error as Error;
            }

            expect(err).not.toBeNull();
            expect(err.message).toEqual('Hubspot record not found');
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
