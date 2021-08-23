import Ajv from 'ajv';
import { inputSchema } from '@apify/input_schema';

/**
 * Temporarily replace console.warn with implementation that throws error instead
 * of logging the warning.
 *
 * @returns {() => void} Function that will turn this behavior off.
 */
const setThrowErrorOnConsoleWarn = (): () => void => {
    const consoleWarn = console.warn;
    console.warn = () => {
        throw new Error('Console.warn has been called!');
    };
    const turnOff = () => {
        console.warn = consoleWarn;
    };
    return turnOff;
};

describe('input_schema.json', () => {
    const ajv = new Ajv({ strict: false });

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
            expect(() => test([1, 2, 'foo'])).toThrow('data/myField must be object,string,boolean');
            test('something');
            expect(() => test(324567)).toThrow('data/myField must be object,string,boolean');
            test(true);
        });

        it('should not generate console warnings for schema containing `id` (1)', () => {
            const turnOffConsoleWarnErrors = setThrowErrorOnConsoleWarn();

            expect(() => console.warn('OK')).toThrow('Console.warn has been called!');

            const schema = {
                $id: 'http://mydomain/schemas/node.json',
                type: 'object',
                properties: {
                    id: {
                        description: 'The unique identifier for a node',
                        type: 'string',
                    },
                },
                required: ['id'],
                example: {
                    id: 'test',
                },
            };

            const test = (data: unknown) => {
                if (!ajv.validate(schema, data)) throw new Error(ajv.errorsText());
            };

            test({ id: 'test' });

            turnOffConsoleWarnErrors();
        });

        it('should not generate console warnings for schema containing `id` (2)', () => {
            const turnOffConsoleWarnErrors = setThrowErrorOnConsoleWarn();

            expect(() => console.warn('OK')).toThrow('Console.warn has been called!');

            const schema = {
                title: 'Status dashboard',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    test: {
                        title: 'Test',
                        description: '',
                        type: 'object',
                        editor: 'json',
                        prefill: {
                            id: 'KubaTestPrefill',
                            apiKey: 'aaa',
                            workspace: 'aaa',
                            title: 'aaaa',
                        },
                    },
                },
            };

            const test = (data: unknown) => {
                if (!ajv.validate(schema, data)) throw new Error(ajv.errorsText());
            };

            test({ test: { id: 1 } });

            turnOffConsoleWarnErrors();
        });
    });
});
