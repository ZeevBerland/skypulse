import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const globalForSupabase = globalThis as unknown as {
  supabaseServiceClient: SupabaseClient | undefined;
};

export function getServiceClient(): SupabaseClient {
  if (!globalForSupabase.supabaseServiceClient) {
    globalForSupabase.supabaseServiceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return globalForSupabase.supabaseServiceClient;
}
