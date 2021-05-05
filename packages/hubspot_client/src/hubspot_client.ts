import _ from 'underscore';
import hubspot, { Client } from '@hubspot/api-client';

// If customer does not have name anywhere, this is used as placeholder when creating user
export const MISSING_NAME_PLACEHOLDER = '[UNNAMED_CUSTOMER]';

// How many times should the client attempt to retry the API call if it fails.
const API_CALL_RETRIES = 5;

// TODO: Handle errors

// When processing user from our database, we do not want to send everything to hubspot
// This schema servers as a way to check types of data before sending them to hubspot
// and also as a filter which only allows the specified fields to be in the final
// object before it's sent to hubspot
const ALLOWED_USER_FIELDS = {
    apify_id__c: _.isString,
    annualrevenue: _.isNumber,

    email: _.isString,
    hs_additional_emails: _.isString,

    subscription_plan: _.isString,
    subscription_price: _.isNumber,
    segment_paying_user: _.isString,

    firstname: _.isString,
    lastname: _.isString,

    company: _.isString,
    address: _.isString,
    city: _.isString,
    state: _.isString,
    zip: _.isString,
    country: _.isString,
    eu_vat_number__c: _.isString,
    billing_email__c: _.isString,

    lifecyclestage: _.isString,
};

// Same as above, but for invoice
const ALLOWED_INVOICE_FIELDS = {
    apify_id__c: _.isString,
    apify_user_id: _.isString,
    invoice_number: _.isString,
    invoice_type: _.isString,
    issue_date: _.isDate,
    price: _.isNumber,
    currency: _.isString,
    is_draft: _.isString,
    payment_due_days: _.isNumber,
    payment_status: _.isString,
    paid_date: _.isDate,
    invoice_description: _.isString,
    price_before_tax: _.isNumber,
    price_usd: _.isNumber,
    price_before_tax_usd: _.isNumber,
    tax_country_code: _.isString,
    cancel_date: _.isDate,
};

// TODO: The helper function can be replaced with JSON schema validator (AJV)
// but then we need another function which replaces dates with their stringified versions

/**
 * This helper function cleans our database objects of unnecessary fields and also compares data types to prevent
 * errors. Schemas which are checked against the objects are above. If the key in schema is object this function
 * does recursive check.
 * @param {Object} data Object from our database with all values
 * @param {Object} allowedValues Allowed keys and their datatypes
 * @return {Object} Object with only keys allowed in the schema
 */
