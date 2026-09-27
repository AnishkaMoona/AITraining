import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Users,
  AlertCircle,
  Plus,
  Trash2,
  Bell,
  CheckCircle2,
  Video
} from 'lucide-react';
import { SchoolEvent, EventType, EventPriority, Subtask } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<SchoolEvent, 'id'>, existingId?: string) => void;
  initialEvent?: SchoolEvent | null;
  initialDate?: string;
  initialCourseOrClub?: string;
  isGoogleConnected: boolean;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  initialDate,
  initialCourseOrClub,
  isGoogleConnected,
}) => {
  const [type, setType] = useState<EventType>('deadline');
  const [title, setTitle] = useState('');
  const [courseOrClub, setCourseOrClub] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [priority, setPriority] = useState<EventPriority>('medium');
  const [weightPercentage, setWeightPercentage] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number[]>([15, 60]);
  const [syncToGoogleOnSave, setSyncToGoogleOnSave] = useState(true);

  // Initialize or reset form
  useEffect(() => {
    if (initialEvent) {
      setType(initialEvent.type);
      setTitle(initialEvent.title);
      setCourseOrClub(initialEvent.courseOrClub);
      setDescription(initialEvent.description || '');
      setDate(initialEvent.date);
      setStartTime(initialEvent.startTime || '17:00');
      setEndTime(initialEvent.endTime || '18:00');
      setLocation(initialEvent.location || '');
      setIsOnline(Boolean(initialEvent.isOnline));
      setMeetingLink(initialEvent.meetingLink || '');
      setPriority(initialEvent.priority);
      setWeightPercentage(initialEvent.weightPercentage ? String(initialEvent.weightPercentage) : '');
      setSubtasks(initialEvent.subtasks || []);
      setReminderMinutesBefore(initialEvent.reminderMinutesBefore || [15, 60]);
      setSyncToGoogleOnSave(Boolean(initialEvent.syncedWithGoogle || isGoogleConnected));
    } else {
      const today = new Date();
      const defaultDateStr =
        initialDate ||
        `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
          today.getDate()
        ).padStart(2, '0')}`;

      setType(initialCourseOrClub?.includes('Club') || initialCourseOrClub?.includes('Society') ? 'club_meeting' : 'deadline');
      setTitle('');
      setCourseOrClub(initialCourseOrClub || '');
      setDescription('');
      setDate(defaultDateStr);
      setStartTime('16:00');
      setEndTime('17:00');
      setLocation('');
      setIsOnline(false);
      setMeetingLink('');
      setPriority('medium');
      setWeightPercentage('');
      setSubtasks([]);
      setNewSubtaskTitle('');
      setReminderMinutesBefore([15, 60]);
      setSyncToGoogleOnSave(isGoogleConnected);
    }
  }, [initialEvent, initialDate, initialCourseOrClub, isOpen, isGoogleConnected]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const toggleReminderOffset = (offset: number) => {
    if (reminderMinutesBefore.includes(offset)) {
      setReminderMinutesBefore(reminderMinutesBefore.filter((o) => o !== offset));
    } else {
      setReminderMinutesBefore([...reminderMinutesBefore, offset]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseOrClub.trim() || !date) {
      alert('Please fill in required fields (Title, Course/Club, and Date).');
      return;
    }

    const payload: Omit<SchoolEvent, 'id'> = {
      title: title.trim(),
      type,
      courseOrClub: courseOrClub.trim(),
      description: description.trim(),
      date,
      startTime: startTime || '09:00',
      endTime: endTime || undefined,
      location: location.trim() || undefined,
      isOnline,
      meetingLink: isOnline ? meetingLink.trim() : undefined,
      priority,
      status: initialEvent?.status || 'pending',
      weightPercentage: weightPercentage ? Number(weightPercentage) : undefined,
      subtasks,
      reminderMinutesBefore,
      syncedWithGoogle: syncToGoogleOnSave,
    };

    onSave(payload, initialEvent?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {initialEvent ? 'Edit Event or Deadline' : 'Create New Campus Event'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Track deadlines, club meetings, and configure reminders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Event Type Switcher */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Event Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'deadline', label: 'Deadline', icon: BookOpen },
                { id: 'club_meeting', label: 'Club Meeting', icon: Users },
                { id: 'exam', label: 'Exam', icon: AlertCircle },
                { id: 'workshop', label: 'Workshop', icon: Calendar },
              ].map((item) => {
                const Icon = item.icon;
                const active = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as EventType)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title & Course/Club */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS 201 Lab 4, Robotics General Meeting..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {type === 'club_meeting' ? 'Club / Org *' : 'Course Code *'}
              </label>
              <input
                type="text"
                required
                placeholder={type === 'club_meeting' ? 'e.g. Robotics Club' : 'e.g. CS 201, MATH 240'}
                value={courseOrClub}
                onChange={(e) => setCourseOrClub(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Date & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {type === 'deadline' ? 'Due Time *' : 'Start Time *'}
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                End Time (Optional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
              />
            </div>
          </div>

          {/* Location & Online Option */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Location or Submission Portal
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>Online / Virtual Meeting</span>
              </label>
            </div>

            {isOnline ? (
              <div className="relative">
                <Video className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz or Zoom link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            ) : (
              <input
                type="text"
                placeholder="e.g. Turing Lab 304, Canvas Drop Box, Harlan Hall 1..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            )}
          </div>

          {/* Priority & Grade Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Urgency & Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'urgent'] as EventPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : p === 'high'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {(type === 'deadline' || type === 'exam') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Weight (% of Final Grade)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 15 for 15%"
                  value={weightPercentage}
                  onChange={(e) => setWeightPercentage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Add assignment rubric notes, agenda topics, or preparation materials..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Checklist / Subtasks Builder */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Subtasks & Milestones</span>
              <span className="text-[11px] font-normal text-slate-500">
                {subtasks.length} subtasks
              </span>
            </label>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                placeholder="e.g. Write intro paragraph, test corner cases..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <span className="text-slate-700">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Settings */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              Push & Audio Reminder Offsets
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { offset: 15, label: '15 mins before' },
                { offset: 60, label: '1 hour before' },
                { offset: 180, label: '3 hours before' },
                { offset: 1440, label: '1 day before' },
                { offset: 2880, label: '2 days before' },
              ].map((rem) => {
                const checked = reminderMinutesBefore.includes(rem.offset);
                return (
                  <button
                    key={rem.offset}
                    type="button"
                    onClick={() => toggleReminderOffset(rem.offset)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
                      checked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓ ' : '+ '} {rem.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Calendar Sync Option */}
          <div className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Sync with Google Calendar
                </p>
                <p className="text-[11px] text-slate-500">
                  {isGoogleConnected
                    ? 'Event will automatically be pushed to your primary Google Calendar.'
                    : 'Connect Google account or export as .ics anytime.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncToGoogleOnSave}
                onChange={(e) => setSyncToGoogleOnSave(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {initialEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
