import Ajv from 'ajv/dist/2019';
import ajvErrors from 'ajv-errors';

import { validateInputSchema } from '@apify/input_schema';

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
                        type: ['object', 'array', 'string', 'integer', 'number', 'boolean'],
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
                    myField4: {
                        title: 'Field title',
                        type: 'string',
                        description: 'Some description ...',
                        editor: 'fileupload',
                    },
                    myfield5: {
                        title: 'Array fileupload title',
                        type: 'array',
                        description: 'Some description...',
                        editor: 'fileupload',
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
                        type: ['object', 'array', 'string', 'integer', 'number', 'boolean'],
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
                        type: ['object', 'array', 'string', 'integer', 'number', 'boolean'],
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
                        type: ['object', 'array', 'string', 'integer', 'number', 'boolean'],
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
                + '"javascript", "python", "textfield", "textarea", "hidden", "fileupload")',
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
                        default: true,
                    },
                },
            };

            expect(() => validateInputSchema(validator, schema)).toThrow(
                'Input schema is not valid (Property schema.properties.myField.default is not allowed.)',
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
                'Input schema is not valid (Field schema.properties.myField.enum must NOT have fewer than 1 items)',
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
                'Input schema is not valid (Field schema.properties.myField.enumTitles must NOT have fewer than 1 items)',
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

        describe('special cases for resourceProperty', () => {
            it('should accept valid resourceType', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            prefill: 'test',
                            default: 'test',
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).not.toThrow();

                const schema2 = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myFieldArray: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            resourceType: 'keyValueStore',
                            prefill: [],
                            default: [],
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema2)).not.toThrow();
            });

            it('should not accept invalid resourceType', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'xxx',
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField.resourceType must be equal to one of the allowed values: '
                    + '"dataset", "keyValueStore", "requestQueue")',
                );
            });

            it('should accept valid editor', () => {
                const validEditors = ['resourcePicker', 'textfield', 'hidden'];
                validEditors.forEach((editor) => {
                    const schema = {
                        title: 'Test input schema',
                        type: 'object',
                        schemaVersion: 1,
                        properties: {
                            myField: {
                                title: 'Field title',
                                description: 'My test field',
                                type: 'string',
                                resourceType: 'keyValueStore',
                                editor,
                            },
                        },
                    };
                    expect(() => validateInputSchema(validator, schema)).not.toThrow();
                });
            });

            it('should not accept invalid editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            editor: 'textarea',
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    // eslint-disable-next-line max-len
                    'Input schema is not valid (Field schema.properties.myField.editor must be equal to one of the allowed values: "resourcePicker", "textfield", "hidden")',
                );
            });

            it('should accept valid resourcePermissions', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['READ'],
                        },
                    },
                };
                validateInputSchema(validator, schema);

                const schema2 = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myFieldArray: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['READ', 'WRITE'],
                        },
                    },
                };
                validateInputSchema(validator, schema2);
            });

            it('should not accept invalid resourcePermissions values', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['INVALID'],
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    // eslint-disable-next-line max-len
                    'Input schema is not valid (Field schema.properties.myField.resourcePermissions.0 must be equal to one of the allowed values: "READ", "WRITE")',
                );

                const schema2 = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myFieldArray: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['INVALID'],
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema2)).toThrow(
                    // eslint-disable-next-line max-len
                    'Input schema is not valid (Field schema.properties.myFieldArray.resourcePermissions.0 must be equal to one of the allowed values: "READ", "WRITE")',
                );
            });

            it('should not accept empty resourcePermissions array', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: [],
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField.resourcePermissions must NOT have fewer than 1 items)',
                );
            });

            it('should not accept resourcePermissions with prefill', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['READ'],
                            prefill: 'some-value',
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField. must NOT be valid)',
                );

                const schema2 = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['READ'],
                            prefill: [],
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema2)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField. must NOT be valid)',
                );
            });

            it('should not accept resourcePermissions with default', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['READ'],
                            default: 'some-value',
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField. must NOT be valid)',
                );
            });

            it('should not accept resourcePermissions without READ', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'string',
                            resourceType: 'keyValueStore',
                            resourcePermissions: ['WRITE'],
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (Field schema.properties.myField.resourcePermissions must contain at least 1 valid item(s))',
                );
            });
        });

        describe('special cases for sub-schema', () => {
            it('should accept valid object sub-schema', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            type: 'object',
                            description: 'Description',
                            editor: 'schemaBased',
                            additionalProperties: false,
                            properties: {
                                key: {
                                    type: 'object',
                                    title: 'Key',
                                    description: 'Key description',
                                    editor: 'json',
                                    prefill: { key1: 'prefill value' },
                                    properties: {
                                        key1: {
                                            type: 'string',
                                            title: 'Key 1',
                                            description: 'Key 1 description',
                                            default: 'default value',
                                        },
                                        key2: {
                                            type: 'string',
                                            title: 'Key 2',
                                            description: 'Key 2 description',
                                        },
                                    },
                                },
                            },
                        },
                        myArray: {
                            title: 'Array field',
                            type: 'array',
                            description: 'Description',
                            editor: 'schemaBased',
                            items: {
                                type: 'object',
                                properties: {
                                    arrayKey: {
                                        type: 'string',
                                        title: 'Array Key',
                                        description: 'Array Key description',
                                        default: 'default value',
                                        prefill: 'prefill value',
                                        example: 'example value',
                                    },
                                },
                            },
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });

            it('should accept valid array sub-schema', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            type: 'array',
                            description: 'Description',
                            editor: 'schemaBased',
                            items: {
                                type: 'object',
                                properties: {
                                    key: {
                                        type: 'object',
                                        title: 'Key',
                                        description: 'Key description',
                                        editor: 'json',
                                        properties: {
                                            key1: {
                                                type: 'string',
                                                title: 'Key 1',
                                                description: 'Key 1 description',
                                            },
                                            key2: {
                                                type: 'string',
                                                title: 'Key 2',
                                                description: 'Key 2 description',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });

            it('should accept valid 2D array sub-schema', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        myField: {
                            title: 'Field title',
                            type: 'array',
                            description: 'Description',
                            editor: 'schemaBased',
                            items: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        key: {
                                            type: 'object',
                                            title: 'Key',
                                            description: 'Key description',
                                            editor: 'json',
                                            properties: {
                                                key1: {
                                                    type: 'string',
                                                    title: 'Key 1',
                                                    description: 'Key 1 description',
                                                },
                                                key2: {
                                                    type: 'string',
                                                    title: 'Key 2',
                                                    description: 'Key 2 description',
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });
        });

        describe('sub-schema restrictions based on editor', () => {
            it('should not allow unknown properties for proxy editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        proxy: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            editor: 'proxy',
                            properties: {
                                unknownProperty: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow();
            });

            it('should allow only specific properties for proxy editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        proxy: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            editor: 'proxy',
                            properties: {
                                useApifyProxy: {
                                    type: 'boolean',
                                    title: 'Use Apify Proxy',
                                    description: 'Whether to use Apify Proxy or not',
                                },
                                apifyProxyGroups: {
                                    type: 'array',
                                    title: 'Apify Proxy Groups',
                                    description: 'Apify Proxy groups to use',
                                    items: {
                                        type: 'string',
                                    },
                                },
                                proxyUrls: {
                                    type: 'array',
                                    title: 'Custom Proxy URLs',
                                    description: 'Custom proxy URLs to use',
                                    items: {
                                        type: 'string',
                                    },
                                },
                                apifyProxyCountry: {
                                    type: 'string',
                                    title: 'Apify Proxy Country',
                                    description: 'Country code for Apify Proxy',
                                },
                            },
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });

            it('should not allow unknown properties for keyValue array editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        keyValueArray: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            editor: 'keyValueArray',
                            items: {
                                type: 'object',
                                properties: {
                                    key: {
                                        type: 'string',
                                        title: 'Key',
                                        description: 'The key of the key-value pair',
                                    },
                                    value: {
                                        type: 'string',
                                        title: 'Value',
                                        description: 'The value of the key-value pair',
                                    },
                                    extraProperty: {
                                        type: 'string',
                                        title: 'Extra Property',
                                        description: 'This property should not be allowed',
                                    },
                                },
                                required: ['key', 'value'],
                            },
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).toThrow();
            });

            it('should allow only specific properties for keyValue array editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        keyValueArray: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'array',
                            editor: 'keyValue',
                            items: {
                                type: 'object',
                                properties: {
                                    key: {
                                        type: 'string',
                                        title: 'Key',
                                        description: 'The key of the key-value pair',
                                    },
                                    value: {
                                        type: 'string',
                                        title: 'Value',
                                        description: 'The value of the key-value pair',
                                    },
                                },
                                required: ['key', 'value'],
                            },
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });

            it('should allow any properties for json editor', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        jsonField: {
                            title: 'Field title',
                            description: 'My test field',
                            type: 'object',
                            editor: 'json',
                            properties: {
                                anyProperty: {
                                    type: 'string',
                                    title: 'Field title',
                                    description: 'My test field',
                                },
                                anotherProperty: {
                                    type: 'integer',
                                    title: 'Another field title',
                                    description: 'Another test field',
                                },
                            },
                        },
                    },
                };
                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });
        });

        describe('nullable field influence default type', () => {
            it('should allow default null if nullable', () => {
                const types = [
                    { type: 'string', editor: 'textfield' },
                    { type: 'integer', editor: 'number' },
                    { type: 'number', editor: 'number' },
                    { type: 'boolean', editor: 'checkbox' },
                    { type: 'array', editor: 'json' },
                    { type: 'object', editor: 'json' },
                ];

                types.forEach((type) => {
                    const schema = {
                        title: 'Test input schema',
                        type: 'object',
                        schemaVersion: 1,
                        properties: {
                            myField: {
                                title: 'Field title',
                                description: 'My test field',
                                ...type,
                                nullable: true,
                                default: null,
                            },
                        },
                    };
                    expect(() => validateInputSchema(validator, schema)).not.toThrow();
                });
            });

            it('should not allow default null if not nullable', () => {
                const types = [
                    { type: 'string', editor: 'textfield' },
                    { type: 'integer', editor: 'number' },
                    { type: 'number', editor: 'number' },
                    { type: 'boolean', editor: 'checkbox' },
                    { type: 'array', editor: 'json' },
                    { type: 'object', editor: 'json' },
                ];

                types.forEach((type) => {
                    const schema = {
                        title: 'Test input schema',
                        type: 'object',
                        schemaVersion: 1,
                        properties: {
                            myField: {
                                title: 'Field title',
                                description: 'My test field',
                                ...type,
                                default: null,
                            },
                        },
                    };
                    expect(() => validateInputSchema(validator, schema)).toThrow(
                        `Input schema is not valid (Field schema.properties.myField.default must be ${type.type})`,
                    );
                });

                types.forEach((type) => {
                    const schema = {
                        title: 'Test input schema',
                        type: 'object',
                        schemaVersion: 1,
                        properties: {
                            myField: {
                                title: 'Field title',
                                description: 'My test field',
                                ...type,
                                nullable: false,
                                default: null,
                            },
                        },
                    };
                    expect(() => validateInputSchema(validator, schema)).toThrow(
                        `Input schema is not valid (Field schema.properties.myField.default must be ${type.type})`,
                    );
                });
            });
        });

        describe('validate pattern regexps', () => {
            it('should accept valid regexp', () => {
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
                            pattern: '^[A-Z]{3}$',
                        },
                        objectField: {
                            title: 'Object field',
                            type: 'object',
                            description: 'Some description ...',
                            editor: 'json',
                            patternKey: '^[a-z]+$',
                            patternValue: '^[0-9]+$',
                        },
                        arrayField: {
                            title: 'Array field',
                            type: 'array',
                            description: 'Some description ...',
                            editor: 'json',
                            patternKey: '^[a-z]+$',
                            patternValue: '^[0-9]+$',
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).not.toThrow();
            });

            it('should throw error on invalid pattern regexp', () => {
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
                            pattern: '[A-Z{3}', // invalid regexp
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (The regular expression "[A-Z{3}" in field schema.properties.myField.pattern must be valid.)',
                );
            });

            it('should throw error on invalid patternKey regexp', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        objectField: {
                            title: 'Object field',
                            type: 'object',
                            description: 'Some description ...',
                            editor: 'json',
                            patternKey: '[a-z+$', // invalid regexp
                            patternValue: '^[0-9]+$',
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (The regular expression "[a-z+$" in field schema.properties.objectField.patternKey must be valid.)',
                );
            });

            it('should throw error on invalid patternValue regexp', () => {
                const schema = {
                    title: 'Test input schema',
                    type: 'object',
                    schemaVersion: 1,
                    properties: {
                        objectField: {
                            title: 'Object field',
                            type: 'object',
                            description: 'Some description ...',
                            editor: 'json',
                            patternKey: '^[a-z]+$',
                            patternValue: '^[0-9+$', // invalid regexp
                        },
                    },
                };

                expect(() => validateInputSchema(validator, schema)).toThrow(
                    'Input schema is not valid (The regular expression "^[0-9+$" in field schema.properties.objectField.patternValue must be valid.)',
                );
            });

            it('should throw error on not safe regexp', () => {
                const invalidRegexps = [
                    '(a+)+$',
                    '^(a|a?)+$',
                    '^(a|a*)+$',
                    '^(a|a+)+$',
                    '^(a?)+$',
                    '^(a*)+$',
                    '^(a+)*$',
                    '^(a|aa?)+$',
                    '^(a|aa*)+$',
                    '^(a|a+)*$',
                    '^(a|a?)*$',
                    '^(a|a*)*$',
                    '^(a?)*$',
                    '^(a*)*$',
                    '^(a+)?$',
                    '^(a*)?$',
                    'a*b*c*d*e*f*g*h*i*j*k*l*m*n*o*p*q*r*s*t*u*v*w*x*y*z*',
                ];

                for (const pattern of invalidRegexps) {
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
                                pattern,
                            },
                        },
                    };

                    expect(() => validateInputSchema(validator, schema)).toThrow(
                        `Input schema is not valid (The regular expression "${pattern}" in field schema.properties.myField.pattern may cause excessive backtracking or be unsafe to execute.)`,
                    );
                }
            });
        });
    });

    describe('test custom error messages', () => {
        const ajv = new Ajv({ strict: false, unicodeRegExp: false, allErrors: true });
        ajvErrors(ajv);

        it('should return custom error message for missing required field', () => {
            const schema = {
                title: 'Test input schema',
                type: 'object',
                schemaVersion: 1,
                properties: {
                    myField: {
                        title: 'Field title',
                        description: 'My test field',
                        type: 'string',
                        editor: 'textfield',
                        errorMessage: {
                            type: 'myField must be string',
                        },
                    },
                },
                required: ['myField'],
            };
            const validate = ajv.compile(schema);

            validate({ myField: 1 });
            expect(validate.errors?.[0].message).toBe('myField must be string');
        });
    });
});
