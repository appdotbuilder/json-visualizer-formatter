
import { z } from 'zod';

// JSON processing input schema
export const jsonProcessInputSchema = z.object({
  jsonContent: z.string(),
  operation: z.enum(['validate', 'format', 'minify', 'sort-keys']),
  indentSize: z.number().int().min(1).max(8).optional().default(2),
  sortKeys: z.boolean().optional().default(false)
});

export type JsonProcessInput = z.infer<typeof jsonProcessInputSchema>;

// JSON processing result schema
export const jsonProcessResultSchema = z.object({
  success: z.boolean(),
  result: z.string().nullable(),
  error: z.string().nullable(),
  originalSize: z.number().int(),
  processedSize: z.number().int().nullable(),
  operation: z.enum(['validate', 'format', 'minify', 'sort-keys'])
});

export type JsonProcessResult = z.infer<typeof jsonProcessResultSchema>;

// File upload input schema
export const fileUploadInputSchema = z.object({
  fileName: z.string(),
  fileContent: z.string(),
  fileSize: z.number().int()
});

export type FileUploadInput = z.infer<typeof fileUploadInputSchema>;

// JSON validation result schema
export const jsonValidationResultSchema = z.object({
  isValid: z.boolean(),
  error: z.string().nullable(),
  lineNumber: z.number().int().nullable(),
  columnNumber: z.number().int().nullable()
});

export type JsonValidationResult = z.infer<typeof jsonValidationResultSchema>;
