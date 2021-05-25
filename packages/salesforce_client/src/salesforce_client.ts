import _ from 'underscore';
import axios, { Method } from 'axios';
import { URLSearchParams } from 'url';

const AUTH_RETRY_ATTEMPTS = 5;
const ALLOWED_API_METHODS = ['GET', 'POST', 'PATCH', 'DELETE'];

// If customer does not have name anywhere, this is used as placeholder when creating user
export const MISSING_NAME_PLACEHOLDER = '[UNNAMED_CUSTOMER]';

const NOT_FOUND_MESSAGE = 'Salesforce record not found';

// When processing user from our database, we do not want to send everything to salesforce
// This schema server as a way to check types of data before sending them to salesforce
// and also as a filter which only allows the specified fields to be in the final
// object before it's sent to salesforce
const ALLOWED_USER_FIELDS = {
    apifyId: _.isString,
    createdAt: _.isDate,
    type: _.isString,
    annualRevenue: _.isNumber,
    emails: [
        {
            address: _.isString,
        },
    ],
    profile: {
        pictureUrl: _.isString,
        firstName: _.isString,
        lastName: _.isString,
    },
    subscription: {
        planId: _.isString,
        createdAt: _.isDate,
        priceQuote: {
            currencyCode: _.isString,
            planMonthlyPrice: _.isNumber,
            taxCountryCode: _.isString,
        },
        braintreeSubscriptionId: _.isString,
    },
    lastBillingInfo: {
        fullName: _.isString,
        company: _.isString,
        streetAddress: _.isString,
        city: _.isString,
        state: _.isString,
        postalCode: _.isString,
        customAddressText: _.isString,
        customInvoiceText: _.isString,
        countryCode: _.isString,
        euVatNo: _.isString,
        billingEmail: _.isString,
    },
    salesReps: [
        {
            userId: _.isString,
            engagementType: _.isString,
        },
    ],
};

// Same as above, but for invoice
const ALLOWED_INVOICE_FIELDS = {
    apifyId: _.isString,
    currencyIsoCode: _.isString,
    paymentStatus: _.isString,
    invoiceType: _.isString,
    userId: _.isString,
    issuedAt: _.isDate,
    paymentDueDays: _.isNumber,
    paidAt: _.isDate,
    description: _.isString,
    price: _.isNumber,
    priceBeforeTax: _.isNumber,
    priceUsd: _.isNumber,
    priceBeforeTaxUsd: _.isNumber,
    invoiceNumber: _.isString,
    isDraft: _.isBoolean,
    taxamoTransaction: {
        tax_country_code: _.isString,
    },
    canceledAt: _.isDate,
};

