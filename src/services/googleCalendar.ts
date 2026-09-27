import { SchoolEvent } from '../types';

/**
 * Format date and time to ISO 8601 string in local time zone
 */
export const formatToDateTimeISO = (dateStr: string, timeStr?: string): string => {
  const time = timeStr && timeStr.trim().length > 0 ? timeStr : '09:00';
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date(year, month - 1, day, hours, minutes, 0);
  return d.toISOString();
};

/**
 * Build Google Calendar event payload from SchoolEvent
 */
export const buildGoogleCalendarPayload = (event: SchoolEvent) => {
  const startISO = formatToDateTimeISO(event.date, event.startTime);
  
  // Calculate end time (default to 1 hour after start if not provided)
  let endISO: string;
  if (event.endTime && event.endTime.trim().length > 0) {
    endISO = formatToDateTimeISO(event.date, event.endTime);
  } else {
    const d = new Date(startISO);
    d.setHours(d.getHours() + 1);
    endISO = d.toISOString();
  }

  const subtasksText = event.subtasks && event.subtasks.length > 0
    ? `\n\nChecklist:\n` + event.subtasks.map(s => `- [${s.completed ? 'x' : ' '}] ${s.title}`).join('\n')
    : '';

  const description = `${event.description || ''}\n\nType: ${event.type.toUpperCase()}\nCourse/Club: ${event.courseOrClub}\nPriority: ${event.priority.toUpperCase()}${event.weightPercentage ? `\nGrade Weight: ${event.weightPercentage}%` : ''}${subtasksText}\n\nManaged via CampusPulse`;

  const reminders = (event.reminderMinutesBefore && event.reminderMinutesBefore.length > 0)
    ? event.reminderMinutesBefore.map(minutes => ({
        method: minutes >= 1440 ? 'email' : 'popup',
        minutes: minutes,
      }))
    : [
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 60 },
      ];

  return {
    summary: `[${event.courseOrClub}] ${event.title}`,
    description,
    location: event.isOnline ? (event.meetingLink || 'Online (Zoom / Meet)') : (event.location || 'Campus'),
    start: {
      dateTime: startISO,
    },
    end: {
      dateTime: endISO,
    },
    reminders: {
      useDefault: false,
      overrides: reminders,
    },
    colorId: event.type === 'exam' ? '11' : event.type === 'deadline' ? '4' : '2',
  };
};

/**
 * Sync single event to Google Calendar via REST API
 */
export const syncEventToGoogleCalendar = async (
  event: SchoolEvent,
  accessToken: string
): Promise<{ success: boolean; googleEventId?: string; error?: string }> => {
  try {
    const payload = buildGoogleCalendarPayload(event);
    const isUpdate = Boolean(event.googleCalendarEventId);
    const url = isUpdate
      ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.googleCalendarEventId}`
      : 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Google Calendar API error (${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      googleEventId: data.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during Google Calendar sync';
    return {
      success: false,
      error: message,
    };
  }
};

/**
 * Delete event from Google Calendar via REST API
 */
export const deleteFromGoogleCalendar = async (
  googleCalendarEventId: string,
  accessToken: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleCalendarEventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok && res.status !== 404) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Failed to delete event (${res.status})`);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete from Google Calendar';
    return { success: false, error: message };
  }
};

/**
 * Fetch events from Google Calendar to check schedule conflicts
 */
export const fetchGoogleCalendarEvents = async (
  accessToken: string,
  timeMin?: string,
  timeMax?: string
) => {
  const min = timeMin || new Date().toISOString();
  const max = timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    min
  )}&timeMax=${encodeURIComponent(max)}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Google Calendar events: status ${res.status}`);
  }

  return await res.json();
};

/**
 * Generate a direct Google Calendar Add URL (works without API token!)
 */
export const generateGoogleCalendarWebLink = (event: SchoolEvent): string => {
  const startISO = formatToDateTimeISO(event.date, event.startTime);
  const endISO = event.endTime
    ? formatToDateTimeISO(event.date, event.endTime)
    : new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();

  const cleanStart = startISO.replace(/-|:|\.\d\d\d/g, '');
  const cleanEnd = endISO.replace(/-|:|\.\d\d\d/g, '');

  const text = encodeURIComponent(`[${event.courseOrClub}] ${event.title}`);
  const details = encodeURIComponent(
    `${event.description || ''}\n\nType: ${event.type}\nPriority: ${event.priority}`
  );
  const location = encodeURIComponent(
    event.isOnline ? (event.meetingLink || 'Online') : (event.location || '')
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${cleanStart}/${cleanEnd}&details=${details}&location=${location}`;
};

/**
 * Export events to .ics (iCalendar format)
 */
export const exportEventsToICS = (events: SchoolEvent[], filename = 'campus-schedule.ics') => {
  const formatDateForICS = (dateStr: string, timeStr?: string) => {
    const iso = formatToDateTimeISO(dateStr, timeStr);
    return iso.replace(/-|:|\.\d\d\d/g, '');
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusPulse//School Event Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:CampusPulse Schedule',
  ];

  events.forEach((ev) => {
    const dtStart = formatDateForICS(ev.date, ev.startTime);
    const dtEnd = formatDateForICS(ev.date, ev.endTime || '10:00');
    const now = new Date().toISOString().replace(/-|:|\.\d\d\d/g, '');

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:campuspulse-${ev.id}@campus.edu`);
    icsContent.push(`DTSTAMP:${now}`);
    icsContent.push(`DTSTART:${dtStart}`);
    icsContent.push(`DTEND:${dtEnd}`);
    icsContent.push(`SUMMARY:[${ev.courseOrClub}] ${ev.title.replace(/,/g, '\\,')}`);
    icsContent.push(`DESCRIPTION:${(ev.description || '').replace(/\n/g, '\\n')}`);
    if (ev.location) {
      icsContent.push(`LOCATION:${ev.location.replace(/,/g, '\\,')}`);
    }
    icsContent.push(`STATUS:${ev.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`);
    icsContent.push('BEGIN:VALARM');
    icsContent.push('TRIGGER:-PT30M');
    icsContent.push('ACTION:DISPLAY');
    icsContent.push(`DESCRIPTION:Reminder: ${ev.title}`);
    icsContent.push('END:VALARM');
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
