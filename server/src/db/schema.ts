
import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

// Table for storing JSON processing history (optional feature)
export const jsonHistoryTable = pgTable('json_history', {
  id: serial('id').primaryKey(),
  original_content: text('original_content').notNull(),
  processed_content: text('processed_content'),
  operation: text('operation').notNull(),
  success: boolean('success').notNull(),
  error_message: text('error_message'),
  original_size: integer('original_size').notNull(),
  processed_size: integer('processed_size'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type JsonHistory = typeof jsonHistoryTable.$inferSelect;
export type NewJsonHistory = typeof jsonHistoryTable.$inferInsert;

// Export all tables for proper query building
export const tables = { jsonHistory: jsonHistoryTable };
