
import { type JsonProcessInput, type JsonProcessResult } from '../schema';

// Helper function to recursively sort object keys
function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};
  
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  
  return sortedObj;
}

export async function processJson(input: JsonProcessInput): Promise<JsonProcessResult> {
  const originalSize = input.jsonContent.length;
  
  try {
    // Parse JSON to validate it first
    const parsedJson = JSON.parse(input.jsonContent);
    
    let result: string;
    
    switch (input.operation) {
      case 'validate':
        // For validation, return the original content as-is since it's valid
        result = input.jsonContent;
        break;
        
      case 'format':
        // Pretty-print with specified indentation
        result = JSON.stringify(parsedJson, null, input.indentSize);
        break;
        
      case 'minify':
        // Remove all unnecessary whitespace
        result = JSON.stringify(parsedJson);
        break;
        
      case 'sort-keys':
        // Sort object keys alphabetically, then format with indentation
        const sortedJson = sortObjectKeys(parsedJson);
        result = JSON.stringify(sortedJson, null, input.indentSize);
        break;
        
      default:
        throw new Error(`Unknown operation: ${input.operation}`);
    }
    
    return {
      success: true,
      result,
      error: null,
      originalSize,
      processedSize: result.length,
      operation: input.operation
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      originalSize,
      processedSize: null,
      operation: input.operation
    };
  }
}