export interface Lead {
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    mobile: string;
}

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
        if (Array.isArray(allowedValues[key]) && !Array.isArray(data[key])) throw new Error(`Key ${key} must be an array`);

        // For arrays compare each value from the data with the value from first item in schema
        if (Array.isArray(allowedValues[key])) {
            const compareWith = allowedValues[key][0];
            const childrenAreOfPrimitiveType = typeof compareWith === 'function';

            const cleanedArray: any[] = [];
            data[key].forEach((value: unknown, index: number) => {
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

export interface SalesforceOptions {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
}

interface EmailEvent {
    whoId: string;
    subject: string;
    message: string;
}

export class SalesforceClient {
    auth: { token: string; instanceUrl: string; expiresAt: Date } | null = null;

    constructor(readonly config: SalesforceOptions) {
        if (!config) throw new Error('Cannot create salesforce client, config is missing');
        if (!config.tokenUrl) throw new Error('Cannot create salesforce client, config.tokenUrl is missing');
        if (!config.clientId) throw new Error('Cannot create salesforce client, config.clientId is missing');
        if (!config.clientSecret) throw new Error('Cannot create salesforce client, config.clientSecret is missing');
        if (!config.username) throw new Error('Cannot create salesforce client, config.username is missing');
        if (!config.password) throw new Error('Cannot create salesforce client, config.password is missing');
    }

    /**
     * Get's OATH token from salesforce and also the current instance url for further API
     * calls. Requires salesforce config field to be properly configured.
     */
    async getToken() {
        const now = Date.now();
        if (this.auth && (+this.auth.expiresAt - now) > 0) return;

        const query = new URLSearchParams([
            ['grant_type', 'password'],
            ['client_id', this.config.clientId],
            ['client_secret', this.config.clientSecret],
            ['username', this.config.username],
            ['password', this.config.password],
        ]);

        // https://test.salesforce.com/services/oauth2/token?grant_type=password&client_id=&client_secret=&username=&password=
        const { data } = await axios({
            url: `${this.config.tokenUrl}?${query.toString()}`,
            method: 'post',
        });

        this.auth = {
            token: data.access_token,
            instanceUrl: data.instance_url,
            // Tokens theoreticaly expire after 2 hours, but we refresh tokens after 1 hour to be safer
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        };
    }

    /**
     * Helper function for calling the Salesforce API, catches common errors with nice error messages, but keeps
     * other errors for debugging.
     */
    private async _callApi(endpointPath: string, method: Method, body: any = null, retry = 0): Promise<any> {
        if (!ALLOWED_API_METHODS.includes(method)) {
            throw new Error(`Method ${method} is not allowed in this client.`);
        }

        await this.getToken();
        try {
            const response = await axios({
                url: `${this.auth!.instanceUrl}${endpointPath}`,
                method,
                data: body,
                headers: {
                    Authorization: `Bearer ${this.auth!.token}`,
                },
            });

            return response.data;
        } catch (error) {
            const maybeStatus = error.response && error.response.status
                ? error.response && error.response.status
                : null;

            // NOTE: Multiple choices, it is not an error
            if (maybeStatus === 300) {
                return error.response.data;
            }

            // Catch authentication error this means that token expired and we need a new one
            if (maybeStatus === 401 && retry < AUTH_RETRY_ATTEMPTS) {
                this.auth = null;
                await this.getToken();
                return this._callApi(endpointPath, method, body, retry + 1);
            }
            if (maybeStatus === 404) throw new Error(NOT_FOUND_MESSAGE);
            if (maybeStatus === 409) throw new Error('Salesforce record already exists');
            if (error.response && error.response.data) {
                const { data } = error.response;
                const message = Array.isArray(data) ? data[0].message : data.message;
                throw new Error(message);
            }
            throw error;
        }
    }

    async _callSObjectApi(objectName: string, method: Method, body: any, retry = 0) {
        const endpointPath = `/services/data/v49.0/sobjects/${objectName}`;
        return this._callApi(endpointPath, method, body, retry);
    }

    /**
     * Helper function for calling the Salesforce API, catches common errors with nice error messages, but keeps
     * other errors for debugging.
     */
    async _callApexrestApi(endpoint: string, method: Method, body: any = null, retry = 0) {
        const endpointPath = `/services/apexrest/${endpoint}`;
        return this._callApi(endpointPath, method, body, retry);
    }

    /**
     * Attempts to get account data for provided userId.
     * @param userId ID of the user for we are looking up account in salesforce
     * @return Account data from sales force
     */
    async getAccount(userId: string): Promise<Record<string, any> | null> {
        try {
            return await this._callApexrestApi(`ApifyAccount/${userId}`, 'GET');
        } catch (error) {
            if (error.message === NOT_FOUND_MESSAGE) {
                return null;
            }

            throw error;
        }
    }

    /**
     * Transforms fields from user data object to not contain keys not usable in salesforce.
     * @param user user data to be transformed and cleaned up
     * @param isNew true if user will be created with the cleaned up data
     * @return cleaned up user data
     */
    _transformUser(user: Record<string, any>, isNew = false): Record<string, any> {
        const data = { ...user };
        if (data._id) {
            data.apifyId = user._id;
            delete data._id;
        }
        data.salesReps = (data.salesReps || []).map((salesRep: any) => ({
            userId: salesRep.userId,
            engagementType: salesRep.engagementType,
        }));

        if (data.admin && data.admin.yearlyRevenueUsd) {
            data.annualRevenue = data.admin.yearlyRevenueUsd;
        }

        // If we are creating user, then we need to check if they have correctly set profile name
        // if not, we need to somehow set it ourself, currently we use name from billing info
        // and if it does not exist, we try to use email and if it does not exist too,
        // then we use a placeholder name
        if (isNew && (!data.profile || !data.profile.lastName)) {
            if (!data.profile) data.profile = {};
            if (data.lastBillingInfo && data.lastBillingInfo.fullName) {
                const nameParts = data.lastBillingInfo.fullName.split(' ');
                data.profile.lastName = nameParts.pop();
                data.profile.firstName = nameParts.join(' ');
            } else if (data.emails && data.emails.length && data.emails[0].address) {
                data.profile.lastName = data.emails && data.emails.length && data.emails[0].address;
            } else {
                data.profile.lastName = MISSING_NAME_PLACEHOLDER;
            }
        }

        return cleanAndCompareWithSchema(data, ALLOWED_USER_FIELDS);
    }

    /**
     * Takes provided user object, cleans up the input and then uses it to create account in salesforce.
     * @param user Data to be used when creating account object
     * @return ID of the account in salesforce
     */
    async createAccount(user: Record<string, any>): Promise<string> {
        const data = this._transformUser(user, true);
        const response = await this._callApexrestApi('ApifyAccount', 'POST', data);

        return response.salesforceId;
    }

    /**
     * Updates salesforce object with provided userId. Modifier is cleaned up and fields are renamed before it's
     * sent to salesforce.
     * @param userId ID of the user whose account in salesforce we are modifying
     * @param modifier Data to be modified in the salesforce object
     */
    async updateAccount(userId: string, modifier: Record<string, any>): Promise<void> {
        const data = this._transformUser(modifier);
        await this._callApexrestApi('ApifyAccount', 'PATCH', { apifyId: userId, ...data });
    }

    /**
     * Deletes salesforce account object with provided user ID.
     * @param userId Id of the user whose account in salesforce we want to delete
     */
    async deleteAccount(userId: string): Promise<void> {
        await this._callApexrestApi(`ApifyAccount/${userId}`, 'DELETE');
    }

    /**
     * Attempts to get invoice data for provided apify invoiceId.
     * @param invoiceId Apify invoice ID used to lookup invoice in salesforce
     * @return invoice data from salesforce
     */
    async getInvoice(invoiceId: string): Promise<Record<string, any> | null> {
        try {
            return await this._callApexrestApi(`ApifyInvoice/${invoiceId}`, 'GET');
        } catch (error) {
            if (error.message === NOT_FOUND_MESSAGE) {
                return null;
            }

            throw error;
        }
    }

    /**
     * Transforms fields from invoice data object to not contain keys not usable in salesforce.
     * @param invoice invoice data to be transformed and cleaned up
     * @return cleaned up invoice data
     */
    _transformInvoice(invoice: Record<string, any>): Record<string, any> {
        const data = { ...invoice };

        if (data._id) {
            data.apifyId = data._id;
            delete data._id;
        }

        if (data.number) {
            data.invoiceNumber = data.number;
            delete data.number;
        }

        return cleanAndCompareWithSchema(data, ALLOWED_INVOICE_FIELDS);
    }

    /**
     * Takes provided invoice object, cleans up the input and then uses it to create invoice in salesforce.
     * @param invoice Data to be uploaded into salesforce.
     * @return ID of the invoice in salesforce
     */
    async createInvoice(invoice: Record<string, any>): Promise<string> {
        const data = this._transformInvoice(invoice);
        const response = await this._callApexrestApi('ApifyInvoice', 'POST', data);

        return response.salesforceId;
    }

    /**
     * Updates salesforce object with provided apify invoiceId. Modifier is cleaned up and fields are renamed before it's
     * sent to salesforce.
     * @param invoiceId Apify invoice ID used to lookup invoice to be updated in salesforce
     * @param modifier Data to be updated in salesforce
     */
    async updateInvoice(invoiceId: string, modifier: Record<string, any>): Promise<void> {
        const data = this._transformInvoice(modifier);
        await this._callApexrestApi('ApifyInvoice', 'PATCH', { apifyId: invoiceId, ...data });
    }

    /**
     * Deletes salesforce invoice object with provided ID (ours).
     * @param {String} invoiceId Apify invoice ID used to lookup invoice to be deleted from salesforce
     * @return undefined
     */
    async deleteInvoice(invoiceId: string) {
        await this._callApexrestApi(`ApifyInvoice/${invoiceId}`, 'DELETE');
    }

    /**
     * Get Lead by email
     */
    async getLeadByEmail(email: string): Promise<Lead | null> {
        const endpointPath = `/services/data/v49.0/sobjects/Lead/email/${encodeURIComponent(email)}`;
        try {
            let lead = await this._callApi(endpointPath, 'GET');
            // NOTE: It is possible that it returns multiple lead paths.
            // TODO: For now simply returns the first one.
            if (Array.isArray(lead)) {
                lead = await this._callApi(lead[0], 'GET');
            }
            return lead;
        } catch (err) {
            if (err.message === NOT_FOUND_MESSAGE) {
                return null;
            }
            throw err;
        }
    }

    /**
     * Create new lead
     */
    async createLead({ firstName, lastName, company, email, mobile }: Lead): Promise<any> {
        const body = {
            FirstName: firstName,
            LastName: lastName,
            Company: company,
            Email: email,
            Phone: mobile,
        };
        return this._callSObjectApi('Lead', 'POST', body);
    }

    /**
     * Create new email event
     */
    async createEmailEvent({ whoId, subject, message }: EmailEvent): Promise<any> {
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
}
