import { getActorSchemaValidator } from '@apify/json_schemas';

describe('actor.json', () => {
    const validator = getActorSchemaValidator();

    describe('valid schemas', () => {
        it('should validate a minimal valid schema', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: '1.0.0',
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate a complete valid schema', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                title: 'My Actor',
                description: 'This is my actor',
                version: '1.0.0',
                buildTag: 'latest',
                environmentVariables: {
                    API_KEY: 'my-api-key',
                },
                dockerfile: '../Dockerfile',
                dockerContextDir: './docker',
                readme: '../README.md',
                changelog: '../CHANGELOG.md',
                minMemoryMbytes: 256,
                maxMemoryMbytes: 1024,
                input: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                        },
                    },
                },
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: {
                            type: 'string',
                        },
                    },
                },
                output: {
                    actorOutputSchemaVersion: 1,
                    properties: {
                        result: {
                            type: 'string',
                            template: 'Result: {{result}}',
                        },
                    },
                },
                outputSchema: {
                    actorOutputSchemaVersion: 1,
                    properties: {
                        result: {
                            type: 'string',
                            template: 'Result: {{result}}',
                        },
                    },
                },
                storages: {
                    keyValueStore: {
                        actorKeyValueStoreSchemaVersion: 1,
                        title: 'My Key-Value Store',
                        collections: {
                            myCollection: {
                                title: 'My Collection',
                                keyPrefix: 'my-prefix-',
                                contentTypes: ['application/json'],
                            },
                        },
                    },
                    dataset: {
                        actorSpecification: 1,
                        fields: {
                            type: 'object',
                            properties: {
                                url: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
                usesStandbyMode: true,
                webServerSchema: {
                    type: 'object',
                    properties: {
                        port: {
                            type: 'integer',
                        },
                    },
                },
                webServerMcpPath: '/mcp',
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should validate with string references', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: '1.0.0',
                input: 'input.json',
                inputSchema: 'input-schema.json',
                output: 'output.json',
                outputSchema: 'output-schema.json',
                storages: {
                    keyValueStore: 'key-value-store.json',
                    dataset: 'dataset.json',
                },
                webServerSchema: 'web-server-schema.json',
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });
    });

    describe('invalid schemas', () => {
        it('should not validate when missing required fields', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                // missing version
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'required',
                    params: expect.objectContaining({
                        missingProperty: 'version',
                    }),
                }),
            );
        });

        it('should not validate with invalid actorSpecification', () => {
            const schema = {
                actorSpecification: 2, // invalid value
                name: 'my-actor',
                version: '1.0.0',
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

        it('should not validate with invalid version format', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: 'invalid-version', // invalid format
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'pattern',
                    params: expect.objectContaining({
                        pattern: '^([0-9]+)\\.([0-9]+)(\\.[0-9]+){0,1}$',
                    }),
                }),
            );
        });

        it('should not validate with invalid memory values', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: '1.0.0',
                minMemoryMbytes: 64, // too low
                maxMemoryMbytes: 65536, // too high
            };

            const isValid = validator(schema);
            expect(isValid).toBe(false);
            expect(validator.errors).toContainEqual(
                expect.objectContaining({
                    keyword: 'minimum',
                    params: expect.objectContaining({
                        comparison: '>=',
                        limit: 128,
                    }),
                }),
            );
        });

        it('should support multiple datasets', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: '1.0.0',
                storages: {
                    datasets: {
                        first: './first_dataset.json',
                        second: {
                            actorSpecification: 1,
                            fields: {
                                type: 'object',
                                properties: {
                                    url: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            };

            const isValid = validator(schema);
            expect(isValid).toBe(true);
        });

        it('should not allow both dataset and datasets', () => {
            const schema = {
                actorSpecification: 1,
                name: 'my-actor',
                version: '1.0.0',
                storages: {
                    dataset: './default_dataset.json',
                    datasets: {
                        first: './first_dataset.json',
                        second: {
                            actorSpecification: 1,
                            fields: {
                                type: 'object',
                                properties: {
                                    url: { type: 'string' },
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
                    message: 'must NOT be valid',
                }),
            );
        });
    });
});
