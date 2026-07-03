import { playmeDb } from './db';

export function isOnline(): boolean {
  return navigator.onLine;
}

export async function queueSyncAction(
  action: 'insert' | 'update' | 'delete',
  tableName: string,
  recordKey: string,
  data: any
): Promise<void> {
  // Offline / sync logic: since we removed Firebase and Supabase,
  // we do not sync with an external database. Everything remains safely persisted locally in IndexedDB.
  console.log(`[Sync Engine] Registered ${action} action on ${tableName}/${recordKey} locally.`);
}

export async function triggerSync(): Promise<void> {
  // No-op for local-only operation
}

export async function pullRemoteChanges(userId: string): Promise<void> {
  // No-op for local-only operation
}
