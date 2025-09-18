import { getOutputSchemaValidator } from '@apify/json_schemas';

describe('output.json', () => {
    const validator = getOutputSchemaValidator();

    describe('valid schemas', () => {
        it('should validate a minimal valid schema', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                properties: {
                    result: {
                        type: 'string',
                        template: 'Result: {{result}}',
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with title and description', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                title: 'My Output Schema',
                description: 'This is my output schema',
                properties: {
                    result: {
                        type: 'string',
                        title: 'Result',
                        description: 'The result of the operation',
                        template: 'Result: {{result}}',
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a schema with multiple properties', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                title: 'My Output Schema',
                properties: {
                    result: {
                        type: 'string',
                        title: 'Result',
                        template: 'Result: {{result}}',
                    },
                    status: {
                        type: 'string',
                        title: 'Status',
                        template: 'Status: {{status}}',
                    },
                    timestamp: {
                        type: 'string',
                        title: 'Timestamp',
                        template: 'Timestamp: {{timestamp}}',
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
                actorOutputSchemaVersion: 1,
                // missing properties
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'required',
                    params: expect.objectContaining({
                        missingProperty: 'properties',
                    }),
                }),
            );
        });

        it('should not validate with invalid actorOutputSchemaVersion', () => {
            const schema = {
                actorOutputSchemaVersion: 2, // invalid value
                properties: {
                    result: {
                        type: 'string',
                        template: 'Result: {{result}}',
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

        it('should not validate when property is missing required fields', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                properties: {
                    result: {
                        type: 'string',
                        // missing template
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'required',
                    params: expect.objectContaining({
                        missingProperty: 'template',
                    }),
                }),
            );
        });

        it('should not validate when property has invalid type', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                properties: {
                    result: {
                        type: 'integer', // must be 'string'
                        template: 'Result: {{result}}',
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'const',
                    params: expect.objectContaining({
                        allowedValue: 'string',
                    }),
                }),
            );
        });

        it('should not validate when property has additional properties', () => {
            const schema = {
                actorOutputSchemaVersion: 1,
                properties: {
                    result: {
                        type: 'string',
                        template: 'Result: {{result}}',
                        invalidProperty: 'value', // additional property not allowed
                    },
                },
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
