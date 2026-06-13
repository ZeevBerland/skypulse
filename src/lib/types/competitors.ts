export type CompetitorUpdateType =
  | 'promotion'
  | 'review_trend'
  | 'new_product'
  | 'price_change'
  | 'store_change'
  | 'news'
  | 'social_media'
  | 'other';

export interface CompetitorUpdate {
  id: string;
  business_id: string;
  competitor_name: string;
  competitor_address?: string;
  update_type: CompetitorUpdateType;
  title: string;
  summary: string;
  source_url?: string;
  relevance_score: number;
  ai_suggestion?: string;
  raw_json: unknown;
  discovered_at: string;
}
