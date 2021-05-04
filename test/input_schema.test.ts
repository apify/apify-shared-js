import Ajv from 'ajv';
import { validateInputSchema } from '@apify/input_schema';

describe('input_schema.json', () => {
    const validator = new Ajv();

    describe('type any', () => {
        it('should not throw on valid schema', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            };

            validateInputSchema(validator, schema);
        });

        it('should throw error on basic structure level', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                xxx: 123,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Property schema.xxx is not allowed.)',
            );

            const schema2 = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 100000,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema2)).toThrow(
                'Input schema is not valid (Field schema.schemaVersion should be <= 1)',
            );
        });

        it('should throw error on field structure level for a type ANY', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        description: 'Some description ...',
                        editor: 'textfield',
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.editor should be equal to one of the allowed values)',
            );
        });

        it('should throw error on field that doesn\'t match any of types', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'xxx',
                        description: 'Some description ...',
                        editor: 'textfield',
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField is not matching any input schema type definition.'
                + ' Please make sure that it\'s type is valid.',
            );
        });

        it('should throw error on field structure level for a type other than ANY and STRING', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'object',
                        description: 'Some description ...',
                        editor: 'json',
                        xxx: 1,
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Property schema.properties.myField.xxx is not allowed.)',
            );
        });

        it('should throw error on field structure level for a type non-ENUM STRING', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        editor: 'xxx',
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.editor should be equal to one of the allowed values)',
            );
        });

        it('should throw error on field structure level for a type ENUM STRING', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        enum: [123],
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.enum[0] should be string)',
            );
        });
    });
});
