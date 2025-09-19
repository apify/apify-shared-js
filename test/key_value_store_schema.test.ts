import { getKeyValueStoreSchemaValidator } from '@apify/json_schemas';

describe('key_value_store.json', () => {
    const validator = getKeyValueStoreSchemaValidator();

    describe('valid schemas', () => {
        it('should validate a minimal valid schema', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: ['application/json'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with key instead of keyPrefix', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        key: 'my-key',
                        contentTypes: ['application/json'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with jsonSchema', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                description: 'This is my key-value store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        description: 'This is my collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: ['application/json'],
                        jsonSchema: {
                            type: 'object',
                            properties: {
                                url: {
                                    type: 'string',
                                },
                                title: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with multiple collections', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    collection1: {
                        title: 'Collection 1',
                        keyPrefix: 'prefix1-',
                        contentTypes: ['application/json'],
                    },
                    collection2: {
                        title: 'Collection 2',
                        key: 'key2',
                        contentTypes: ['text/plain', 'image/jpeg'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });
    });

    describe('invalid schemas', () => {
        it('should not validate when missing required fields', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                // missing title
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: ['application/json'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'required',
                    params: expect.objectContaining({
                        missingProperty: 'title',
                    }),
                }),
            );
        });

        it('should not validate with invalid actorKeyValueStoreSchemaVersion', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 2, // invalid value
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: ['application/json'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'maximum',
                    params: expect.objectContaining({
                        comparison: '<=',
                        limit: 1,
                    }),
                }),
            );
        });

        it('should not validate when collection is missing both key and keyPrefix', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        // missing key and keyPrefix
                        contentTypes: ['application/json'],
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'oneOf',
                }),
            );
        });

        it('should not validate with empty contentTypes array', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: [], // empty array is invalid
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'minItems',
                    params: expect.objectContaining({
                        limit: 1,
                    }),
                }),
            );
        });

        it('should not validate with jsonSchema but without application/json contentType', () => {
            const schema = {
                actorKeyValueStoreSchemaVersion: 1,
                title: 'My Key-Value Store',
                collections: {
                    myCollection: {
                        title: 'My Collection',
                        keyPrefix: 'my-prefix-',
                        contentTypes: ['text/plain'], // not application/json
                        jsonSchema: {
                            type: 'object',
                            properties: {
                                url: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'const',
                }),
            );
        });
    });
});
