import { getServiceClient } from '@/lib/supabase/service';
import type { Business, BusinessCategory } from '@/lib/types/business';
import type { Recommendation, AgentRun } from '@/lib/types/recommendations';
import type { Event } from '@/lib/types/events';
import type { Alert } from '@/lib/types/alerts';
import type { CompetitorUpdate } from '@/lib/types/competitors';
import type { AppNotification } from '@/lib/services/notification';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

function supabase() {
  return getServiceClient();
}

// ─── Businesses ──────────────────────────────────────────────────────

export async function getBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase()
    .from('businesses')
    .select('*')
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as unknown as Business[];
}

export async function getBusinessById(id: string): Promise<Business | null> {
  const { data, error } = await supabase()
    .from('businesses')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Business | null;
}

export async function upsertBusiness(biz: Omit<Business, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<Business> {
  const row: AnyRow = {
    name: biz.name,
    business_type: biz.business_type,
    address: biz.address,
    lat: biz.lat,
    lng: biz.lng,
    timezone: biz.timezone,
    opening_hours_json: biz.opening_hours_json,
    updated_at: new Date().toISOString(),
  };
  if (biz.id) row.id = biz.id;

  const { data, error } = await supabase()
    .from('businesses')
    .upsert(row as never, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Business;
}

export async function deleteBusiness(id: string): Promise<void> {
  const { error } = await supabase()
    .from('businesses')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getBusinessCategories(businessId: string): Promise<BusinessCategory[]> {
  const { data, error } = await supabase()
    .from('business_categories')
    .select('*')
    .eq('business_id', businessId);
  if (error) throw error;
  return (data ?? []) as unknown as BusinessCategory[];
}

// ─── Agent Runs ──────────────────────────────────────────────────────

export async function saveAgentRun(run: AgentRun): Promise<AgentRun> {
  const { data, error } = await supabase()
    .from('agent_runs')
    .upsert(run as unknown as AnyRow as never, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as AgentRun;
}

export async function getAgentRuns(businessId: string): Promise<AgentRun[]> {
  const { data, error } = await supabase()
    .from('agent_runs')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as AgentRun[];
}

// ─── Recommendations ─────────────────────────────────────────────────

export async function saveRecommendations(recs: Recommendation[]): Promise<void> {
  if (recs.length === 0) return;
  const { error } = await supabase()
    .from('recommendations')
    .upsert(recs as unknown as AnyRow[] as never[], { onConflict: 'id' });
  if (error) throw error;
}

export async function getRecommendations(businessId: string): Promise<Recommendation[]> {
  const { data, error } = await supabase()
    .from('recommendations')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Recommendation[];
}

export async function getRecommendationsByDate(businessId: string, date: string): Promise<Recommendation[]> {
  const { data, error } = await supabase()
    .from('recommendations')
    .select('*')
    .eq('business_id', businessId)
    .eq('date', date)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Recommendation[];
}

export async function getRecommendationById(id: string): Promise<Recommendation | null> {
  const { data, error } = await supabase()
    .from('recommendations')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Recommendation | null;
}

export async function updateRecommendation(id: string, updates: Partial<Recommendation>): Promise<Recommendation | null> {
  const row: AnyRow = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase()
    .from('recommendations')
    .update(row as never)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Recommendation;
}

// ─── Plan Cache ──────────────────────────────────────────────────────

export async function savePlanCache(businessId: string, planType: string, responseJson: unknown): Promise<void> {
  const row: AnyRow = {
    business_id: businessId,
    plan_type: planType,
    response_json: responseJson,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase()
    .from('plan_cache')
    .upsert(row as never, { onConflict: 'business_id,plan_type' });
  if (error) throw error;
}

export async function getPlanCache(businessId: string, planType: string): Promise<unknown | null> {
  const { data, error } = await supabase()
    .from('plan_cache')
    .select('response_json')
    .eq('business_id', businessId)
    .eq('plan_type', planType)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as AnyRow)?.response_json ?? null;
}

// ─── Signal Snapshots ────────────────────────────────────────────────

export async function saveSignalSnapshot(snapshot: AnyRow): Promise<void> {
  const { error } = await supabase()
    .from('signal_snapshots')
    .insert(snapshot as never);
  if (error) throw error;
}

// ─── Signal Changes ──────────────────────────────────────────────────

export async function saveSignalChanges(changes: AnyRow[]): Promise<void> {
  if (changes.length === 0) return;
  const { error } = await supabase()
    .from('signal_changes')
    .insert(changes as never[]);
  if (error) throw error;
}

// ─── Alerts ──────────────────────────────────────────────────────────

export async function saveAlerts(alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;
  const { error } = await supabase()
    .from('alerts')
    .insert(alerts as unknown as AnyRow[] as never[]);
  if (error) throw error;
}

// ─── Events ──────────────────────────────────────────────────────────

/**
 * Converts a time value to a full ISO timestamp.
 * Handles "HH:MM", "HH:MM:SS", and already-complete ISO strings.
 */
function toTimestamptz(date: string, time: string): string {
  if (!time) return `${date}T00:00:00Z`;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    const t = time.length === 5 ? `${time}:00` : time;
    return `${date}T${t}Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(time)) return time;
  return `${date}T00:00:00Z`;
}

export async function saveEvents(events: Event[]): Promise<void> {
  if (events.length === 0) return;
  const rows: AnyRow[] = events.map(e => ({
    id: e.id,
    run_id: e.run_id || null,
    business_id: e.business_id,
    name: e.name,
    venue: e.venue,
    date: e.date,
    start_time: toTimestamptz(e.date, e.start_time),
    end_time: toTimestamptz(e.date, e.end_time),
    distance_km: e.distance_km,
    estimated_attendance: e.estimated_attendance,
    confidence: e.confidence,
    business_relevance: e.business_relevance,
    source_url: e.source_url,
    raw_json: e.raw_json,
  }));
  const { error } = await supabase()
    .from('events')
    .upsert(rows as never[], { onConflict: 'id' });
  if (error) throw error;
}

export async function getEventsByBusinessAndDateRange(
  businessId: string,
  startDate: string,
  endDate: string,
): Promise<Event[]> {
  const { data, error } = await supabase()
    .from('events')
    .select('*')
    .eq('business_id', businessId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

// ─── Competitor Updates ──────────────────────────────────────────────

export async function saveCompetitorUpdates(updates: CompetitorUpdate[]): Promise<void> {
  if (updates.length === 0) return;
  const rows: AnyRow[] = updates.map(u => ({
    id: u.id,
    business_id: u.business_id,
    competitor_name: u.competitor_name,
    competitor_address: u.competitor_address ?? null,
    update_type: u.update_type,
    title: u.title,
    summary: u.summary,
    source_url: u.source_url ?? null,
    relevance_score: u.relevance_score,
    ai_suggestion: u.ai_suggestion ?? null,
    raw_json: u.raw_json,
    discovered_at: u.discovered_at,
  }));
  const { error } = await supabase()
    .from('competitor_updates')
    .insert(rows as never[]);
  if (error) throw error;
}

export async function getCompetitorUpdates(businessId: string, limit = 50): Promise<CompetitorUpdate[]> {
  const { data, error } = await supabase()
    .from('competitor_updates')
    .select('*')
    .eq('business_id', businessId)
    .order('discovered_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as CompetitorUpdate[];
}

// ─── Notifications ───────────────────────────────────────────────────

export async function saveNotification(n: AppNotification): Promise<void> {
  const row: AnyRow = {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    severity: n.severity,
    read: n.read,
    link: n.link ?? null,
    created_at: n.created_at,
  };
  const { error } = await supabase()
    .from('notifications')
    .insert(row as never);
  if (error) throw error;
}

export async function getNotifications(limit = 50): Promise<AppNotification[]> {
  const { data, error } = await supabase()
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as AppNotification[];
}

export async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase()
    .from('notifications')
    .update({ read: true } as never)
    .eq('read', false);
  if (error) throw error;
}
