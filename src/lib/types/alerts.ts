export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type CampaignChannel =
  | 'whatsapp'
  | 'instagram'
  | 'shelf_sign'
  | 'staff_script';

export type NotificationType =
  | 'weekly_plan_ready'
  | 'day_ahead_plan_ready'
  | 'recommendation_updated'
  | 'recommendation_cancelled'
  | 'urgent_alert'
  | 'watchlist_change';

export interface Alert {
  id: string;
  business_id: string;
  recommendation_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  created_at: string;
  acknowledged_at: string | null;
}

export interface Campaign {
  id: string;
  run_id: string;
  recommendation_id: string;
  channel: CampaignChannel;
  message: string;
  send_time: string;
  created_at: string;
}
