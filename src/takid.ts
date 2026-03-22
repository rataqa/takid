import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { JsonSchemas } from './types';

/**
 * Create an instance of JsonSchemaService per API specification.
 */
export class JsonSchemaService implements JsonSchemas.IJsonSchemaService {
  /**
   * Cache for validators
   */
  protected cache: Map<string, JsonSchemas.IJsonSchemaValidator<any>> = new Map();

  /**
   * Copy of #/components/schemas in OpenAPI spec
   */
  protected $defs: JsonSchemas.ISchemaContainer = {};

  constructor(
    public schemasFromSpec: JsonSchemas.ISchemaContainer,
    protected ajv = addFormats(new Ajv()),
  ) {
    this.$defs = this.makeJsonSchemaDefs(schemasFromSpec);
  }

  /**
   * Converts OpenAPI schema references from '#/components/schemas/' to '#/$defs/'.
   * This is necessary for compatibility with JSON Schema $defs.
   */
  protected makeJsonSchemaDefs(schemasFromSpec: JsonSchemas.ISchemaContainer): JsonSchemas.ISchemaContainer {
    return JSON.parse(JSON.stringify(schemasFromSpec, (key, value) => {
      if (key === '$ref' && typeof value === 'string' && value.startsWith('#/components/schemas/')) {
        return value.replace('#/components/schemas/', '#/$defs/');
      }
      return value;
    })) as JsonSchemas.ISchemaContainer;
  }

  getJsonSchema(name: string): JsonSchemas.IJsonSchemaWithDefs {
    if (!this.$defs[name]) {
      throw new Error(`Schema with name "${name}" not found in provided schemas.`);
    }
    const { $defs } = this;
    const schema = $defs[name];
    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      ...schema,
      $defs,
    };
  }

  // use output of makeJsonSchema to create a validator
  validator<T>(name: string): JsonSchemas.IJsonSchemaValidator<T> {
    const found = this.cache.get(name);
    if (found) {
      return found as JsonSchemas.IJsonSchemaValidator<T>;
    }

    const schema = this.getJsonSchema(name);
    const _validate = this.ajv.compile(schema);

    function validate(data: T): JsonSchemas.IOutputToValidate<T> {
      const valid = _validate(data);
      if (valid) {
        return { success: data, errors: [] };
      } else {
        return { success: null, errors: _validate.errors || [] };
      }
    }

    const v: JsonSchemas.IJsonSchemaValidator<T> = {
      name,
      schema,
      validate,
    };

    this.cache.set(name, v);
    return v;
  }
}
