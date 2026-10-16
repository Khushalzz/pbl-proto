import React from 'react';
import { X, CheckCheck, Bell, ExternalLink } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onSelectIssueLink: (link: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onSelectIssueLink,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Notifications</h3>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {notifications.filter((n) => !n.read).length} new
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              title="Mark all as read"
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => {
                  if (!n.read) onMarkRead(n._id);
                  if (n.link) onSelectIssueLink(n.link);
                }}
                className={`p-3.5 rounded-xl border text-sm transition cursor-pointer relative ${
                  n.read
                    ? 'bg-white border-slate-200 opacity-75'
                    : 'bg-blue-50/70 border-blue-200 shadow-xs'
                }`}
              >
                {!n.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600"></span>
                )}
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  {n.title}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">{n.message}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                  {n.link && (
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      View <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
