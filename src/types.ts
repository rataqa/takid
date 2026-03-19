import { ErrorObject } from 'ajv';

export namespace JsonSchemas {

  export interface IJsonSchemaService {
    schemasFromSpec: ISchemaContainer;
    getJsonSchema(name: string): IJsonSchemaWithDefs;
    validator<T>(name: string): IJsonSchemaValidator<T>;
  }

  export interface IJsonSchemaValidator<T> {
    name: string;
    schema: IJsonSchemaWithDefs;
    validate(data: T): IOutputToValidate<T>;
  }

  export interface IOutputToValidate<T = any> {
    success: T | null;
    errors: ErrorObject[];
  }

  export type ISchemaObject = IObject;

  export type ISchemaContainer = Record<string, ISchemaObject>;

  export type IJsonSchemaWithDefs = ISchemaObject & { $schema: string; $defs: ISchemaContainer; }

  export interface IObject {
    [attribute: string]: unknown;
  }

}
