import { getDatasetSchemaValidator } from '@apify/json_schemas';

describe('dataset.json', () => {
    const validator = getDatasetSchemaValidator();

    describe('valid schemas', () => {
        it('should validate a schema with fields', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                description: 'This is my dataset',
                fields: {
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
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with views', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                description: 'This is my dataset',
                views: {
                    default: {
                        title: 'Default View',
                        description: 'Default view of the dataset',
                        transformation: {
                            fields: ['url', 'title'],
                        },
                    },
                    filtered: {
                        title: 'Filtered View',
                        description: 'Filtered view of the dataset',
                        transformation: {
                            fields: ['url'],
                            omit: ['title'],
                            clean: true,
                        },
                    },
                    table: {
                        title: 'Table View',
                        display: {
                            component: 'table',
                            options: {
                                sortable: true,
                            },
                        },
                    },
                    grid: {
                        title: 'Grid View',
                        display: {
                            component: 'grid',
                            properties: {
                                columns: 3,
                            },
                        },
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with both fields and views', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                description: 'This is my dataset',
                fields: {
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
                views: {
                    default: {
                        title: 'Default View',
                        transformation: {
                            fields: ['url', 'title'],
                        },
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
                title: 'My Dataset',
                description: 'This is my dataset',
                // missing actorSpecification and fields/views
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'required',
                    params: expect.objectContaining({
                        missingProperty: 'actorSpecification',
                    }),
                }),
            );
        });

        it('should not validate with invalid actorSpecification', () => {
            const schema = {
                actorSpecification: 2, // invalid value
                title: 'My Dataset',
                fields: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                        },
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

        it('should not validate with invalid view transformation', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                views: {
                    default: {
                        title: 'Default View',
                        transformation: {
                            fields: [], // empty fields array is invalid
                        },
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

        it('should not validate with invalid view display component', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                views: {
                    default: {
                        title: 'Default View',
                        display: {
                            component: 'invalid-component', // must be 'table' or 'grid'
                        },
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'enum',
                    params: expect.objectContaining({
                        allowedValues: ['table', 'grid'],
                    }),
                }),
            );
        });

        it('should not validate with additional properties', () => {
            const schema = {
                actorSpecification: 1,
                title: 'My Dataset',
                fields: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                        },
                    },
                },
                invalidProperty: 'value', // additional property not allowed
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'additionalProperties',
                    params: expect.objectContaining({
                        additionalProperty: 'invalidProperty',
                    }),
                }),
            );
        });
    });
});
