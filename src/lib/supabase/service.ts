import { createClient } from '@supabase/supabase-js';

let serviceClient: ReturnType<typeof createClient> | null = null;

export function getServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return serviceClient;
}