export function cleanAndCompareWithSchema(data: any, allowedValues: any) {
    const cleanedData = {};
    Object.keys(allowedValues).forEach((key) => {
        // Skip schema fields that are not present in data
        if (typeof data[key] === 'undefined') return;
        // Save values set to null without typechecking
        if (data[key] === null) {
            // cleanedData[key] = null;
            return;
        }

        // For primitive types we check if value is of correct type and if not we throw error
        if (typeof allowedValues[key] === 'function') {
            if (!allowedValues[key](data[key])) throw new Error(`Key ${key} is of incorrect type`);
            // This ensures that we know how the date will be formated
            cleanedData[key] = data[key] instanceof Date ? JSON.stringify(data[key]).replace(/"/g, '') : data[key];
            return;
        }

        // For arrays we check if key in data is also an array and throw error if not
        if (_.isArray(allowedValues[key]) && !_.isArray(data[key])) throw new Error(`Key ${key} must be an array`);

        // For arrays compare each value from the data with the value from first item in schema
        if (_.isArray(allowedValues[key])) {
            const compareWith = allowedValues[key][0];
            const childrenAreOfPrimitiveType = typeof compareWith === 'function';

            const cleanedArray: any[] = [];
            data[key].forEach((value: any, index: number) => {
                if (childrenAreOfPrimitiveType) {
                    if (!compareWith(value)) throw new Error(`Key ${key}[${index}] is of incorrect type`);
                    cleanedArray.push(value);
                    return;
                }
                if (!_.isObject(value)) throw new Error(`Key ${key}[${index}] is of incorrect type`);
                cleanedArray.push(cleanAndCompareWithSchema(value, compareWith));
            });
            cleanedData[key] = cleanedArray;
            return;
        }

        // For objects we check if key in data is also an object and throw error if not
        if (_.isObject(allowedValues[key]) && !_.isObject(data[key])) throw new Error(`Key ${key} must be an object`);

        // Do a recursive clearing for objects
        if (_.isObject(allowedValues[key])) {
            cleanedData[key] = cleanAndCompareWithSchema(data[key], allowedValues[key]);
        }
    });
    return cleanedData;
}

export interface HubspotOptions {
    apiKey: string;
    invoiceObjectId: string;
    invoiceToContactAssociation: string;
}

export interface Lead {
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    mobile: string;
}

export class HubspotClient {
    private readonly client: Client;

    constructor(readonly config: HubspotOptions, injectedHubspotClient = null) {
        if (!config) throw new Error('Cannot create hubspot client, config is missing');
        if (!config.apiKey) throw new Error('Cannot create hubspot client, config.apiKey is missing');
        if (!config.invoiceObjectId) throw new Error('Cannot create hubspot client, config.invoiceObjectId is missing');
        if (!config.invoiceToContactAssociation) throw new Error('Cannot create hubspot client, config.invoiceToContactAssociation is missing');

        const ClientClass = injectedHubspotClient || Client;
        this.client = new ClientClass({
            apiKey: config.apiKey,
            numberOfApiCallRetries: API_CALL_RETRIES,
        });
    }

    /**
     * Attempts to use hubspot API to search contacts by user primary email.
     * If contact is found this function returns it. If it's not found, this function returns null.
     *
     * @param email Primary email of the user
     */
    async searchContactByEmail(email: string): Promise<hubspot.contactsModels.SimplePublicObject | null> {
        if (!email) throw new Error('Arg "email" is required in HubspotClient.searchContactByEmail');

        const filter = {
            propertyName: 'email',
            operator: 'EQ',
            value: email,
        };
        const publicObjectSearchRequest = {
            filterGroups: [{
                filters: [filter],
            }],
            sorts: [],
            properties: [],
            limit: 1,
            after: 0,
        } as any;
        const response = await this.client.crm.contacts.searchApi.doSearch(publicObjectSearchRequest);
        const { body } = response;
        return body && body.results && body.results.length ? body.results[0] : null;
    }

    /**
     * Attempts to use hubspot API to search contacts by Apify ID property.
     * If contact is found this function returns it. If it's not found, this function returns null.
     *
     * @param apifyUserId ID of the user document from mongodb
     * @returns {SimpleHubspotContact|null}
     */
    async searchContactByApifyUserId(apifyUserId: string): Promise<hubspot.contactsModels.SimplePublicObject | null> {
        if (!apifyUserId) throw new Error('Arg "apifyUserId" is required in HubspotClient.searchContactByApifyUserId');

        const filter = {
            propertyName: 'apify_id__c',
            operator: 'EQ',
            value: apifyUserId,
        };
        const publicObjectSearchRequest = {
            filterGroups: [{
                filters: [filter],
            }],
            sorts: [],
            properties: [],
            limit: 1,
            after: 0,
        } as any;
        const response = await this.client.crm.contacts.searchApi.doSearch(publicObjectSearchRequest);
        const { body } = response;
        return body && body.results && body.results.length ? body.results[0] : null;
    }

    /**
     * Attempts to find hubspot Contact ID for the provided user in hubspot.
     * It checks if there is user in hubspot with apify ID set to the same value as provided user.
     * And lastly it checks if there is user in hubspot with primary email set to the same value as provided user.
     *
     * @param {Object} apifyUser Document from mongodb users collection
     * @returns {String|null}
     */
    async lookupContactId(apifyUser: any) {
        let maybeHubspotContact = await this.searchContactByApifyUserId(apifyUser._id);
        if (maybeHubspotContact) return maybeHubspotContact.id;

        // Primary email is last email of of the user
        const primaryEmail = apifyUser.emails && apifyUser.emails.length ? apifyUser.emails[apifyUser.emails.length - 1] : null;
        if (!primaryEmail) return null;

        maybeHubspotContact = await this.searchContactByEmail(primaryEmail.address);
        return maybeHubspotContact ? maybeHubspotContact.id : null;
    }

    /**
     * Attempts to get account data for provided userId.
     *
     * @param hubspotContactId ID of the user for who we are looking up account in hubspot
     * @return {SimpleHubspotContact} Contact data from sales force
     */
    async getContact(hubspotContactId: string) {
        try {
            const response = await this.client.crm.contacts.basicApi.getById(hubspotContactId);
            return response.body;
        } catch (error) {
            if (error.statusCode && error.statusCode === 404) return null;
            throw error;
        }
    }

    /**
     * Transforms fields from user data object to not contain keys not usable in hubspot.
     *
     * @param {Object} user user data to be transformed and cleaned up
     * @param {Boolean} isNew true if user will be created with the cleaned up data
     * @return {Object} cleaned up user data
     */
    _transformUser(user: any, isNew = false) {
        const data = {} as any;

        if (user._id) data.apify_id__c = user._id;

        // Transform primary email
        if (user.emails) {
            const emails = [...user.emails];
            const primaryEmail = emails.pop();
            if (primaryEmail) data.email = primaryEmail.address;
            // TODO: Bellow cannot be used since hs_additional_emails is readonly, haven't found any way to add more emails through API :(
            // if (user.emails.length) data.hs_additional_emails = emails.map((email) => email.address).join(';');
        }

        if (user.admin && user.admin.yearlyRevenueUsd) {
            data.annualrevenue = user.admin.yearlyRevenueUsd;
        }

        if (isNew) {
            data.lifecyclestage = 'customer';

            if (user.profile) {
                data.firstname = user.profile.firstName ? user.profile.firstName : '';
                data.lastname = user.profile.lastName ? user.profile.lastName : '';
            }

            if (!data.lastname && user.lastBillingInfo && user.lastBillingInfo.fullName) {
                const nameParts = user.lastBillingInfo.fullName.split(' ');
                data.lastname = nameParts.pop();
                data.firstname = nameParts.join(' ');
            }

            if (!data.lastname) data.lastname = MISSING_NAME_PLACEHOLDER;
        }

        const billingInfoConversion = {
            company: 'company',
            streetAddress: 'address',
            city: 'city',
            state: 'state',
            postalCode: 'zip',
            // TODO: Country code to country
            countryCode: 'country',
            euVatNo: 'eu_vat_number__c',
            billingEmail: 'billing_email__c',
        };

        if (user.lastBillingInfo) {
            Object.keys(billingInfoConversion).forEach((key) => {
                const hubspotKey = billingInfoConversion[key];
                if (!user.lastBillingInfo[key]) {
                    data[hubspotKey] = '';
                    return;
                }
                data[hubspotKey] = user.lastBillingInfo[key];
            });
        }

        data.subscription_plan = (user.subscription && user.subscription.plan) ? user.subscription.plan.id : '';
        data.subscription_price = (user.subscription && user.subscription.plan) ? user.subscription.plan.monthlyBasePriceUsd : 0;
        data.segment_paying_user = (!!data.subscription_plan || (user.admin && user.admin.isPayingCustomer)) ? 'true' : 'false';

        const cleanedObject = cleanAndCompareWithSchema(data, ALLOWED_USER_FIELDS);
        return cleanedObject;
    }

    /**
     * Attempts to assign owner to hubspot contacts. For this we use provided email of sales rep.
     * If owner in hubspot with provided email does not exist. We do not create the connection.
     * If owner does exist. Update the contact with the provided owner ID
     *
     * @param contactId ID of the contact in hubspot
     * @param salesRepEmail Email of the main sales representative
     */
    async connectOwnerWithContact(contactId: string, salesRepEmail: string): Promise<void> {
        const response = await this.client.crm.owners.defaultApi.getPage(salesRepEmail);
        const { body } = response;
        const ownerId = body && body.results && body.results.length ? body.results[0].id : null;
        if (!ownerId) return;
        await this.client.crm.contacts.basicApi.update(contactId, {
            properties: {
                hubspot_owner_id: ownerId,
            },
        });
    }

    /**
     * Takes provided user object, cleans up the input and then uses it to create account in hubspot.
     *
     * @param {Object} user Data to be used when creating account object
     * @return {String} ID of the account in hubspot
     */
    async createContact(user: any) {
        const data = this._transformUser(user, true);
        const response = await this.client.crm.contacts.basicApi.create({
            properties: data,
        });
        return response.body.id;
    }

    /**
     * Updates hubspot contact with provided hubspot ID. Modifier is cleaned up and fields are renamed before it's
     * sent to hubspot.
     *
     * @param hubspotContactId ID of the contact in hubspot we are modifying
     * @param {Object} modifier Data to be modified in the hubspot contact
     * @return undefined
     */
    async updateContact(hubspotContactId: number | string, modifier: any) {
        try {
            const data = this._transformUser(modifier);
            await this.client.crm.contacts.basicApi.update(`${hubspotContactId}`, {
                properties: data,
            });
        } catch (error) {
            if (error.statusCode && error.statusCode === 404) throw new Error('Hubspot record not found');
            throw error;
        }
    }

    /**
     * Deletes hubspot contact object with provided user ID.
     *
     * @param hubspotContactId Id of the user whose contact in hubspot we want to delete
     * @return undefined
     */
    async deleteContact(hubspotContactId: number | string) {
        await this.client.crm.contacts.basicApi.archive(`${hubspotContactId}`);
    }

    /**
     * Attempts to use hubspot API to search invoices by the invoice number.
     * If invoice is found this function returns it. If it's not found, this function returns null.
     *
     * @param invoiceNumber Number of the invoice
     * @returns {SimpleHubspotInvoice|null}
     */
    async searchInvoiceByNumber(invoiceNumber: string) {
        if (!invoiceNumber) throw new Error('Arg "invoiceNumber" is required in HubspotClient.searchInvoiceByNumber');

        const filter = {
            propertyName: 'invoice_number',
            operator: 'EQ' as any,
            value: invoiceNumber,
        };
        const publicObjectSearchRequest = {
            filterGroups: [{
                filters: [filter],
            }],
            sorts: [],
            properties: [],
            limit: 1,
            after: 0,
        };
        const response = await this.client.crm.objects.searchApi.search(this.config.invoiceObjectId, publicObjectSearchRequest);
        const { body } = response;
        return body && body.results && body.results.length ? body.results[0] : null;
    }

    /**
     * Attempts to use hubspot API to search invoices by Apify ID property.
     * If invoice is found this function returns it. If it's not found, this function returns null.
     *
     * @param apifyInvoiceId ID of the invoice document from mongodb
     */
    async searchInvoiceByApifyInvoiceId(apifyInvoiceId: string): Promise<hubspot.contactsModels.SimplePublicObject | null> {
        if (!apifyInvoiceId) throw new Error('Arg "apifyInvoiceId" is required in HubspotClient.searchInvoiceByApifyInvoiceId');

        const filter = {
            propertyName: 'apify_id__c',
            operator: 'EQ' as any,
            value: apifyInvoiceId,
        };
        const publicObjectSearchRequest = {
            filterGroups: [{
                filters: [filter],
            }],
            sorts: [],
            properties: [],
            limit: 1,
            after: 0,
        };
        const response = await this.client.crm.objects.searchApi.search(this.config.invoiceObjectId, publicObjectSearchRequest);
        const { body } = response;
        return body && body.results && body.results.length ? body.results[0] : null;
    }

    /**
     * Attempts to find invoice in hubspot.
     * First it checks if there is an invoice in hubspot with apify ID set to the same value.
     * And then it checks if there is an invoice in hubspot with number set to the same value.
     *
     * @param {Object} invoice Document from mongodb invoices collection
     * @returns {String|null}
     */
    async lookupInvoiceId(invoice: { _id: string; number: string }) {
        let maybeHubspotInvoice;
        if (invoice._id) maybeHubspotInvoice = await this.searchInvoiceByApifyInvoiceId(invoice._id);
        if (maybeHubspotInvoice) return maybeHubspotInvoice.id;
        maybeHubspotInvoice = await this.searchInvoiceByNumber(invoice.number);
        return maybeHubspotInvoice ? maybeHubspotInvoice.id : null;
    }

    /**
     * Attempts to get invoice data for provided apify invoiceId.
     *
     * @param hubspotInvoiceId Hubspot invoice ID used to load data for the invoice
     * @return {SimpleHubspotInvoice} invoice data from hubspot
     */
    async getInvoice(hubspotInvoiceId: string): Promise<hubspot.contactsModels.SimplePublicObject | null> {
        try {
            const response = await this.client.crm.objects.basicApi.getById(this.config.invoiceObjectId, hubspotInvoiceId);
            return response.body;
        } catch (error) {
            if (error.statusCode && error.statusCode === 404) return null;
            throw error;
        }
    }

    /**
     * Transforms fields from invoice data object to not contain keys not usable in hubspot.
     *
     * @param {Object} invoice invoice data to be transformed and cleaned up
     * @return {Object} cleaned up invoice data
     */
    _transformInvoice(invoice: any) {
        const data = {} as any;

        const apifyInvoiceToHubspotInvoice = {
            _id: 'apify_id__c',
            userId: 'apify_user_id',
            currencyIsoCode: 'currency',
            paymentStatus: 'payment_status',
            invoiceType: 'invoice_type',
            issuedAt: 'issue_date',
            paymentDueDays: 'payment_due_days',
            paidAt: 'paid_date',
            description: 'invoice_description',
            price: 'price',
            priceBeforeTax: 'price_before_tax',
            priceUsd: 'price_usd',
            priceBeforeTaxUsd: 'price_before_tax_usd',
            number: 'invoice_number',
            isDraft: 'is_draft',
            canceledAt: 'cancel_date',
        };

        Object.keys(apifyInvoiceToHubspotInvoice).forEach((apifyInvoiceKey) => {
            if (typeof invoice[apifyInvoiceKey] === 'undefined') return;
            const hubspotInvoiceKey = apifyInvoiceToHubspotInvoice[apifyInvoiceKey];
            data[hubspotInvoiceKey] = invoice[apifyInvoiceKey];
        });

        // Special case, tax country code is in sub-document
        if (invoice.taxamoTransaction && invoice.taxamoTransaction.tax_country_code) {
            data.tax_country_code = invoice.taxamoTransaction.tax_country_code;
        }

        // Hubspot does not have booleans, it has only enumerations and this is how boolean is done...
        data.is_draft = data.is_draft ? 'true' : 'false';

        const cleanedObject = cleanAndCompareWithSchema(data, ALLOWED_INVOICE_FIELDS);
        return cleanedObject;
    }

    /**
     * Takes provided invoice object, cleans up the input and then uses it to create invoice in hubspot.
     *
     * @param {Object} invoice Data to be uploaded into hubspot.
     * @param hubspotContactId ID of the hubspot contact who we will associate the invoice to
     * @return {String} ID of the invoice in hubspot
     */
    async createInvoice(invoice: any, hubspotContactId: string) {
        const data = this._transformInvoice(invoice);

        // Make sure contact exists
        const contact = await this.getContact(hubspotContactId);
        if (!contact) throw new Error(`Hubspot with contact ID ${hubspotContactId} does not exist`);

        // Create new invoice
        const response = await this.client.crm.objects.basicApi.create(this.config.invoiceObjectId, {
            properties: data,
        });
        const hubspotInvoiceId = response.body.id;

        // Connect it to contact
        await this.client.crm.objects.associationsApi.create(
            this.config.invoiceObjectId, hubspotInvoiceId, 'contact', hubspotContactId,
            this.config.invoiceToContactAssociation,
        );

        return hubspotInvoiceId;
    }

    /**
     * Updates hubspot object for the specified ID. Modifier is cleaned up and fields are renamed before it's
     * sent to hubspot.
     *
     * @param hubspotInvoiceId ID of the invoice in hubspot
     * @param {Object} modifier Data to be updated in hubspot
     * @return {void}
     */
    async updateInvoice(hubspotInvoiceId: number | string, modifier: any) {
        try {
            const data = this._transformInvoice(modifier);
            await this.client.crm.objects.basicApi.update(this.config.invoiceObjectId, `${hubspotInvoiceId}`, {
                properties: data,
            });
        } catch (error) {
            if (error.statusCode && error.statusCode === 404) throw new Error('Hubspot record not found');
            throw error;
        }
    }

    /**
     * Deletes hubspot invoice object with provided ID.
     *
     * @param hubspotInvoiceId ID of the invoice in hubspot
     * @return {void}
     */
    async deleteInvoice(hubspotInvoiceId: number | string) {
        await this.client.crm.objects.basicApi.archive(this.config.invoiceObjectId, `${hubspotInvoiceId}`);
    }

    async getLeadByEmail(email: string): Promise<hubspot.contactsModels.SimplePublicObject | null> {
        // TODO: Maybe this can also filter the results by contact lifecyclestage to get only leads and not contacts too
        return this.searchContactByEmail(email);
    }

    /**
     * Create new lead
     */
    async createLead({ firstName, lastName, company, email, mobile }: Lead) {
        const data = {
            // Contacts and leads are the same thing in hubspot, only stage is different
            lifecyclestage: 'lead',
            firstname: firstName,
            lastname: lastName,
            company,
            email,
            mobilephone: mobile,
        };

        const response = await this.client.crm.contacts.basicApi.create({
            properties: data,
        });
        return response.body.id;
    }

    /*
    TODO: Not sure how this is used and if there is any equivalent. Closest I found is "conversation" or "ticket"
    which refers to request received from customer. If that is the case then it has "subject" and "content" fields
    and after it's created it needs to be associated with the customer.
    async createEmailEvent({ contactId, subject, message }) {
        const body = {
            WhoId: whoId,
            Subject: subject,
            Description: message,
            Type: 'Email',
            DurationInMinutes: 1,
            ActivityDateTime: new Date().toISOString(),
        };
        return this._callSObjectApi('Event', 'POST', body);
    }
    */
}
