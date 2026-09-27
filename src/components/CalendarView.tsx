import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Video,
  Plus,
  Bookmark,
  CalendarDays,
  Layers
} from 'lucide-react';
import { SchoolEvent, EventType } from '../types';

interface CalendarViewProps {
  events: SchoolEvent[];
  onSelectEvent: (event: SchoolEvent) => void;
  onAddNewEventOnDate?: (dateStr: string) => void;
  onToggleComplete: (eventId: string, currentStatus: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onSelectEvent,
  onAddNewEventOnDate,
  onToggleComplete,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (selectedTypeFilter === 'all') return true;
    return ev.type === selectedTypeFilter;
  });

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 7);
      setCurrentDate(prev);
    } else {
      const prev = new Date(currentDate);
      prev.setMonth(prev.getMonth() - 1);
      setCurrentDate(prev);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 7);
      setCurrentDate(next);
    } else {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + 1);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format date string YYYY-MM-DD
  const formatDateKey = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const todayKey = formatDateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  // Get events on a specific day
  const getEventsForDate = (dateKey: string) => {
    return filteredEvents.filter((ev) => ev.date === dateKey);
  };

  // Helper for type badges
  const getTypeBadge = (type: EventType) => {
    switch (type) {
      case 'deadline':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
          dot: 'bg-indigo-600',
          label: 'Deadline',
        };
      case 'club_meeting':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          dot: 'bg-emerald-600',
          label: 'Club Meeting',
        };
      case 'exam':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          dot: 'bg-rose-600',
          label: 'Exam',
        };
      case 'workshop':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
          dot: 'bg-amber-600',
          label: 'Workshop',
        };
    }
  };

  // Week days calculation for Week View
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day; // Sunday start
    const startOfWeek = new Date(curr.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }
    return weekDays;
  };

  // Calendar cells generation for Month View
  const renderMonthCells = () => {
    const cells = [];
    const totalSlots = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;

    for (let i = 0; i < totalSlots; i++) {
      let cellYear = year;
      let cellMonth = month;
      let cellDay: number;
      let isCurrentMonth = true;

      if (i < startDayOfWeek) {
        // Prev month
        cellDay = daysInPrevMonth - startDayOfWeek + i + 1;
        cellMonth = month - 1;
        if (cellMonth < 0) {
          cellMonth = 11;
          cellYear = year - 1;
        }
        isCurrentMonth = false;
      } else if (i >= startDayOfWeek + daysInMonth) {
        // Next month
        cellDay = i - (startDayOfWeek + daysInMonth) + 1;
        cellMonth = month + 1;
        if (cellMonth > 11) {
          cellMonth = 0;
          cellYear = year + 1;
        }
        isCurrentMonth = false;
      } else {
        cellDay = i - startDayOfWeek + 1;
      }

      const dateKey = formatDateKey(cellYear, cellMonth, cellDay);
      const isToday = dateKey === todayKey;
      const dayEvents = getEventsForDate(dateKey);

      cells.push(
        <div
          key={`cell_${i}_${dateKey}`}
          className={`min-h-[110px] sm:min-h-[125px] p-2 border-b border-r border-slate-200/80 transition-colors flex flex-col relative group ${
            isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-400'
          } ${isToday ? 'bg-indigo-50/20' : ''}`}
        >
          {/* Day Header */}
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                isToday
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : isCurrentMonth
                  ? 'text-slate-800'
                  : 'text-slate-400'
              }`}
            >
              {cellDay}
            </span>

            {/* Quick add button on hover */}
            {onAddNewEventOnDate && (
              <button
                onClick={() => onAddNewEventOnDate(dateKey)}
                title="Add event on this date"
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Event Chips */}
          <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[85px]">
            {dayEvents.slice(0, 3).map((ev) => {
              const badge = getTypeBadge(ev.type);
              const isDone = ev.status === 'completed';

              return (
                <div
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  className={`text-[11px] p-1.5 rounded-lg border leading-tight cursor-pointer transition-all flex items-center justify-between gap-1 shadow-2xs ${
                    isDone
                      ? 'bg-slate-100/90 text-slate-400 border-slate-200 line-through'
                      : badge.bg
                  }`}
                  title={`${ev.title} (${ev.startTime})`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDone ? 'bg-slate-400' : badge.dot}`} />
                    <span className="font-semibold truncate">
                      {ev.courseOrClub}
                    </span>
                    <span className="truncate hidden sm:inline text-slate-600">
                      {ev.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono shrink-0 text-slate-500">
                    {ev.startTime}
                  </span>
                </div>
              );
            })}

            {dayEvents.length > 3 && (
              <button
                onClick={() => onSelectEvent(dayEvents[3])}
                className="w-full text-center py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
              >
                +{dayEvents.length - 3} more
              </button>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-5">
      {/* Calendar Controls & Filter Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation & Month Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {monthNames[month]} {year}
          </h2>
        </div>

        {/* View mode toggle & Type Filter */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs overflow-x-auto">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                selectedTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('deadline')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTypeFilter === 'deadline'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Deadlines
            </button>
            <button
              onClick={() => setSelectedTypeFilter('club_meeting')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTypeFilter === 'club_meeting'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Clubs
            </button>
            <button
              onClick={() => setSelectedTypeFilter('exam')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                selectedTypeFilter === 'exam'
                  ? 'bg-white text-rose-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600"></span>
              Exams
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Month View Content */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid cells */}
          <div className="grid grid-cols-7 border-l border-t border-slate-200/40">
            {renderMonthCells()}
          </div>
        </div>
      )}

      {/* Week View Content */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {getWeekDays().map((day) => {
              const dateKey = formatDateKey(day.getFullYear(), day.getMonth(), day.getDate());
              const isToday = dateKey === todayKey;
              const dayEvents = getEventsForDate(dateKey);

              return (
                <div
                  key={dateKey}
                  className={`p-3 rounded-2xl border flex flex-col min-h-[300px] ${
                    isToday
                      ? 'bg-indigo-50/30 border-indigo-200 ring-2 ring-indigo-500/20'
                      : 'bg-slate-50/50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                    <div>
                      <p className="text-xs uppercase font-bold text-slate-500">
                        {day.toLocaleDateString(undefined, { weekday: 'short' })}
                      </p>
                      <p className={`text-base font-extrabold ${isToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <div className="text-center py-8 text-slate-300 text-xs">
                        No events
                      </div>
                    ) : (
                      dayEvents.map((ev) => {
                        const badge = getTypeBadge(ev.type);
                        const isDone = ev.status === 'completed';

                        return (
                          <div
                            key={ev.id}
                            onClick={() => onSelectEvent(ev)}
                            className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${
                              isDone ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60' : badge.bg
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                              <span className="font-bold text-slate-800">{ev.courseOrClub}</span>
                              <span className="font-mono">{ev.startTime}</span>
                            </div>
                            <p className="font-semibold text-slate-900 leading-tight line-clamp-2">
                              {ev.title}
                            </p>
                            {ev.location && (
                              <p className="text-[10px] text-slate-500 mt-1 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {ev.location}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View Content */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-6">
          <div className="space-y-4">
            {filteredEvents
              .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
              .map((ev) => {
                const badge = getTypeBadge(ev.type);
                const isDone = ev.status === 'completed';
                const isUrgent = ev.priority === 'urgent';

                return (
                  <div
                    key={ev.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isUrgent
                        ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(ev.id, ev.status);
                        }}
                        className={`p-1 mt-0.5 rounded-lg transition-colors cursor-pointer ${
                          isDone ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-emerald-600'
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelectEvent(ev)}>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-extrabold text-slate-800">
                            {ev.courseOrClub}
                          </span>
                          {ev.weightPercentage && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {ev.weightPercentage}% of Grade
                            </span>
                          )}
                          {isUrgent && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Urgent
                            </span>
                          )}
                        </div>

                        <h3 className={`text-sm sm:text-base font-bold text-slate-900 ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {ev.title}
                        </h3>

                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {ev.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {ev.date} at {ev.startTime}
                            {ev.endTime ? ` - ${ev.endTime}` : ''}
                          </span>
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {ev.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectEvent(ev)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer self-end sm:self-center shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
