import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationSettings } from '../types';

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: false,
  morningEnabled: true,
  morningTime: '08:00',
  bedtimeEnabled: true,
  bedtimeTime: '22:30',
};

// Check if Capacitor LocalNotifications is supported in current runtime
export async function isLocalNotificationsAvailable(): Promise<boolean> {
  try {
    return typeof LocalNotifications !== 'undefined' && !!LocalNotifications.requestPermissions;
  } catch (e) {
    return false;
  }
}

// Request permission
export async function requestNotificationPermissions(): Promise<boolean> {
  const available = await isLocalNotificationsAvailable();
  if (!available) {
    console.warn('Capacitor LocalNotifications is not available in browser runtime.');
    return true; // Gracefully allow UI state toggle without crash
  }

  try {
    const res = await LocalNotifications.requestPermissions();
    return res.display === 'granted';
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

// Cancel existing scheduled notifications
export async function cancelAllScheduledNotifications(): Promise<void> {
  const available = await isLocalNotificationsAvailable();
  if (!available) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }
  } catch (err) {
    console.warn('Error cancelling notifications:', err);
  }
}

// Schedule morning and bedtime notifications based on settings
export async function scheduleAppNotifications(settings: NotificationSettings): Promise<void> {
  const available = await isLocalNotificationsAvailable();
  if (!available) {
    console.log('Mocking schedule notification in browser:', settings);
    return;
  }

  try {
    // Clear previously scheduled notifications
    await cancelAllScheduledNotifications();

    if (!settings.enabled) return;

    const notificationsToSchedule: any[] = [];

    // Morning Routine Notification
    if (settings.morningEnabled && settings.morningTime) {
      const [h, m] = settings.morningTime.split(':').map(Number);
      const nextDate = getNextScheduledDate(h, m);

      notificationsToSchedule.push({
        id: 101,
        title: 'Somnify · Morgenroutine',
        body: 'Guten Morgen! Trage jetzt deine Daten ein um Gewohnheiten zu erkennen.',
        schedule: {
          at: nextDate,
          allowWhileIdle: true,
          every: 'day',
        },
      });
    }

    // Bedtime Notification
    if (settings.bedtimeEnabled && settings.bedtimeTime) {
      const [h, m] = settings.bedtimeTime.split(':').map(Number);
      const nextDate = getNextScheduledDate(h, m);

      notificationsToSchedule.push({
        id: 102,
        title: 'Somnify · Schlafenszeit',
        body: 'Es ist Zeit zu Schlafen. Mach dich Bettfertig.',
        schedule: {
          at: nextDate,
          allowWhileIdle: true,
          every: 'day',
        },
      });
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.warn('Error scheduling notifications:', err);
  }
}

function getNextScheduledDate(hour: number, minute: number): Date {
  const now = new Date();
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);

  if (scheduled.getTime() <= now.getTime()) {
    // Already passed today, schedule for tomorrow
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}
