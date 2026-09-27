import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Video,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  Award,
  Bell,
  Share2,
  Flame
} from 'lucide-react';
import { SchoolEvent, RSVPStatus } from '../types';
import { generateGoogleCalendarWebLink, exportEventsToICS } from '../services/googleCalendar';
import { ConfirmationDialog } from './ConfirmationDialog';
import confetti from 'canvas-confetti';

interface EventDetailModalProps {
  event: SchoolEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: SchoolEvent) => void;
  onDelete: (eventId: string, googleCalendarEventId?: string) => void;
  onToggleComplete: (eventId: string, currentStatus: string) => void;
  onToggleSubtask: (eventId: string, subtaskId: string) => void;
  onUpdateRSVP: (eventId: string, status: RSVPStatus) => void;
  onSyncToGoogle: (event: SchoolEvent) => void;
  isGoogleConnected: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleSubtask,
  onUpdateRSVP,
  onSyncToGoogle,
  isGoogleConnected,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !event) return null;

  const isDone = event.status === 'completed';
  const isUrgent = event.priority === 'urgent';
  const isClub = event.type === 'club_meeting';

  const totalSubtasks = event.subtasks?.length || 0;
  const completedSubtasks = event.subtasks?.filter((s) => s.completed).length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleCompleteToggle = () => {
    if (!isDone) {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
    onToggleComplete(event.id, event.status);
  };

  const handleExportICS = () => {
    exportEventsToICS([event], `${event.courseOrClub}_${event.title.replace(/\s+/g, '_')}.ics`);
  };

  const googleWebLink = generateGoogleCalendarWebLink(event);

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Top colored strip based on type */}
          <div
            className={`h-2.5 w-full ${
              event.type === 'deadline'
                ? 'bg-indigo-600'
                : event.type === 'exam'
                ? 'bg-rose-600'
                : event.type === 'club_meeting'
                ? 'bg-emerald-600'
                : 'bg-amber-500'
            }`}
          />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {event.courseOrClub}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {event.type.replace('_', ' ')}
                </span>
                {event.weightPercentage && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    {event.weightPercentage}% of Grade
                  </span>
                )}
                {isUrgent && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    Urgent Priority
                  </span>
                )}
              </div>

              <h2
                className={`text-xl sm:text-2xl font-black text-slate-900 leading-tight ${
                  isDone ? 'line-through text-slate-400' : ''
                }`}
              >
                {event.title}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Date, Time & Location Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Date & Time
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                    {event.date}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {event.startTime} {event.endTime ? ` - ${event.endTime}` : ''}
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  {event.isOnline ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {event.isOnline ? 'Virtual Platform' : 'Location'}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 truncate mt-0.5">
                    {event.isOnline
                      ? 'Online (Zoom / Meet)'
                      : event.location || 'Campus / TBD'}
                  </p>
                  {event.isOnline && event.meetingLink && (
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1 mt-0.5 truncate"
                    >
                      Join Meeting Link <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Club RSVP Section */}
            {isClub && (
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Your Meeting RSVP
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Let the club officers know if you will attend.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                    {event.attendeesCount || 15} attending
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onUpdateRSVP(event.id, 'attending')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      event.rsvpStatus === 'attending'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-emerald-100/60 text-slate-700 border border-emerald-200'
                    }`}
                  >
                    ✓ Going
                  </button>
                  <button
                    onClick={() => onUpdateRSVP(event.id, 'maybe')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      event.rsvpStatus === 'maybe'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white hover:bg-amber-100/60 text-slate-700 border border-amber-200'
                    }`}
                  >
                    ? Maybe
                  </button>
                  <button
                    onClick={() => onUpdateRSVP(event.id, 'declined')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      event.rsvpStatus === 'declined'
                        ? 'bg-slate-700 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    ✕ Can't Go
                  </button>
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Event Details & Notes
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* Subtasks Checklist */}
            {totalSubtasks > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Checklist & Progress ({completedSubtasks}/{totalSubtasks})
                  </h4>
                  <span className="text-xs font-bold text-indigo-600 font-mono">
                    {progressPercent}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-3">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {event.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => onToggleSubtask(event.id, st.id)}
                      className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200 text-xs cursor-pointer hover:border-indigo-300 transition-colors"
                    >
                      {st.completed ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span
                        className={`text-slate-700 ${
                          st.completed ? 'line-through text-slate-400 font-normal' : 'font-medium'
                        }`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar & Export Integrations Section */}
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Calendar Sync & Export
              </h4>

              <div className="flex flex-wrap items-center gap-2">
                {/* Real Google Calendar REST API sync */}
                <button
                  type="button"
                  onClick={() => onSyncToGoogle(event)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-slate-200 hover:border-indigo-400 text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {event.syncedWithGoogle
                      ? 'Re-sync with Google Calendar'
                      : 'Push to Google Calendar'}
                  </span>
                </button>

                {/* Direct Google Calendar web link fallback */}
                <a
                  href={googleWebLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>Google Cal Web Link</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                {/* Download .ICS file */}
                <button
                  type="button"
                  onClick={handleExportICS}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-slate-500" />
                  <span>Download .ics</span>
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            {/* Mark Complete Button */}
            <button
              type="button"
              onClick={handleCompleteToggle}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isDone
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isDone ? 'Mark as Incomplete' : 'Mark Completed'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(event);
                }}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Edit Event"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Delete Event"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog for deleting user event (Required by Workspace Integration rules) */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Event"
        message={`Are you sure you want to permanently delete "${event.title}"? ${
          event.syncedWithGoogle
            ? 'This event will also be removed from your synced Google Calendar.'
            : ''
        }`}
        confirmLabel="Delete Permanently"
        isDestructive={true}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(event.id, event.googleCalendarEventId);
          onClose();
        }}
      />
    </>
  );
};
