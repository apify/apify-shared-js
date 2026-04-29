type Primitive = string | number | boolean | null | undefined;

export type JsonSchemaValue = Primitive | object | JsonSchemaValue[];

export interface JsonSchemaObject {
    [member: string]: JsonSchemaValue;
    definitions?: Record<string, JsonSchemaObject>;
}
