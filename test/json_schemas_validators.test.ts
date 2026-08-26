import { describe, expect, it } from 'vitest';

import {
    getActorSchemaValidator,
    getDatasetSchemaValidator,
    getInputSchemaValidator,
    getKeyValueStoreSchemaValidator,
    getOutputSchemaValidator,
} from '@apify/json_schemas';

// Regression test: ajv's strict mode rejects `additionalItems` next to a non-tuple `items`, which made `getInputSchemaValidator()` throw.
describe('json_schemas validators', () => {
    it.each([
        ['actor', getActorSchemaValidator],
        ['dataset', getDatasetSchemaValidator],
        ['input', getInputSchemaValidator],
        ['key-value store', getKeyValueStoreSchemaValidator],
        ['output', getOutputSchemaValidator],
    ])('%s schema compiles into a validator', (_name, getValidator) => {
        const validate = getValidator();
        expect(typeof validate).toBe('function');
        expect(validate({})).toBe(false);
    });

    it('input schema validator accepts a minimal valid schema', () => {
        const validate = getInputSchemaValidator();
        const valid = validate({
            title: 'Test input',
            type: 'object',
            schemaVersion: 1,
            properties: {
                query: { title: 'Query', description: 'Search query', type: 'string', editor: 'textfield' },
            },
        });
        expect(validate.errors).toBeNull();
        expect(valid).toBe(true);
    });
});
