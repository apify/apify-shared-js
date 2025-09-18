import Ajv from 'ajv/dist/2019.js';
import draft7MetaSchema from 'ajv/lib/refs/json-schema-draft-07.json';

import {
    actorSchema,
    datasetSchema,
    inputSchema,
    keyValueStoreSchema,
    outputSchema,
} from './schemas.js';

const ajv = new Ajv({
    schemas: [
        actorSchema,
        datasetSchema,
        inputSchema,
        keyValueStoreSchema,
        outputSchema,
        draft7MetaSchema,
    ],
    allowUnionTypes: true,
});

// ajv.addMetaSchema(draft7MetaSchema);

export const getActorSchemaValidator = () => ajv.compile(actorSchema);

export const getDatasetSchemaValidator = () => ajv.compile(datasetSchema);

export const getInputSchemaValidator = () => ajv.compile(inputSchema);

export const getKeyValueStoreSchemaValidator = () => ajv.compile(keyValueStoreSchema);

export const getOutputSchemaValidator = () => ajv.compile(outputSchema);
