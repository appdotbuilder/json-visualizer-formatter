
import { db } from '../db';
import { jsonHistoryTable } from '../db/schema';
import { type JsonHistory } from '../db/schema';
import { desc } from 'drizzle-orm';

export async function getJsonHistory(): Promise<JsonHistory[]> {
  try {
    const results = await db.select()
      .from(jsonHistoryTable)
      .orderBy(desc(jsonHistoryTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch JSON history:', error);
    throw error;
  }
}
