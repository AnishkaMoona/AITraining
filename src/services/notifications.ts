import { SchoolEvent, ReminderSettings, NotificationItem } from '../types';

/**
 * Play a high quality synthesized pleasant chime using browser Web Audio API
 */
export const playNotificationChime = (type: 'gentle' | 'urgent' = 'gentle') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'urgent') {
      // 3 ascending energetic notes
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
      });
    } else {
      // 2 gentle mellow tones
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.warn('AudioContext playback error:', e);
  }
};

/**
 * Check if the browser supports notifications
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request permission from user for desktop / push notifications
 */
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return 'denied';
  }
};

/**
 * Send a native browser push notification
 */
export const sendBrowserPushNotification = (
  title: string,
  options?: NotificationOptions & { soundType?: 'gentle' | 'urgent' }
): boolean => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      icon: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
      badge: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png',
      ...options,
    });

    if (options?.soundType) {
      playNotificationChime(options.soundType);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Failed to send browser notification:', error);
    return false;
  }
};

// Set of already fired alert keys to prevent re-firing in the current session
const firedAlerts = new Set<string>();

/**
 * Check upcoming events and trigger notifications according to user settings
 */
export const checkUpcomingReminders = (
  events: SchoolEvent[],
  settings: ReminderSettings,
  onNewNotification: (item: NotificationItem) => void
) => {
  const now = new Date();
  const nowMs = now.getTime();

  events.forEach((event) => {
    // Only check active (non-completed) events
    if (event.status === 'completed') return;

    if (event.type === 'club_meeting' && !settings.notifyClubMeetings) return;
    if ((event.type === 'deadline' || event.type === 'exam') && !settings.notifyDeadlines) return;

    // Compute event start date time
    const [year, month, day] = event.date.split('-').map(Number);
    const [hours, minutes] = (event.startTime || '09:00').split(':').map(Number);
    const eventTime = new Date(year, month - 1, day, hours, minutes, 0).getTime();

    const diffMinutes = Math.round((eventTime - nowMs) / (60 * 1000));

    // Check each alert threshold
    const offsets = event.reminderMinutesBefore || settings.reminderOffsets;

    offsets.forEach((offset) => {
      const alertKey = `${event.id}_${offset}_${event.date}`;
      if (firedAlerts.has(alertKey)) return;

      // Check if within window (e.g. within 2 minutes of the offset)
      if (diffMinutes <= offset && diffMinutes > offset - 10 && diffMinutes >= 0) {
        firedAlerts.add(alertKey);

        const timeLabel =
          offset >= 1440
            ? `${Math.round(offset / 1440)} day(s)`
            : offset >= 60
            ? `${Math.round(offset / 60)} hour(s)`
            : `${offset} minutes`;

        const title =
          event.type === 'deadline'
            ? `⚠️ Deadline Reminder: ${event.courseOrClub}`
            : event.type === 'exam'
            ? `🚨 Upcoming Exam: ${event.courseOrClub}`
            : `👥 Club Meeting: ${event.courseOrClub}`;

        const message = `"${event.title}" is due in ${timeLabel} at ${event.startTime}.`;

        // Create in-app notification
        const notificationItem: NotificationItem = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title,
          message,
          timestamp: new Date().toISOString(),
          read: false,
          type: event.type === 'deadline' || event.type === 'exam' ? 'deadline_urgent' : 'club_meeting',
          eventId: event.id,
        };
        onNewNotification(notificationItem);

        // Send browser notification if allowed
        if (settings.browserNotificationsEnabled) {
          sendBrowserPushNotification(title, {
            body: message,
            tag: alertKey,
            soundType: event.priority === 'urgent' ? 'urgent' : 'gentle',
          });
        }

        if (settings.soundEnabled && !settings.browserNotificationsEnabled) {
          playNotificationChime(event.priority === 'urgent' ? 'urgent' : 'gentle');
        }
      }
    });
  });
};
