import { validateInputSchema } from '@apify/input_schema';
import Ajv from 'ajv';

describe('input_schema.json', () => {
    const validator = new Ajv({ strict: false });

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
                    myField2: {
                        title: 'Enum without titles',
                        type: 'string',
                        description: 'Some description ...',
                        editor: 'select',
                        enum: ['a', 'b', 'c'],
                    },
                    myField3: {
                        title: 'Enum with titles',
                        type: 'string',
                        description: 'Some description ...',
                        editor: 'select',
                        enum: ['a', 'b', 'c'],
                        enumTitles: ['A', 'B', 'C'],
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
                'Input schema is not valid (Field schema.schemaVersion must be <= 1)',
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
                'Input schema is not valid (Field schema.properties.myField.editor must be equal to one of the allowed values: "json", "hidden")',
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
                'Input schema is not valid (Field schema.properties.myField.editor must be equal to one of the allowed values: '
                + '"javascript", "python", "textfield", "textarea", "datepicker", "hidden")',
            );
        });

        it('should throw correct error on field in if/else definition', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        editor: 'textfield',
                        maxLength: true,
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.maxLength must be integer)',
            );
        });

        it('should throw correct error in string type else definition', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        isSecret: true,
                        description: 'Some description ...',
                        editor: 'textfield',
                        maxLength: true,
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Property schema.properties.myField.maxLength is not allowed.)',
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
                'Input schema is not valid (Field schema.properties.myField.enum.0 must be string)',
            );
        });

        it('should throw error on empty enum array', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        enum: [],
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.enum.enum must NOT have fewer than 1 items)',
            );
        });

        it('should throw error on empty enumTitles array', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        enum: ['abcd'],
                        enumTitles: [],
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Field schema.properties.myField.enum.enumTitles must NOT have fewer than 1 items)',
            );
        });

        it('should throw error when required field is not defined', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {},
                required: ['something'],
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                // eslint-disable-next-line
                'Field schema.properties.something does not exist, but it is specified in schema.required. Either define the field or remove it from schema.required.',
            );
        });
    });
});
