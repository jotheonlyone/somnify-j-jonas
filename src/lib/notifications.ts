import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NotificationSettings, NotificationRule } from '../types';
import { getTodayDateString } from './sleepAnalysis';

export const NOTIFICATIONS_STORAGE_KEY = 'somnify_notifications';

// Weekdays in display order. Index 0 = Monday … 6 = Sunday.
export const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

// Notification id ranges (one native notification per rule × weekday)
const MORNING_ID_BASE = 1000;
const BEDTIME_ID_BASE = 2000;
// Ids used by the old (buggy) implementation – always cancelled for cleanup
const LEGACY_IDS = [101, 102];

export function createRuleId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: false,
  morningEnabled: true,
  morningRules: [{ id: 'morning-default', days: [...ALL_WEEKDAYS], time: '08:00' }],
  bedtimeEnabled: true,
  bedtimeRules: [{ id: 'bedtime-default', days: [...ALL_WEEKDAYS], time: '22:30' }],
};

/**
 * Load settings from localStorage and migrate the old format
 * ({ morningTime, bedtimeTime }) to the new rule-based format.
 */
export function loadNotificationSettings(): NotificationSettings {
  const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
  if (!saved) return DEFAULT_NOTIFICATIONS;

  try {
    const parsed = JSON.parse(saved);
    const settings: NotificationSettings = {
      enabled: !!parsed.enabled,
      morningEnabled: parsed.morningEnabled ?? true,
      bedtimeEnabled: parsed.bedtimeEnabled ?? true,
      morningRules: Array.isArray(parsed.morningRules)
        ? parsed.morningRules
        : [{ id: createRuleId(), days: [...ALL_WEEKDAYS], time: parsed.morningTime || '08:00' }],
      bedtimeRules: Array.isArray(parsed.bedtimeRules)
        ? parsed.bedtimeRules
        : [{ id: createRuleId(), days: [...ALL_WEEKDAYS], time: parsed.bedtimeTime || '22:30' }],
    };
    return settings;
  } catch (e) {
    return DEFAULT_NOTIFICATIONS;
  }
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(settings));
}

// Local notifications only work inside the native (Android) app
export async function isLocalNotificationsAvailable(): Promise<boolean> {
  try {
    return Capacitor.isNativePlatform();
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

// Cancel existing scheduled notifications (incl. legacy ids of the old implementation)
export async function cancelAllScheduledNotifications(): Promise<void> {
  const available = await isLocalNotificationsAvailable();
  if (!available) return;

  try {
    const pending = await LocalNotifications.getPending();
    const ids = new Set<number>(LEGACY_IDS);
    pending.notifications.forEach((n) => ids.add(n.id));
    await LocalNotifications.cancel({
      notifications: Array.from(ids).map((id) => ({ id })),
    });
  } catch (err) {
    console.warn('Error cancelling notifications:', err);
  }
}

// Check if today's sleep data is already logged in local storage
export function isTodaySleepLogged(): boolean {
  try {
    const todayStr = getTodayDateString();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('somnify_logs_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const logs = JSON.parse(raw);
          if (Array.isArray(logs) && logs.some((l: any) => l.date === todayStr)) {
            return true;
          }
        }
      }
    }
  } catch (e) {
    // Ignore error
  }
  return false;
}

// Convert our weekday index (0 = Mo … 6 = So) to Capacitor/Java weekday (1 = So, 2 = Mo … 7 = Sa)
function toCapacitorWeekday(day: number): number {
  return ((day + 1) % 7) + 1;
}

