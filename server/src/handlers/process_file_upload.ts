
import { type FileUploadInput, type JsonProcessResult } from '../schema';

export async function processFileUpload(input: FileUploadInput): Promise<JsonProcessResult> {
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    
    // Check file size limit
    if (input.fileSize > maxFileSize) {
        return {
            success: false,
            result: null,
            error: 'File size exceeds maximum limit of 10MB',
            originalSize: input.fileSize,
            processedSize: null,
            operation: 'validate'
        };
    }
    
    // Validate that fileSize matches actual content length
    if (input.fileSize !== input.fileContent.length) {
        return {
            success: false,
            result: null,
            error: 'File size mismatch: declared size does not match content length',
            originalSize: input.fileSize,
            processedSize: null,
            operation: 'validate'
        };
    }
    
    try {
        // Validate JSON content by parsing it
        const parsedJson = JSON.parse(input.fileContent);
        
        // Return formatted JSON as result (2-space indentation)
        const formattedJson = JSON.stringify(parsedJson, null, 2);
        
        return {
            success: true,
            result: formattedJson,
            error: null,
            originalSize: input.fileContent.length,
            processedSize: formattedJson.length,
            operation: 'validate'
        };
    } catch (error) {
        // Extract meaningful error information from JSON parse error
        let errorMessage = 'Invalid JSON format';
        
        if (error instanceof SyntaxError) {
            errorMessage = `JSON Parse Error: ${error.message}`;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        
        return {
            success: false,
            result: null,
            error: errorMessage,
            originalSize: input.fileContent.length,
            processedSize: null,
            operation: 'validate'
        };
    }
}
