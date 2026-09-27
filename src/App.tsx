import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  SchoolEvent,
  ClubInfo,
  NotificationItem,
  ReminderSettings,
  RSVPStatus,
} from './types';
import {
  getInitialEvents,
  INITIAL_CLUBS,
  INITIAL_NOTIFICATIONS,
} from './data/seedData';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebase';
import {
  syncEventToGoogleCalendar,
  deleteFromGoogleCalendar,
  exportEventsToICS,
} from './services/googleCalendar';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestPushPermission,
  sendBrowserPushNotification,
  playNotificationChime,
  checkUpcomingReminders,
} from './services/notifications';

import { Header } from './components/Header';
import { CalendarView } from './components/CalendarView';
import { DeadlineList } from './components/DeadlineList';
import { ClubDirectory } from './components/ClubDirectory';
import { EventModal } from './components/EventModal';
import { EventDetailModal } from './components/EventDetailModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Check, AlertCircle, Info, Calendar } from 'lucide-react';

const STORAGE_KEY_EVENTS = 'campuspulse_events_v2';
const STORAGE_KEY_CLUBS = 'campuspulse_clubs_v2';
const STORAGE_KEY_NOTIFS = 'campuspulse_notifs_v2';
const STORAGE_KEY_SETTINGS = 'campuspulse_settings_v2';

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'calendar' | 'deadlines' | 'clubs'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');

  // Primary Data State
  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
      return stored ? JSON.parse(stored) : getInitialEvents();
    } catch {
      return getInitialEvents();
    }
  });

  const [clubs, setClubs] = useState<ClubInfo[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CLUBS);
      return stored ? JSON.parse(stored) : INITIAL_CLUBS;
    } catch {
      return INITIAL_CLUBS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return {
      browserNotificationsEnabled: false,
      soundEnabled: true,
      reminderOffsets: [15, 60, 1440],
      notifyClubMeetings: true,
      notifyDeadlines: true,
    };
  });

  // Auth & Google sync state
  const [user, setUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Browser push notification state
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState<SchoolEvent | null>(null);
  const [initialDateForNewEvent, setInitialDateForNewEvent] = useState<string | undefined>(undefined);
  const [initialClubForNewEvent, setInitialClubForNewEvent] = useState<string | undefined>(undefined);

  const [selectedEventForDetail, setSelectedEventForDetail] = useState<SchoolEvent | null>(null);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);

  // Toast banner alert
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save events to localStorage', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLUBS, JSON.stringify(clubs));
    } catch (e) {
      console.warn('Failed to save clubs to localStorage', e);
    }
  }, [clubs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e);
    }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(reminderSettings));
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e);
    }
  }, [reminderSettings]);

  // Firebase Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sync push permission state
  useEffect(() => {
    const current = getNotificationPermission();
    setPermissionStatus(current);
    if (current === 'granted') {
      setReminderSettings((prev) => ({ ...prev, browserNotificationsEnabled: true }));
    }
  }, []);

  // Background check for upcoming reminders
  const handleNewNotification = useCallback((item: NotificationItem) => {
    setNotifications((prev) => [item, ...prev]);
  }, []);

  useEffect(() => {
    // Initial check
    checkUpcomingReminders(events, reminderSettings, handleNewNotification);

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      checkUpcomingReminders(events, reminderSettings, handleNewNotification);
    }, 30000);

    return () => clearInterval(interval);
  }, [events, reminderSettings, handleNewNotification]);

  // Auth Actions
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        showToast(`Connected to Google as ${result.user.displayName || 'student'}!`, 'success');
        // Add notification
        const welcomeItem: NotificationItem = {
          id: `notif_sync_${Date.now()}`,
          title: '🗓️ Google Calendar Connected',
          message: 'You can now synchronize academic deadlines and club meetings to your primary Google Calendar.',
          timestamp: new Date().toISOString(),
          read: false,
          type: 'sync_success',
        };
        handleNewNotification(welcomeItem);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      showToast(`Google Sign-in failed: ${message}`, 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      showToast('Signed out of Google account.', 'info');
    } catch (err: unknown) {
      console.error('Logout error:', err);
    }
  };

  // Push notification permission request
  const handleRequestPushPermission = async () => {
    const perm = await requestPushPermission();
    setPermissionStatus(perm);
    if (perm === 'granted') {
      setReminderSettings((prev) => ({ ...prev, browserNotificationsEnabled: true }));
      showToast('Browser Push Notifications enabled!', 'success');
      sendBrowserPushNotification('CampusPulse Reminders Active 🔔', {
        body: 'You will receive timely alerts for upcoming assignments and club meetings.',
        soundType: 'gentle',
      });
    } else if (perm === 'denied') {
      showToast('Push notifications were denied in your browser settings.', 'error');
    }
  };

  // Test notification button
  const handleTestNotification = () => {
    if (reminderSettings.soundEnabled) {
      playNotificationChime('urgent');
    }

    const testItem: NotificationItem = {
      id: `test_${Date.now()}`,
      title: '🔔 Test Reminder: CS 201 Lab Due',
      message: 'This is a sample alert preview. Your deadline notifications will appear like this!',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'deadline_urgent',
    };
    handleNewNotification(testItem);

    if (permissionStatus === 'granted') {
      sendBrowserPushNotification('🔔 CampusPulse Test Reminder', {
        body: 'This is a sample push alert. Your upcoming deadlines will notify you here!',
        soundType: 'urgent',
      });
      showToast('Test push notification sent to your desktop!', 'success');
    } else {
      showToast('Test notification added to notification center (Push permission not granted).', 'info');
    }
  };

  // Google Calendar Sync single event
  const handleSyncEventToGoogle = async (event: SchoolEvent) => {
    let token = await getAccessToken();

    if (!token) {
      // Need login first
      try {
        setIsSigningIn(true);
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          token = res.accessToken;
        }
      } catch (err) {
        showToast('Please sign in with Google to sync events.', 'error');
        setIsSigningIn(false);
        return;
      } finally {
        setIsSigningIn(false);
      }
    }

    if (!token) return;

    showToast(`Syncing "${event.title}" to Google Calendar...`, 'info');

    const result = await syncEventToGoogleCalendar(event, token);
    if (result.success && result.googleEventId) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                googleCalendarEventId: result.googleEventId,
                syncedWithGoogle: true,
                lastSyncedAt: new Date().toISOString(),
              }
            : e
        )
      );

      // If viewing detail modal, update it too
      if (selectedEventForDetail?.id === event.id) {
        setSelectedEventForDetail((prev) =>
          prev
            ? {
                ...prev,
                googleCalendarEventId: result.googleEventId,
                syncedWithGoogle: true,
                lastSyncedAt: new Date().toISOString(),
              }
            : null
        );
      }

      showToast(`Synced "${event.title}" with Google Calendar!`, 'success');
      handleNewNotification({
        id: `sync_${Date.now()}`,
        title: '✅ Synced to Google Calendar',
        message: `"${event.title}" is now synced with reminders in your Google Calendar.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'sync_success',
        eventId: event.id,
      });
    } else {
      showToast(`Google Calendar sync error: ${result.error || 'Failed to sync'}`, 'error');
    }
  };

  // Sync all events to Google
  const handleSyncAllEvents = async () => {
    let token = await getAccessToken();
    if (!token) {
      try {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          token = res.accessToken;
        }
      } catch {
        showToast('Please sign in with Google first.', 'error');
        return;
      }
    }

    if (!token) return;

    setIsSyncingAll(true);
    let successCount = 0;

    const updatedEvents = [...events];
    for (let i = 0; i < updatedEvents.length; i++) {
      const ev = updatedEvents[i];
      if (ev.status === 'completed') continue;

      const result = await syncEventToGoogleCalendar(ev, token);
      if (result.success && result.googleEventId) {
        updatedEvents[i] = {
          ...ev,
          googleCalendarEventId: result.googleEventId,
          syncedWithGoogle: true,
          lastSyncedAt: new Date().toISOString(),
        };
        successCount++;
      }
    }

    setEvents(updatedEvents);
    setIsSyncingAll(false);
    showToast(`Successfully synced ${successCount} event(s) to your Google Calendar!`, 'success');
  };

  // Save new or updated event
  const handleSaveEvent = async (
    eventData: Omit<SchoolEvent, 'id'>,
    existingId?: string
  ) => {
    let targetEvent: SchoolEvent;

    if (existingId) {
      targetEvent = {
        ...eventData,
        id: existingId,
      };
      setEvents((prev) => prev.map((e) => (e.id === existingId ? targetEvent : e)));
      showToast(`Updated "${eventData.title}"`, 'success');
    } else {
      targetEvent = {
        ...eventData,
        id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      };
      setEvents((prev) => [targetEvent, ...prev]);
      showToast(`Created "${eventData.title}"`, 'success');
    }

    // Auto-sync with Google Calendar if requested and user is connected
    const token = await getAccessToken();
    if (eventData.syncedWithGoogle && token) {
      syncEventToGoogleCalendar(targetEvent, token).then((res) => {
        if (res.success && res.googleEventId) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === targetEvent.id
                ? {
                    ...e,
                    googleCalendarEventId: res.googleEventId,
                    syncedWithGoogle: true,
                  }
                : e
            )
          );
        }
      });
    }
  };

  // Delete event with Google Calendar cleanup
  const handleDeleteEvent = async (eventId: string, googleCalendarEventId?: string) => {
    // If synced with Google Calendar, remove it via API
    if (googleCalendarEventId) {
      const token = await getAccessToken();
      if (token) {
        await deleteFromGoogleCalendar(googleCalendarEventId, token).catch((err) =>
          console.warn('Failed to delete Google event:', err)
        );
      }
    }

    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    showToast('Event removed successfully.', 'info');
  };

  // Toggle complete status
  const handleToggleComplete = (eventId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
    );

    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Toggle subtask checklist item
  const handleToggleSubtask = (eventId: string, subtaskId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const updatedSubtasks = e.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...e, subtasks: updatedSubtasks };
      })
    );

    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subtasks: prev.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          ),
        };
      });
    }
  };

  // Update club RSVP
  const handleUpdateRSVP = (eventId: string, status: RSVPStatus) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, rsvpStatus: status } : e))
    );
    if (selectedEventForDetail?.id === eventId) {
      setSelectedEventForDetail((prev) => (prev ? { ...prev, rsvpStatus: status } : null));
    }
    showToast(`RSVP updated to ${status}!`, 'success');
  };

  // Toggle club membership
  const handleToggleClubMembership = (clubId: string) => {
    setClubs((prev) =>
      prev.map((c) => {
        if (c.id !== clubId) return c;
        const isNowMember = !c.isMember;
        showToast(
          isNowMember ? `Joined ${c.name}!` : `Left ${c.name}`,
          isNowMember ? 'success' : 'info'
        );
        return {
          ...c,
          isMember: isNowMember,
          membersCount: isNowMember ? c.membersCount + 1 : Math.max(1, c.membersCount - 1),
        };
      })
    );
  };

  // Filter events by search query
  const searchedEvents = events.filter((ev) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ev.title.toLowerCase().includes(q) ||
      ev.courseOrClub.toLowerCase().includes(q) ||
      ev.description?.toLowerCase().includes(q) ||
      ev.location?.toLowerCase().includes(q) ||
      ev.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  // Calculate statistics for header
  const academicEvents = events.filter((e) => e.type === 'deadline' || e.type === 'exam');
  const pendingDeadlinesCount = academicEvents.filter((e) => e.status !== 'completed').length;
  const urgentDeadlinesCount = academicEvents.filter((e) => {
    if (e.status === 'completed') return false;
    const [y, m, d] = e.date.split('-').map(Number);
    const [hh, mm] = e.startTime.split(':').map(Number);
    const dt = new Date(y, m - 1, d, hh, mm);
    const diffHours = (dt.getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours >= 0;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs sm:text-sm font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        pendingDeadlinesCount={pendingDeadlinesCount}
        urgentDeadlinesCount={urgentDeadlinesCount}
        notifications={notifications}
        markNotificationAsRead={(id) =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          )
        }
        markAllNotificationsAsRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        onOpenNewEventModal={() => {
          setSelectedEventForEdit(null);
          setInitialDateForNewEvent(undefined);
          setInitialClubForNewEvent(undefined);
          setIsEventModalOpen(true);
        }}
        onOpenNotificationSettings={() => setIsNotificationSettingsOpen(true)}
        onOpenGoogleSyncModal={() => setIsGoogleSyncModalOpen(true)}
        onExportICS={() => exportEventsToICS(events)}
        hasPushPermission={permissionStatus === 'granted'}
        onTestNotification={handleTestNotification}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calendar' && (
          <CalendarView
            events={searchedEvents}
            onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
            onAddNewEventOnDate={(dateStr) => {
              setSelectedEventForEdit(null);
              setInitialDateForNewEvent(dateStr);
              setInitialClubForNewEvent(undefined);
              setIsEventModalOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
          />
        )}

        {activeTab === 'deadlines' && (
          <DeadlineList
            events={searchedEvents}
            onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
            onOpenNewEventModal={() => {
              setSelectedEventForEdit(null);
              setInitialDateForNewEvent(undefined);
              setInitialClubForNewEvent(undefined);
              setIsEventModalOpen(true);
            }}
            onToggleComplete={handleToggleComplete}
            onToggleSubtask={handleToggleSubtask}
            onSyncEventToGoogle={handleSyncEventToGoogle}
            isGoogleConnected={Boolean(user)}
          />
        )}

        {activeTab === 'clubs' && (
          <ClubDirectory
            clubs={clubs}
            events={searchedEvents}
            onSelectEvent={(ev) => setSelectedEventForDetail(ev)}
            onOpenNewEventModal={(prefillClubName) => {
              setSelectedEventForEdit(null);
              setInitialDateForNewEvent(undefined);
              setInitialClubForNewEvent(prefillClubName);
              setIsEventModalOpen(true);
            }}
            onUpdateRSVP={handleUpdateRSVP}
            onToggleClubMembership={handleToggleClubMembership}
            onSyncEventToGoogle={handleSyncEventToGoogle}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 CampusPulse • Student Event & Deadline Management Platform</p>
          <div className="flex items-center gap-4 font-medium">
            <button
              onClick={() => setIsNotificationSettingsOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Push Notification Settings
            </button>
            <span>•</span>
            <button
              onClick={() => setIsGoogleSyncModalOpen(true)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Google Calendar Sync
            </button>
            <span>•</span>
            <button
              onClick={() => exportEventsToICS(events)}
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Export .ics
            </button>
          </div>
        </div>
      </footer>

      {/* Event Create / Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={selectedEventForEdit}
        initialDate={initialDateForNewEvent}
        initialCourseOrClub={initialClubForNewEvent}
        isGoogleConnected={Boolean(user)}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEventForDetail}
        isOpen={Boolean(selectedEventForDetail)}
        onClose={() => setSelectedEventForDetail(null)}
        onEdit={(ev) => {
          setSelectedEventForEdit(ev);
          setIsEventModalOpen(true);
        }}
        onDelete={handleDeleteEvent}
        onToggleComplete={handleToggleComplete}
        onToggleSubtask={handleToggleSubtask}
        onUpdateRSVP={handleUpdateRSVP}
        onSyncToGoogle={handleSyncEventToGoogle}
        isGoogleConnected={Boolean(user)}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={() => setIsNotificationSettingsOpen(false)}
        settings={reminderSettings}
        onUpdateSettings={setReminderSettings}
        onRequestPermission={handleRequestPushPermission}
        onTestNotification={handleTestNotification}
        permissionStatus={permissionStatus}
      />

      {/* Google Calendar Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        isSigningIn={isSigningIn}
        events={events}
        onSyncAllEvents={handleSyncAllEvents}
        isSyncingAll={isSyncingAll}
      />
    </div>
  );
}