function buildRuleNotifications(
  rules: NotificationRule[],
  idBase: number,
  title: string,
  body: string,
  skipToday: boolean = false
): any[] {
  const result: any[] = [];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // 0 = Mo ... 6 = So

  rules.forEach((rule, ruleIndex) => {
    if (!rule.time || rule.days.length === 0) return;
    const [hour, minute] = rule.time.split(':').map(Number);
    rule.days.forEach((day) => {
      const notificationId = idBase + ruleIndex * 10 + day;
      const isToday = day === currentDayIndex;

      // If today's sleep log has already been entered, skip today's trigger
      // and schedule directly for next week so it never fires today.
      if (isToday && skipToday) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(hour, minute, 0, 0);

        result.push({
          id: notificationId,
          title,
          body,
          schedule: {
            at: nextWeek,
            allowWhileIdle: true,
          },
        });
      } else {
        result.push({
          id: notificationId,
          title,
          body,
          schedule: {
            // "on" = recurring calendar match. The native side always computes the
            // NEXT matching point in time, so it never fires immediately on app start.
            on: {
              weekday: toCapacitorWeekday(day),
              hour,
              minute,
              second: 0,
            },
            allowWhileIdle: true,
          },
        });
      }
    });
  });
  return result;
}

// Cancel any morning notification scheduled for today, and postpone to next week
export async function cancelTodayMorningNotifications(): Promise<void> {
  const available = await isLocalNotificationsAvailable();
  if (!available) return;

  try {
    const settings = loadNotificationSettings();
    if (!settings.enabled || !settings.morningEnabled) return;

    const now = new Date();
    const currentDayIndex = (now.getDay() + 6) % 7; // 0 = Mo ... 6 = So
    const notificationsToReschedule: any[] = [];
    const idsToCancel: number[] = [];

    settings.morningRules.forEach((rule, ruleIndex) => {
      if (!rule.time || rule.days.length === 0) return;
      if (!rule.days.includes(currentDayIndex)) return;

      const [hour, minute] = rule.time.split(':').map(Number);
      const notificationId = MORNING_ID_BASE + ruleIndex * 10 + currentDayIndex;
      idsToCancel.push(notificationId);

      // Postpone to next week at the same time
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(hour, minute, 0, 0);

      notificationsToReschedule.push({
        id: notificationId,
        title: 'Somnify · Morgenroutine',
        body: 'Guten Morgen! Trage jetzt deine Daten ein um Gewohnheiten zu erkennen.',
        schedule: {
          at: nextWeek,
          allowWhileIdle: true,
        },
      });
    });

    if (idsToCancel.length > 0) {
      await LocalNotifications.cancel({
        notifications: idsToCancel.map((id) => ({ id })),
      });
    }

    if (notificationsToReschedule.length > 0) {
      await LocalNotifications.schedule({
        notifications: notificationsToReschedule,
      });
    }
  } catch (err) {
    console.warn('Error cancelling today morning notifications:', err);
  }
}

// Schedule morning and bedtime notifications based on settings
export async function scheduleAppNotifications(
  settings: NotificationSettings,
  hasTodayLog: boolean = isTodaySleepLogged()
): Promise<void> {
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

    if (settings.morningEnabled) {
      notificationsToSchedule.push(
        ...buildRuleNotifications(
          settings.morningRules,
          MORNING_ID_BASE,
          'Somnify · Morgenroutine',
          'Guten Morgen! Trage jetzt deine Daten ein um Gewohnheiten zu erkennen.',
          hasTodayLog // Skip today if data was already logged!
        )
      );
    }

    if (settings.bedtimeEnabled) {
      notificationsToSchedule.push(
        ...buildRuleNotifications(
          settings.bedtimeRules,
          BEDTIME_ID_BASE,
          'Somnify · Schlafenszeit',
          'Es ist Zeit zu Schlafen. Mach dich Bettfertig.'
        )
      );
    }

    if (notificationsToSchedule.length > 0) {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    }
  } catch (err) {
    console.warn('Error scheduling notifications:', err);
  }
}

/**
 * Called once on app start: migrates old settings and replaces any notifications
 * that were scheduled with the old (buggy) `at` + `every` format.
 * Re-scheduling with `on` is safe – it never triggers an immediate notification.
 */
export async function syncNotificationsOnStartup(): Promise<void> {
  const settings = loadNotificationSettings();
  saveNotificationSettings(settings);
  await scheduleAppNotifications(settings, isTodaySleepLogged());
}
