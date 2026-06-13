import type { NormalizedDaySignals } from '@/lib/services/signal-normalizer';

/**
 * In-memory signal snapshot cache for watchtower diffing.
 * Kept in-memory because real-time signal comparison needs instant access.
 * Signal snapshots are also persisted to Supabase for history.
 */
export const signalCache = new Map<string, NormalizedDaySignals>();
