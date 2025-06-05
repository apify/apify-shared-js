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

        describe('special cases for isSecret string type', () => {
            const isSchemaValid = (fields: object, isSecret?: boolean) => {
                return ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            isSecret,
                            ...fields,
                        },
                    },
                });
            };

            it('should not allow all editors', () => {
                ['textfield', 'textarea', 'hidden'].forEach((editor) => {
                    expect(isSchemaValid({ editor }, true)).toBe(true);
                });
                ['javascript', 'python'].forEach((editor) => {
                    expect(isSchemaValid({ editor }, true)).toBe(false);
                });
            });

            it('should allow only string and object type', () => {
                [{ type: 'string', editor: 'textfield' }].forEach((fields) => {
                    expect(isSchemaValid(fields, true)).toBe(true);
                });
                [{ type: 'object', editor: 'json' }].forEach((fields) => {
                    expect(isSchemaValid(fields, true)).toBe(true);
                });
                [
                    { type: 'array', editor: 'stringList' },
                    { type: 'boolean' },
                    { type: 'integer' },
                ].forEach((fields) => {
                    expect(isSchemaValid(fields, true)).toBe(false);
                });
            });

            it('should not allow some fields', () => {
                ['minLength', 'maxLength'].forEach((intField) => {
                    expect(isSchemaValid({ [intField]: 10 }, true)).toBe(false);
                });
                ['default', 'prefill', 'pattern'].forEach((stringField) => {
                    expect(isSchemaValid({ [stringField]: 'bla' }, true)).toBe(false);
                });
            });

            it('should work without isSecret with all editors and properties', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            editor: 'textarea',
                            isSecret: false,
                            minLength: 2,
                            maxLength: 100,
                            default: 'blablablablabla',
                            prefill: 'blablablablablablablablablablabla',
                        },
                    },
                })).toBe(true);

                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            editor: 'textarea',
                            isSecret: false,
                            minLength: 2,
                            maxLength: 100,
                            default: 'blablablablabla',
                            prefill: 'blablablablablablablablablablabla',
                            bla: 'bla', // Validation failed because additional property
                        },
                    },
                })).toBe(false);
            });
        });

        describe('special cases for isSecret object type', () => {
            const isSchemaValid = (fields: object, isSecret?: boolean) => {
                return ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            isSecret,
                            ...fields,
                        },
                    },
                });
            };

            it('should not allow all editors', () => {
                ['json', 'hidden'].forEach((editor) => {
                    expect(isSchemaValid({ editor }, true)).toBe(true);
                });
                ['proxy'].forEach((editor) => {
                    expect(isSchemaValid({ editor }, true)).toBe(false);
                });
            });

            it('should not allow some fields', () => {
                ['minProperties', 'maxProperties'].forEach((intField) => {
                    expect(isSchemaValid({ [intField]: 10 }, true)).toBe(false);
                });
                ['patternKey', 'patternValue', 'prefill', 'example'].forEach((stringField) => {
                    expect(isSchemaValid({ [stringField]: 'bla' }, true)).toBe(false);
                });
            });

            it('should work without isSecret with all editors and properties', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            editor: 'json',
                            isSecret: false,
                            minProperties: 2,
                            maxProperties: 100,
                            default: { key: 'value' },
                            prefill: { key: 'value', key2: 'value2' },
                        },
                    },
                })).toBe(true);

                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            editor: 'json',
                            isSecret: false,
                            minProperties: 2,
                            maxProperties: 100,
                            default: { key: 'value' },
                            prefill: { key: 'value', key2: 'value2' },
                            bla: 'bla', // Validation failed because additional property
                        },
                    },
                })).toBe(false);
            });
        });

        describe('special cases for datepicker editor type', () => {
            it('should accept dateType field omitted', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            editor: 'datepicker',
                        },
                    },
                })).toBe(true);
            });

            const isSchemaValid = (dateType: string) => {
                return ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            editor: 'datepicker',
                            dateType,
                        },
                    },
                });
            };

            it('should accept valid dateType', () => {
                ['absolute', 'relative', 'absoluteOrRelative'].forEach((dateType) => {
                    expect(isSchemaValid(dateType)).toBe(true);
                });
            });

            it('should not accept invalid dateType', () => {
                ['xxx', 'invalid'].forEach((dateType) => {
                    expect(isSchemaValid(dateType)).toBe(false);
                });
            });
        });

        describe('special cases for resourceProperty', () => {
            it('should accept resourceType with editor', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'dataset',
                            editor: 'resourcePicker',
                        },
                    },
                })).toBe(true);
            });

            it('should accept resourceType without editor', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'dataset',
                        },
                    },
                })).toBe(true);
            });

            it('should accept array resourceType', () => {
                expect(ajv.validate(inputSchema, {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            resourceType: 'dataset',
                        },
                    },
                })).toBe(true);
            });
        });
    });
});
