import React, { useState } from 'react';
import {
  X,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Check,
  CalendarCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SchoolEvent } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isSigningIn: boolean;
  events: SchoolEvent[];
  onSyncAllEvents: () => Promise<void>;
  isSyncingAll: boolean;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
  isSigningIn,
  events,
  onSyncAllEvents,
  isSyncingAll,
}) => {
  if (!isOpen) return null;

  const syncedCount = events.filter((e) => e.syncedWithGoogle).length;
  const pendingCount = events.length - syncedCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full my-8 border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Google Calendar Integration
              </h3>
              <p className="text-xs text-slate-500">
                Keep your academic deadlines & club schedule synchronized.
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
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* User Status Card */}
          {user ? (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google Profile'}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {user.displayName ? user.displayName[0] : 'G'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {user.displayName || 'Connected Student'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                </div>
              </div>

              <button
                onClick={onSignOut}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Connect Your Google Account
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Sign in with Google to push homework deadlines, exams, and club meetings directly
                  into your Google Calendar with custom reminder alerts.
                </p>
              </div>

              <div>
                <GoogleSignInButton
                  onClick={onSignIn}
                  disabled={isSigningIn}
                  label={isSigningIn ? 'Connecting...' : 'Sign in with Google'}
                />
              </div>
            </div>
          )}

          {/* Sync Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Synced to Google
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-0.5">{syncedCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Events active in calendar</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Sync
              </p>
              <p className="text-2xl font-black text-indigo-600 mt-0.5">{pendingCount}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Events ready to push</p>
            </div>
          </div>

          {/* Bulk Sync Button */}
          {user && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">Batch Synchronization</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Push all unsynced deadlines and club meetings to your primary calendar at once.
                </p>
              </div>

              <button
                type="button"
                onClick={onSyncAllEvents}
                disabled={isSyncingAll}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                <span>{isSyncingAll ? 'Syncing...' : 'Sync All Events'}</span>
              </button>
            </div>
          )}

          {/* Quick link to Google Calendar */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Access your Google Calendar anytime:</span>
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
            >
              Open Google Calendar <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
