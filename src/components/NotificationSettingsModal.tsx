import React from 'react';
import {
  X,
  Bell,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send
} from 'lucide-react';
import { ReminderSettings } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReminderSettings;
  onUpdateSettings: (newSettings: ReminderSettings) => void;
  onRequestPermission: () => Promise<void>;
  onTestNotification: () => void;
  permissionStatus: NotificationPermission;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onRequestPermission,
  onTestNotification,
  permissionStatus,
}) => {
  if (!isOpen) return null;

  const toggleOffset = (offset: number) => {
    const current = settings.reminderOffsets;
    const next = current.includes(offset)
      ? current.filter((o) => o !== offset)
      : [...current, offset];
    onUpdateSettings({ ...settings, reminderOffsets: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Reminder & Push Notifications
              </h3>
              <p className="text-xs text-slate-500">
                Configure real-time alerts for deadlines and club meetups.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Permission Status Box */}
          <div
            className={`p-4 rounded-2xl border flex flex-col gap-3 ${
              permissionStatus === 'granted'
                ? 'bg-emerald-50/60 border-emerald-200'
                : permissionStatus === 'denied'
                ? 'bg-rose-50/60 border-rose-200'
                : 'bg-indigo-50/60 border-indigo-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {permissionStatus === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Browser Push Permission: {permissionStatus.toUpperCase()}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {permissionStatus === 'granted'
                      ? 'Push notifications are enabled. You will receive native system alerts for upcoming events.'
                      : permissionStatus === 'denied'
                      ? 'Notifications are blocked in your browser settings. Please click the padlock or site settings in your address bar to allow notifications.'
                      : 'Enable browser notifications so you never miss an urgent homework deadline or club meeting.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {permissionStatus !== 'granted' && (
                <button
                  type="button"
                  onClick={onRequestPermission}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enable Push Notifications
                </button>
              )}

              <button
                type="button"
                onClick={onTestNotification}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-indigo-600" />
                <span>Send Test Notification</span>
              </button>
            </div>
          </div>

          {/* Sound alert toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Notification Sound Chime</p>
                <p className="text-[11px] text-slate-500">Play an audio chime when a reminder is triggered.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Event types to alert */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Alert Categories
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Academic Deadlines & Exams</p>
                  <p className="text-[11px] text-slate-500">Problem sets, essays, lab reports, and midterms</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyDeadlines}
                  onChange={(e) => onUpdateSettings({ ...settings, notifyDeadlines: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <div>
                  <p className="text-xs font-bold text-slate-800">Club Meetings & Gatherings</p>
                  <p className="text-[11px] text-slate-500">Society practices, tech panels, and workshops</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyClubMeetings}
                  onChange={(e) => onUpdateSettings({ ...settings, notifyClubMeetings: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
              </label>
            </div>
          </div>

          {/* Default Reminder Windows */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Default Reminder Alert Windows
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { offset: 15, label: '15 minutes before' },
                { offset: 60, label: '1 hour before' },
                { offset: 180, label: '3 hours before' },
                { offset: 1440, label: '24 hours (1 day) before' },
              ].map((item) => {
                const isSelected = settings.reminderOffsets.includes(item.offset);
                return (
                  <button
                    key={item.offset}
                    type="button"
                    onClick={() => toggleOffset(item.offset)}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
