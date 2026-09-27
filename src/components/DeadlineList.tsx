import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Share2,
  CheckSquare,
  Square,
  Plus,
  ExternalLink,
  Filter,
  Flame,
  Award,
  BookOpen
} from 'lucide-react';
import { SchoolEvent, Subtask } from '../types';
import confetti from 'canvas-confetti';

interface DeadlineListProps {
  events: SchoolEvent[];
  onSelectEvent: (event: SchoolEvent) => void;
  onOpenNewEventModal: () => void;
  onToggleComplete: (eventId: string, currentStatus: string) => void;
  onToggleSubtask: (eventId: string, subtaskId: string) => void;
  onSyncEventToGoogle: (event: SchoolEvent) => void;
  isGoogleConnected: boolean;
}

export const DeadlineList: React.FC<DeadlineListProps> = ({
  events,
  onSelectEvent,
  onOpenNewEventModal,
  onToggleComplete,
  onToggleSubtask,
  onSyncEventToGoogle,
  isGoogleConnected,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'this_week' | 'completed'>('all');

  // Filter only academic deadlines and exams
  const academicEvents = events.filter((e) => e.type === 'deadline' || e.type === 'exam');

  // Get unique courses
  const uniqueCourses = Array.from(new Set(academicEvents.map((e) => e.courseOrClub)));

  // Current time helpers
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const calculateHoursRemaining = (dateStr: string, timeStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    const deadlineDate = new Date(y, m - 1, d, hh, mm);
    const diffMs = deadlineDate.getTime() - Date.now();
    return Math.round(diffMs / (1000 * 60 * 60));
  };

  // Filter logic
  const filteredDeadlines = academicEvents.filter((item) => {
    // Course filter
    if (selectedCourse !== 'all' && item.courseOrClub !== selectedCourse) {
      return false;
    }

    // Urgency filter
    if (urgencyFilter === 'completed') {
      return item.status === 'completed';
    }
    if (urgencyFilter === 'urgent') {
      if (item.status === 'completed') return false;
      const hours = calculateHoursRemaining(item.date, item.startTime);
      return hours <= 24 && hours >= -12;
    }
    if (urgencyFilter === 'this_week') {
      if (item.status === 'completed') return false;
      const hours = calculateHoursRemaining(item.date, item.startTime);
      return hours <= 168 && hours >= 0;
    }

    return true;
  });

  // Analytics summary
  const totalDeadlines = academicEvents.length;
  const completedDeadlines = academicEvents.filter((e) => e.status === 'completed').length;
  const pendingDeadlines = totalDeadlines - completedDeadlines;
  const urgentCount = academicEvents.filter((e) => {
    if (e.status === 'completed') return false;
    const hrs = calculateHoursRemaining(e.date, e.startTime);
    return hrs <= 24 && hrs >= 0;
  }).length;
  const totalGradeWeightTracked = academicEvents.reduce((acc, curr) => acc + (curr.weightPercentage || 0), 0);

  const handleCelebrateCompletion = (eventId: string, currentStatus: string) => {
    if (currentStatus !== 'completed') {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
      });
    }
    onToggleComplete(eventId, currentStatus);
  };

  return (
    <div className="space-y-6">
      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Tasks
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pendingDeadlines}</p>
            <p className="text-xs text-slate-500 mt-0.5">Across {uniqueCourses.length} courses</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Due in 24 Hours */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Due in &lt; 24h
            </p>
            <p className="text-2xl font-black text-rose-600 mt-1">{urgentCount}</p>
            <p className="text-xs text-rose-500 mt-0.5">Requires immediate focus</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Completed Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Finished
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {completedDeadlines}
              <span className="text-sm font-normal text-slate-400">/{totalDeadlines}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalDeadlines > 0
                ? `${Math.round((completedDeadlines / totalDeadlines) * 100)}% completion rate`
                : '0%'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Grade Weight on Line */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Grade Weight
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {totalGradeWeightTracked}%
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Total syllabus weight tracked</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Course Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCourse('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCourse === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Courses
          </button>
          {uniqueCourses.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCourse(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                selectedCourse === c
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Urgency Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setUrgencyFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                urgencyFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              All Active
            </button>
            <button
              onClick={() => setUrgencyFilter('urgent')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                urgencyFilter === 'urgent' ? 'bg-rose-50 text-rose-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Urgent &lt;24h
            </button>
            <button
              onClick={() => setUrgencyFilter('this_week')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                urgencyFilter === 'this_week' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setUrgencyFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                urgencyFilter === 'completed' ? 'bg-emerald-50 text-emerald-700 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Completed ({completedDeadlines})
            </button>
          </div>

          <button
            onClick={onOpenNewEventModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Deadline
          </button>
        </div>
      </div>

      {/* Deadlines Cards */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No deadlines found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {urgencyFilter === 'completed'
                ? "You haven't marked any deadlines as completed yet."
                : 'No pending deadlines match the selected filters.'}
            </p>
          </div>
        ) : (
          filteredDeadlines
            .sort((a, b) => {
              if (a.status === 'completed' && b.status !== 'completed') return 1;
              if (b.status === 'completed' && a.status !== 'completed') return -1;
              return (a.date + a.startTime).localeCompare(b.date + b.startTime);
            })
            .map((item) => {
              const isDone = item.status === 'completed';
              const hoursRemaining = calculateHoursRemaining(item.date, item.startTime);
              const isDueToday = item.date === todayStr;
              const isUrgent = hoursRemaining <= 24 && hoursRemaining >= 0 && !isDone;
              const isOverdue = hoursRemaining < 0 && !isDone;

              const totalSubtasks = item.subtasks?.length || 0;
              const completedSubtasks = item.subtasks?.filter((s) => s.completed).length || 0;
              const progressPercentage =
                totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                    isDone
                      ? 'border-slate-200 bg-slate-50/50 opacity-70'
                      : isUrgent
                      ? 'border-rose-300 ring-2 ring-rose-500/10'
                      : isOverdue
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    {/* Left: Complete Checkbox + Title + Meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleCelebrateCompletion(item.id, item.status)}
                        className={`mt-1 p-1 rounded-xl transition-all cursor-pointer ${
                          isDone
                            ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 ring-2 ring-emerald-500/30'
                            : 'text-slate-300 hover:text-emerald-600 hover:bg-slate-100'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete (Celebrate!)'}
                      >
                        <CheckCircle2 className="w-6 h-6" />
                      </button>

                      <div className="flex-1 min-w-0">
                        {/* Course badge, type, and grade weight */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 text-xs font-black rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.courseOrClub}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                            {item.type === 'exam' ? 'Major Exam' : 'Course Assignment'}
                          </span>
                          {item.weightPercentage && (
                            <span className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                              {item.weightPercentage}% of Final Grade
                            </span>
                          )}
                          {item.syncedWithGoogle && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Synced to Google
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          onClick={() => onSelectEvent(item)}
                          className={`text-base sm:text-lg font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors ${
                            isDone ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {item.title}
                        </h3>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Subtasks Progress Bar & Checklist */}
                        {totalSubtasks > 0 && (
                          <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-xl">
                            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                              <span className="text-slate-600">
                                Milestone Checklist ({completedSubtasks}/{totalSubtasks})
                              </span>
                              <span className="font-mono text-slate-700 font-bold">
                                {progressPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
                              <div
                                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {item.subtasks.map((st) => (
                                <div
                                  key={st.id}
                                  onClick={() => onToggleSubtask(item.id, st.id)}
                                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors"
                                >
                                  {st.completed ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                                  )}
                                  <span
                                    className={`${
                                      st.completed ? 'line-through text-slate-400' : ''
                                    }`}
                                  >
                                    {st.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Due Date & Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Due countdown badge */}
                      <div className="flex items-center gap-2">
                        {isDone ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Completed 🎉
                          </span>
                        ) : isDueToday ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            Due Today at {item.startTime}
                          </span>
                        ) : isOverdue ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            Past Due ({item.date})
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Due: {item.date} ({item.startTime})
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => onSyncEventToGoogle(item)}
                          title="Sync with Google Calendar"
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Google Cal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectEvent(item)}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-xl transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
