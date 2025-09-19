import { ACTOR_LIMITS } from '@apify/consts';

// NOTE: When updating actor schema, always update this file not the schemas/actor.schema.json file directly.
// The schemas/actor.schema.json file is generated from this file during the build step.

export const actorSchema = {
    $id: 'actor.json',
    title: 'JSON schema of Apify Actor actor.json file',
    type: 'object',
    properties: {
        actorSpecification: {
            type: 'integer',
            minimum: 1,
            maximum: 1,
        },
        name: {
            type: 'string',
        },
        title: {
            type: 'string',
        },
        description: {
            type: 'string',
        },
        version: {
            type: 'string',
            pattern: '^([0-9]+)\\.([0-9]+)(\\.[0-9]+){0,1}$',
        },
        buildTag: {
            type: 'string',
            default: 'latest',
        },
        environmentVariables: {
            type: 'object',
            patternProperties: {
                '^': {
                    type: 'string',
                },
            },
        },
        dockerfile: {
            type: 'string',
            default: '../Dockerfile',
        },
        readme: {
            type: 'string',
            default: '../README.md',
        },
        minMemoryMbytes: {
            type: 'integer',
            minimum: ACTOR_LIMITS.MIN_RUN_MEMORY_MBYTES,
            maximum: ACTOR_LIMITS.MAX_RUN_MEMORY_MBYTES,
        },
        maxMemoryMbytes: {
            type: 'integer',
            minimum: ACTOR_LIMITS.MIN_RUN_MEMORY_MBYTES,
            maximum: ACTOR_LIMITS.MAX_RUN_MEMORY_MBYTES,
        },
        input: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    type: 'object',
                },
            ],
        },
        inputSchema: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    type: 'object',
                },
            ],
        },
        output: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    $ref: 'output.json',
                },
            ],
        },
        outputSchema: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    $ref: 'output.json',
                },
            ],
        },
        storages: {
            type: 'object',
            properties: {
                keyValueStore: {
                    oneOf: [
                        {
                            type: 'string',
                        },
                        {
                            $ref: 'key_value_store.json',
                        },
                    ],
                },
                dataset: {
                    oneOf: [
                        {
                            type: 'string',
                        },
                        {
                            $ref: 'dataset.json',
                        },
                    ],
                },
                requestQueue: {
                    type: 'string',
                },
            },
        },
        usesStandbyMode: {
            type: 'boolean',
        },
        webServerSchema: {
            oneOf: [
                {
                    type: 'string',
                },
                {
                    type: 'object',
                },
            ],
        },
        webServerMcpPath: {
            type: 'string',
        },
    },
    required: [
        'actorSpecification',
        'version',
        'name',
    ],
};
