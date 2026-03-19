import { strictEqual as equal, throws } from 'node:assert';
import { describe, it } from 'node:test';

import { JsonSchemaService } from '../service';

describe('takid package - json schema service', () => {
  interface TestSchema {
    id: string;
    name: string;
  }

  const apiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
    },
    paths: {},
    components: {
      schemas: {
        TestSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', format: 'int32' },
            name: { type: 'string' },
            parentId: { $ref: '#/components/schemas/AnotherSchema' }
          },
          required: ['id', 'name'],
        },
        AnotherSchema: {
          type: 'object',
          properties: {
            id: { type: 'number', format: 'int32' },
            dob: { type: 'string', format: 'date' },
          },
        },
      },
    },
  }

  const jss = new JsonSchemaService(apiSpec.components.schemas);

  it('should create JsonSchemaService instance', () => {
    equal(jss instanceof JsonSchemaService, true);
  });

  it('should return success when input is valid based on schema', () => {
    const validator1 = jss.validator<TestSchema>('TestSchema');
    const input1 = { id: 123, name: 'Test Name' };
    const result1 = validator1.validate(input1 as any);
    equal(result1.success, input1);
    equal(result1.errors.length, 0);
  });

  it('should throw error when input is invalid based on schema', () => {
    const validator1 = jss.validator<TestSchema>('TestSchema');
    const input1 = { id: 123 }; // missing 'name'
    const result1 = validator1.validate(input1 as any);
    equal(result1.success, null);
    equal(result1.errors.length > 0, true);
  });

  it('should throw error when schema not found', () => {
    throws(
      () => jss.getJsonSchema('NonExistentSchema'),
      {
        name: 'Error',
        message: 'Schema with name "NonExistentSchema" not found in provided schemas.',
      }
    );
  });
});
