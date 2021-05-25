import Ajv from 'ajv';
import { inputSchema } from '@apify/input_schema';

describe('input_schema.json', () => {
    const ajv = new Ajv();

    describe('type any', () => {
        it('should allow to compile only a valid type any', () => {
            // Valid one.
            if (!ajv.validate(inputSchema, {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            })) throw new Error(ajv.errorsText());

            // Nonexisting type.
            if (ajv.validate(inputSchema, {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['array', 'nonexisting'],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            })) throw new Error('Input field definition with onexisting type should have failed!');

            // Missing type.
            if (ajv.validate(inputSchema, {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: [],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            })) throw new Error('Input field definition that misses type should have failed!');

            // Duplicate types.
            if (ajv.validate(inputSchema, {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['string', 'integer', 'integer'],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            })) throw new Error('Input field definition that duplicate types should have failed!');
        });

        it('should allow all the needed types', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'array', 'string', 'integer', 'boolean'],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                        default: { foo: 'bar' },
                        prefill: [1, 2, 3],
                        example: true,
                    },
                },
            };

            const test = (val: unknown) => {
                if (!ajv.validate(schema, { myField: val })) throw new Error(ajv.errorsText());
            };

            test({ foo: 'bar' });
            test([1, 2, 'foo']);
            test('something');
            test(324567);
            test(true);
        });

        it('should work with a subset (integer and array is not allowed)', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        type: ['object', 'string', 'boolean'],
                        nullable: false,
                        description: 'Some description ...',
                        editor: 'json',
                    },
                },
            };

            const test = (val: unknown) => {
                if (!ajv.validate(schema, { myField: val })) throw new Error(ajv.errorsText());
            };

            test({ foo: 'bar' });
            expect(() => test([1, 2, 'foo'])).toThrow('data.myField should be object,string,boolean');
            test('something');
            expect(() => test(324567)).toThrow('data.myField should be object,string,boolean');
            test(true);
        });
    });
});
