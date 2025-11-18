import { describe, it, expect } from 'vitest';
import { SchemaFaker } from '../schema-faker';

describe('SchemaFaker', () => {
  describe('generate', () => {
    it('should generate data from simple schema', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      };

      const result = SchemaFaker.generate(schema);

      expect(result).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.age).toBe('number');
    });

    it('should generate array data', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
      };

      const result = SchemaFaker.generate(schema);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
    });

    it('should use example values when provided', () => {
      const schema = {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'active',
          },
        },
      };

      const result = SchemaFaker.generate(schema);

      expect(result.status).toBe('active');
    });

    it('should handle nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
        },
      };

      const result = SchemaFaker.generate(schema);

      expect(result.user).toBeDefined();
      expect(typeof result.user.name).toBe('string');
      expect(typeof result.user.email).toBe('string');
    });

    it('should handle enum values', () => {
      const schema = {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            enum: ['admin', 'user', 'guest'],
          },
        },
      };

      const result = SchemaFaker.generate(schema);

      expect(['admin', 'user', 'guest']).toContain(result.role);
    });
  });

  describe('generateArray', () => {
    it('should generate array of fake data', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      const result = SchemaFaker.generateArray(schema, 5);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      result.forEach((item) => {
        expect(item).toHaveProperty('id');
      });
    });

    it('should use default count of 3', () => {
      const schema = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      const result = SchemaFaker.generateArray(schema);

      expect(result).toHaveLength(3);
    });
  });
});
