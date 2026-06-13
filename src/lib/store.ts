/**
 * @deprecated — All data persistence now goes through Supabase (see src/lib/db.ts).
 * This file only re-exports the in-memory signal cache used for watchtower diffing.
 */
export { signalCache } from '@/lib/signal-cache';
