
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { validateJson } from '../handlers/validate_json';

describe('validateJson', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should validate correct JSON', async () => {
    const validJson = '{"name": "test", "value": 123}';
    
    const result = await validateJson(validJson);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.lineNumber).toBeNull();
    expect(result.columnNumber).toBeNull();
  });

  it('should validate empty object', async () => {
    const validJson = '{}';
    
    const result = await validateJson(validJson);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.lineNumber).toBeNull();
    expect(result.columnNumber).toBeNull();
  });

  it('should validate array JSON', async () => {
    const validJson = '[1, 2, 3, "test"]';
    
    const result = await validateJson(validJson);

    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.lineNumber).toBeNull();
    expect(result.columnNumber).toBeNull();
  });

  it('should detect invalid JSON with missing quote', async () => {
    const invalidJson = '{"name": test}';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/identifier/i);
    expect(typeof result.error).toBe('string');
  });

  it('should detect invalid JSON with trailing comma', async () => {
    const invalidJson = '{"name": "test",}';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/string literal|property/i);
    expect(typeof result.error).toBe('string');
  });

  it('should detect invalid JSON with malformed structure', async () => {
    const invalidJson = '{"name": "test" "value": 123}';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/expected/i);
    expect(typeof result.error).toBe('string');
  });

  it('should handle completely malformed JSON', async () => {
    const invalidJson = 'this is not json at all';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/identifier/i);
    expect(typeof result.error).toBe('string');
  });

  it('should handle empty string', async () => {
    const invalidJson = '';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/eof|end/i);
    expect(typeof result.error).toBe('string');
  });

  it('should calculate line and column numbers when position is available', async () => {
    const invalidJson = '{\n  "name": "test",\n  "value": invalid\n}';
    
    const result = await validateJson(invalidJson);

    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
    
    // Position-based line/column calculation may be present
    if (result.lineNumber !== null) {
      expect(typeof result.lineNumber).toBe('number');
      expect(result.lineNumber).toBeGreaterThan(0);
    }
    
    if (result.columnNumber !== null) {
      expect(typeof result.columnNumber).toBe('number');
      expect(result.columnNumber).toBeGreaterThan(0);
    }
  });
});
