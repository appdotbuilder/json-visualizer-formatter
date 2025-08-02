
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { jsonHistoryTable } from '../db/schema';
import { type NewJsonHistory } from '../db/schema';
import { getJsonHistory } from '../handlers/get_json_history';

describe('getJsonHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no history exists', async () => {
    const result = await getJsonHistory();
    expect(result).toEqual([]);
  });

  it('should return JSON history records', async () => {
    // Insert test data
    const testData: NewJsonHistory = {
      original_content: '{"name":"test"}',
      processed_content: '{\n  "name": "test"\n}',
      operation: 'format',
      success: true,
      error_message: null,
      original_size: 15,
      processed_size: 23
    };

    await db.insert(jsonHistoryTable)
      .values(testData)
      .execute();

    const result = await getJsonHistory();

    expect(result).toHaveLength(1);
    expect(result[0].original_content).toEqual('{"name":"test"}');
    expect(result[0].processed_content).toEqual('{\n  "name": "test"\n}');
    expect(result[0].operation).toEqual('format');
    expect(result[0].success).toBe(true);
    expect(result[0].error_message).toBeNull();
    expect(result[0].original_size).toEqual(15);
    expect(result[0].processed_size).toEqual(23);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return history records ordered by created_at descending', async () => {
    // Insert multiple test records
    const testData1: NewJsonHistory = {
      original_content: '{"a":1}',
      processed_content: '{"a": 1}',
      operation: 'format',
      success: true,
      error_message: null,
      original_size: 7,
      processed_size: 9
    };

    const testData2: NewJsonHistory = {
      original_content: '{"b":2}',
      processed_content: '{"b":2}',
      operation: 'minify',
      success: true,
      error_message: null,
      original_size: 10,
      processed_size: 7
    };

    // Insert first record
    await db.insert(jsonHistoryTable)
      .values(testData1)
      .execute();

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second record
    await db.insert(jsonHistoryTable)
      .values(testData2)
      .execute();

    const result = await getJsonHistory();

    expect(result).toHaveLength(2);
    // Most recent should be first (descending order)
    expect(result[0].original_content).toEqual('{"b":2}');
    expect(result[1].original_content).toEqual('{"a":1}');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return history records with error messages', async () => {
    // Insert test data with error
    const testDataWithError: NewJsonHistory = {
      original_content: '{"invalid": json}',
      processed_content: null,
      operation: 'validate',
      success: false,
      error_message: 'Invalid JSON syntax',
      original_size: 18,
      processed_size: null
    };

    await db.insert(jsonHistoryTable)
      .values(testDataWithError)
      .execute();

    const result = await getJsonHistory();

    expect(result).toHaveLength(1);
    expect(result[0].success).toBe(false);
    expect(result[0].error_message).toEqual('Invalid JSON syntax');
    expect(result[0].processed_content).toBeNull();
    expect(result[0].processed_size).toBeNull();
  });
});
