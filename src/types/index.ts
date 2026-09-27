export type EventType = 'deadline' | 'club_meeting' | 'exam' | 'workshop';
export type EventPriority = 'urgent' | 'high' | 'medium' | 'low';
export type EventStatus = 'pending' | 'in_progress' | 'completed';
export type RSVPStatus = 'attending' | 'maybe' | 'declined';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface SchoolEvent {
  id: string;
  title: string;
  type: EventType;
  courseOrClub: string; // e.g. "CS 101", "Robotics Club", "MATH 201"
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime?: string; // HH:mm
  location?: string; // e.g. "Hall B, Room 204"
  isOnline?: boolean;
  meetingLink?: string;
  priority: EventPriority;
  status: EventStatus;
  weightPercentage?: number; // e.g. 20 for 20% of grade
  subtasks: Subtask[];
  rsvpStatus?: RSVPStatus;
  attendeesCount?: number;
  tags?: string[];
  reminderMinutesBefore?: number[]; // e.g. [15, 60, 1440]
  googleCalendarEventId?: string;
  syncedWithGoogle?: boolean;
  lastSyncedAt?: string;
  color?: string;
}

export interface ClubInfo {
  id: string;
  name: string;
  category: 'STEM' | 'Arts & Culture' | 'Academic' | 'Athletics & Outdoors' | 'Leadership';
  leadName: string;
  leadEmail: string;
  meetingSchedule: string; // e.g. "Every Wednesday at 5:00 PM"
  room: string;
  membersCount: number;
  description: string;
  badgeColor: string;
  iconName: string;
  isMember?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  type: 'deadline_urgent' | 'club_meeting' | 'sync_success' | 'general' | 'reminder';
  eventId?: string;
}

export interface ReminderSettings {
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  reminderOffsets: number[]; // e.g. [15, 60, 1440]
  notifyClubMeetings: boolean;
  notifyDeadlines: boolean;
}
