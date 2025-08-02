
import { describe, it, expect } from 'bun:test';
import { processJson } from '../handlers/process_json';
import { type JsonProcessInput } from '../schema';

describe('processJson', () => {
  const validJson = '{"name":"John","age":30,"city":"New York"}';
  const invalidJson = '{"name":"John","age":30,}'; // Trailing comma
  const nestedJson = '{"user":{"name":"John","details":{"age":30,"city":"New York"}},"items":["a","b","c"]}';

  describe('validate operation', () => {
    it('should validate valid JSON', async () => {
      const input: JsonProcessInput = {
        jsonContent: validJson,
        operation: 'validate',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toBe(validJson);
      expect(result.error).toBeNull();
      expect(result.originalSize).toBe(validJson.length);
      expect(result.processedSize).toBe(validJson.length);
      expect(result.operation).toBe('validate');
    });

    it('should handle invalid JSON', async () => {
      const input: JsonProcessInput = {
        jsonContent: invalidJson,
        operation: 'validate',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).toContain('JSON');
      expect(result.originalSize).toBe(invalidJson.length);
      expect(result.processedSize).toBeNull();
      expect(result.operation).toBe('validate');
    });
  });

  describe('format operation', () => {
    it('should format JSON with default indentation', async () => {
      const input: JsonProcessInput = {
        jsonContent: validJson,
        operation: 'format',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toContain('\n');
      expect(result.result).toContain('  '); // 2-space indentation
      expect(result.error).toBeNull();
      expect(result.originalSize).toBe(validJson.length);
      expect(result.processedSize).toBeGreaterThan(validJson.length);
      expect(result.operation).toBe('format');
    });

    it('should format JSON with custom indentation', async () => {
      const input: JsonProcessInput = {
        jsonContent: validJson,
        operation: 'format',
        indentSize: 4,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toContain('    '); // 4-space indentation
      expect(result.error).toBeNull();
      expect(result.operation).toBe('format');
    });

    it('should handle invalid JSON in format operation', async () => {
      const input: JsonProcessInput = {
        jsonContent: invalidJson,
        operation: 'format',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).toContain('JSON');
      expect(result.processedSize).toBeNull();
    });
  });

  describe('minify operation', () => {
    it('should minify formatted JSON', async () => {
      const formattedJson = '{\n  "name": "John",\n  "age": 30,\n  "city": "New York"\n}';
      const input: JsonProcessInput = {
        jsonContent: formattedJson,
        operation: 'minify',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).not.toContain('\n');
      expect(result.result).not.toContain('  ');
      expect(result.result).toBe('{"name":"John","age":30,"city":"New York"}');
      expect(result.error).toBeNull();
      expect(result.processedSize).toBeLessThan(result.originalSize);
      expect(result.operation).toBe('minify');
    });

    it('should handle invalid JSON in minify operation', async () => {
      const input: JsonProcessInput = {
        jsonContent: invalidJson,
        operation: 'minify',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).toContain('JSON');
    });
  });

  describe('sort-keys operation', () => {
    it('should sort object keys alphabetically', async () => {
      const unsortedJson = '{"zebra":"animal","apple":"fruit","banana":"fruit"}';
      const input: JsonProcessInput = {
        jsonContent: unsortedJson,
        operation: 'sort-keys',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toContain('apple');
      expect(result.result).toContain('banana');
      expect(result.result).toContain('zebra');
      
      // Check that keys are in alphabetical order
      const resultObj = JSON.parse(result.result!);
      const keys = Object.keys(resultObj);
      expect(keys).toEqual(['apple', 'banana', 'zebra']);
      
      expect(result.error).toBeNull();
      expect(result.operation).toBe('sort-keys');
    });

    it('should sort nested object keys recursively', async () => {
      const input: JsonProcessInput = {
        jsonContent: nestedJson,
        operation: 'sort-keys',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      const resultObj = JSON.parse(result.result!);
      
      // Check top-level keys are sorted
      const topKeys = Object.keys(resultObj);
      expect(topKeys).toEqual(['items', 'user']); // alphabetical order
      
      // Check nested object keys are sorted
      const userKeys = Object.keys(resultObj.user);
      expect(userKeys).toEqual(['details', 'name']); // alphabetical order
      
      const detailKeys = Object.keys(resultObj.user.details);
      expect(detailKeys).toEqual(['age', 'city']); // alphabetical order
      
      expect(result.error).toBeNull();
    });

    it('should handle arrays in sort-keys operation', async () => {
      const jsonWithArray = '{"items":["c","a","b"],"name":"test"}';
      const input: JsonProcessInput = {
        jsonContent: jsonWithArray,
        operation: 'sort-keys',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      const resultObj = JSON.parse(result.result!);
      
      // Keys should be sorted
      const keys = Object.keys(resultObj);
      expect(keys).toEqual(['items', 'name']);
      
      // Array order should be preserved (not sorted)
      expect(resultObj.items).toEqual(['c', 'a', 'b']);
    });

    it('should handle invalid JSON in sort-keys operation', async () => {
      const input: JsonProcessInput = {
        jsonContent: invalidJson,
        operation: 'sort-keys',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(false);
      expect(result.result).toBeNull();
      expect(result.error).toContain('JSON');
    });
  });

  describe('edge cases', () => {
    it('should handle empty JSON object', async () => {
      const input: JsonProcessInput = {
        jsonContent: '{}',
        operation: 'format',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toBe('{}');
      expect(result.error).toBeNull();
    });

    it('should handle JSON with null values', async () => {
      const jsonWithNull = '{"name":"John","age":null}';
      const input: JsonProcessInput = {
        jsonContent: jsonWithNull,
        operation: 'sort-keys',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      const resultObj = JSON.parse(result.result!);
      expect(resultObj.age).toBeNull();
      expect(Object.keys(resultObj)).toEqual(['age', 'name']); // sorted
    });

    it('should handle JSON array at root level', async () => {
      const jsonArray = '[{"name":"John"},{"name":"Jane"}]';
      const input: JsonProcessInput = {
        jsonContent: jsonArray,
        operation: 'format',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      expect(result.result).toContain('\n');
      expect(Array.isArray(JSON.parse(result.result!))).toBe(true);
    });

    it('should preserve numeric precision', async () => {
      const jsonWithNumbers = '{"price":19.99,"quantity":100,"percentage":0.001}';
      const input: JsonProcessInput = {
        jsonContent: jsonWithNumbers,
        operation: 'format',
        indentSize: 2,
        sortKeys: false
      };

      const result = await processJson(input);

      expect(result.success).toBe(true);
      const resultObj = JSON.parse(result.result!);
      expect(resultObj.price).toBe(19.99);
      expect(resultObj.quantity).toBe(100);
      expect(resultObj.percentage).toBe(0.001);
    });
  });
});
