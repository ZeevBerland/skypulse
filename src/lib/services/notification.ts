import { v4 as uuidv4 } from 'uuid';
import type { Alert } from '@/lib/types/alerts';

export type NotificationType =
  | 'weekly_plan_ready'
  | 'day_ahead_plan_ready'
  | 'recommendation_updated'
  | 'recommendation_cancelled'
  | 'urgent_alert'
  | 'watchlist_change';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  link?: string;
}

let notifications: AppNotification[] = [];

export function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  severity: 'info' | 'warning' | 'error' = 'info',
  link?: string,
): AppNotification {
  const notification: AppNotification = {
    id: uuidv4(),
    type,
    title,
    message,
    severity,
    read: false,
    created_at: new Date().toISOString(),
    link,
  };
  notifications = [notification, ...notifications].slice(0, 50);
  return notification;
}

export function getNotifications(): AppNotification[] {
  return notifications;
}

export function getUnreadCount(): number {
  return notifications.filter(n => !n.read).length;
}

export function markAsRead(id: string): void {
  const n = notifications.find(n => n.id === id);
  if (n) n.read = true;
}

export function markAllAsRead(): void {
  notifications.forEach(n => { n.read = true; });
}

export function createAlertFromChange(
  businessId: string,
  recommendationId: string | null,
  severity: Alert['severity'],
  title: string,
  message: string,
): Alert {
  return {
    id: uuidv4(),
    business_id: businessId,
    recommendation_id: recommendationId || '',
    alert_type: 'signal_change',
    severity,
    title,
    message,
    created_at: new Date().toISOString(),
    acknowledged_at: null,
  };
}
