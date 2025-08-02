
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type FileUploadInput } from '../schema';
import { processFileUpload } from '../handlers/process_file_upload';

describe('processFileUpload', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const validJsonContent = '{"name":"test","value":123,"nested":{"key":"value"}}';
  const formattedJsonContent = '{\n  "name": "test",\n  "value": 123,\n  "nested": {\n    "key": "value"\n  }\n}';

  it('should successfully process valid JSON file', async () => {
    const input: FileUploadInput = {
      fileName: 'test.json',
      fileContent: validJsonContent,
      fileSize: validJsonContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(true);
    expect(result.result).toBe(formattedJsonContent);
    expect(result.error).toBe(null);
    expect(result.originalSize).toBe(validJsonContent.length);
    expect(result.processedSize).toBe(formattedJsonContent.length);
    expect(result.operation).toBe('validate');
  });

  it('should reject file exceeding size limit', async () => {
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    const input: FileUploadInput = {
      fileName: 'large.json',
      fileContent: largeContent,
      fileSize: largeContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(false);
    expect(result.result).toBe(null);
    expect(result.error).toBe('File size exceeds maximum limit of 10MB');
    expect(result.originalSize).toBe(largeContent.length);
    expect(result.processedSize).toBe(null);
    expect(result.operation).toBe('validate');
  });

  it('should reject file with size mismatch', async () => {
    const input: FileUploadInput = {
      fileName: 'test.json',
      fileContent: validJsonContent,
      fileSize: validJsonContent.length + 10 // Incorrect size
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(false);
    expect(result.result).toBe(null);
    expect(result.error).toBe('File size mismatch: declared size does not match content length');
    expect(result.originalSize).toBe(validJsonContent.length + 10);
    expect(result.processedSize).toBe(null);
    expect(result.operation).toBe('validate');
  });

  it('should handle invalid JSON content', async () => {
    const invalidJsonContent = '{"name":"test","value":123,}'; // Trailing comma
    const input: FileUploadInput = {
      fileName: 'invalid.json',
      fileContent: invalidJsonContent,
      fileSize: invalidJsonContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(false);
    expect(result.result).toBe(null);
    expect(result.error).toMatch(/JSON Parse Error:/);
    expect(result.originalSize).toBe(invalidJsonContent.length);
    expect(result.processedSize).toBe(null);
    expect(result.operation).toBe('validate');
  });

  it('should handle malformed JSON syntax', async () => {
    const malformedContent = '{"name":test"}'; // Missing quote
    const input: FileUploadInput = {
      fileName: 'malformed.json',
      fileContent: malformedContent,
      fileSize: malformedContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(false);
    expect(result.result).toBe(null);
    expect(result.error).toMatch(/JSON Parse Error:/);
    expect(result.originalSize).toBe(malformedContent.length);
    expect(result.processedSize).toBe(null);
    expect(result.operation).toBe('validate');
  });

  it('should handle empty JSON object', async () => {
    const emptyJsonContent = '{}';
    const input: FileUploadInput = {
      fileName: 'empty.json',
      fileContent: emptyJsonContent,
      fileSize: emptyJsonContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(true);
    expect(result.result).toBe('{}');
    expect(result.error).toBe(null);
    expect(result.originalSize).toBe(2);
    expect(result.processedSize).toBe(2);
    expect(result.operation).toBe('validate');
  });

  it('should handle JSON array', async () => {
    const arrayContent = '[1,2,3]';
    const formattedArray = '[\n  1,\n  2,\n  3\n]';
    const input: FileUploadInput = {
      fileName: 'array.json',
      fileContent: arrayContent,
      fileSize: arrayContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(true);
    expect(result.result).toBe(formattedArray);
    expect(result.error).toBe(null);
    expect(result.originalSize).toBe(arrayContent.length);
    expect(result.processedSize).toBe(formattedArray.length);
    expect(result.operation).toBe('validate');
  });

  it('should handle complex nested JSON', async () => {
    const complexContent = '{"users":[{"id":1,"name":"John","settings":{"theme":"dark","notifications":true}}],"meta":{"version":"1.0"}}';
    const input: FileUploadInput = {
      fileName: 'complex.json',
      fileContent: complexContent,
      fileSize: complexContent.length
    };

    const result = await processFileUpload(input);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.error).toBe(null);
    expect(result.originalSize).toBe(complexContent.length);
    expect(result.processedSize).toBeGreaterThan(complexContent.length); // Formatted should be larger
    expect(result.operation).toBe('validate');

    // Verify the result is valid JSON and properly formatted
    const parsedResult = JSON.parse(result.result!);
    expect(parsedResult.users).toHaveLength(1);
    expect(parsedResult.users[0].name).toBe('John');
    expect(parsedResult.meta.version).toBe('1.0');
  });
});
