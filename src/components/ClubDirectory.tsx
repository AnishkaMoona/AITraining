import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  Check,
  Plus,
  ExternalLink,
  Mail,
  ShieldCheck,
  Bot,
  MessageSquare,
  Sparkles,
  Palette,
  Code,
  Compass,
  Award,
  Video,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { ClubInfo, SchoolEvent, RSVPStatus } from '../types';

interface ClubDirectoryProps {
  clubs: ClubInfo[];
  events: SchoolEvent[];
  onSelectEvent: (event: SchoolEvent) => void;
  onOpenNewEventModal: (prefillClubName?: string) => void;
  onUpdateRSVP: (eventId: string, status: RSVPStatus) => void;
  onToggleClubMembership: (clubId: string) => void;
  onSyncEventToGoogle: (event: SchoolEvent) => void;
}

export const ClubDirectory: React.FC<ClubDirectoryProps> = ({
  clubs,
  events,
  onSelectEvent,
  onOpenNewEventModal,
  onUpdateRSVP,
  onToggleClubMembership,
  onSyncEventToGoogle,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyMyClubs, setOnlyMyClubs] = useState<boolean>(false);

  // Map icon strings to Lucide components
  const renderClubIcon = (iconName: string) => {
    switch (iconName) {
      case 'Bot':
        return <Bot className="w-5 h-5" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  // Filter clubs
  const filteredClubs = clubs.filter((club) => {
    if (onlyMyClubs && !club.isMember) return false;
    if (selectedCategory !== 'all' && club.category !== selectedCategory) return false;
    return true;
  });

  // Get upcoming club meetings for a club
  const getClubUpcomingMeetings = (clubName: string) => {
    return events
      .filter(
        (ev) =>
          ev.type === 'club_meeting' &&
          (ev.courseOrClub.toLowerCase().includes(clubName.toLowerCase()) ||
            clubName.toLowerCase().includes(ev.courseOrClub.toLowerCase()))
      )
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  };

  const categories = ['all', 'STEM', 'Arts & Culture', 'Leadership', 'Athletics & Outdoors'];

  return (
    <div className="space-y-6">
      {/* Directory Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-indigo-200 border border-white/10">
            Campus Student Life
          </span>
          <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Clubs, Societies & Meetups
          </h2>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed">
            Discover student organizations, RSVP to upcoming general meetings, track workshop dates,
            and push club gatherings directly to your Google Calendar.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Switcher bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer capitalize shrink-0 ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat === 'all' ? 'All Organizations' : cat}
            </button>
          ))}
        </div>

        {/* Member filter toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyMyClubs}
              onChange={(e) => setOnlyMyClubs(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
            />
            <span>Show Only Joined Clubs</span>
          </label>

          <button
            onClick={() => onOpenNewEventModal()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Club Meeting</span>
          </button>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClubs.map((club) => {
          const upcomingMeetings = getClubUpcomingMeetings(club.name);

          return (
            <div
              key={club.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col hover:border-slate-300 transition-all"
            >
              {/* Top Banner & Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                      {renderClubIcon(club.iconName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${club.badgeColor}`}>
                          {club.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {club.membersCount} members
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                        {club.name}
                      </h3>
                    </div>
                  </div>

                  {/* Join / Leave Button */}
                  <button
                    onClick={() => onToggleClubMembership(club.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      club.isMember
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                    }`}
                  >
                    {club.isMember ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Member</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Join Club</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {club.description}
                </p>

                {/* Details bar */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {club.meetingSchedule}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {club.room}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    {club.leadName} ({club.leadEmail})
                  </span>
                </div>
              </div>

              {/* Upcoming Club Meetings Section */}
              <div className="bg-slate-50/80 p-5 mt-auto border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Upcoming Scheduled Meetings
                  </h4>
                  <button
                    onClick={() => onOpenNewEventModal(club.name)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    + Schedule Meeting
                  </button>
                </div>

                {upcomingMeetings.length === 0 ? (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                    No special meetings scheduled this week. Regular meeting: {club.meetingSchedule}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5
                              onClick={() => onSelectEvent(meeting)}
                              className="text-xs sm:text-sm font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
                            >
                              {meeting.title}
                            </h5>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {meeting.date} at {meeting.startTime} - {meeting.endTime || 'End'}
                              </span>
                              {meeting.isOnline && (
                                <span className="flex items-center gap-1 text-indigo-600 font-sans font-bold">
                                  <Video className="w-3 h-3" />
                                  Online
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => onSyncEventToGoogle(meeting)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer shrink-0"
                            title="Add to Google Calendar"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>

                        {/* RSVP bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {meeting.attendeesCount || 15} attending
                          </span>

                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                            <button
                              onClick={() => onUpdateRSVP(meeting.id, 'attending')}
                              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                meeting.rsvpStatus === 'attending'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Attending
                            </button>
                            <button
                              onClick={() => onUpdateRSVP(meeting.id, 'maybe')}
                              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                meeting.rsvpStatus === 'maybe'
                                  ? 'bg-amber-500 text-white font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Maybe
                            </button>
                            <button
                              onClick={() => onUpdateRSVP(meeting.id, 'declined')}
                              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                meeting.rsvpStatus === 'declined'
                                  ? 'bg-slate-500 text-white font-bold'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Can't Go
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
