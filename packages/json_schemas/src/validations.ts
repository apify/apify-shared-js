// We're using the 2019, because input schema requires it (it uses "unevaluatedProperties" keyword)
import Ajv from 'ajv/dist/2019.js';

// TODO: it might be better to import this from ajv package
import draft7MetaSchema from '../schemas/json-schema-draft-07.json';
import {
    actorSchema,
    datasetSchema,
    inputSchema,
    keyValueStoreSchema,
    outputSchema,
} from './schemas';

const ajv = new Ajv({
    schemas: [
        actorSchema,
        datasetSchema,
        inputSchema,
        keyValueStoreSchema,
        outputSchema,
        // We need to provide draft-07 metaschema, because other schemas reference it
        // using "$ref": "http://json-schema.org/draft-07/schema#"
        draft7MetaSchema,
    ],
    allowUnionTypes: true,
});

export const getActorSchemaValidator = () => ajv.compile(actorSchema);

export const getDatasetSchemaValidator = () => ajv.compile(datasetSchema);

export const getInputSchemaValidator = () => ajv.compile(inputSchema);

export const getKeyValueStoreSchemaValidator = () => ajv.compile(keyValueStoreSchema);

export const getOutputSchemaValidator = () => ajv.compile(outputSchema);
