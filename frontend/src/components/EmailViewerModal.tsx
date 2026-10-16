import React, { useEffect, useState } from 'react';
import { X, Mail, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { EmailLog } from '../types';
import { notificationApi } from '../services/api';

interface EmailViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailViewerModal: React.FC<EmailViewerModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailLog | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getEmailLogs();
      setEmails(data);
      if (data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      }
    } catch (err) {
      console.error('Failed to load email logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">CivicLens SMTP Email Dispatcher (Simulated)</h3>
              <p className="text-xs text-slate-400">SRS 4.8 / CI-005: Outgoing citizen & officer automated alert tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content split */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* List */}
          <div className="w-full md:w-1/3 border-r border-slate-200 overflow-y-auto bg-slate-50 p-2 space-y-2">
            {emails.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No outgoing emails recorded yet. Submit or update an issue to trigger automatic notifications!
              </div>
            ) : (
              emails.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedEmail(m)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedEmail === m
                      ? 'bg-white border-blue-500 shadow-sm'
                      : 'bg-white/80 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span className="truncate">{m.to}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Sent
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium truncate mb-1">{m.subject}</div>
                  <div className="text-[10px] text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>

          {/* Email View */}
          <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
            {selectedEmail ? (
              <div>
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Subject</div>
                  <h2 className="text-lg font-bold text-slate-900 mb-3">{selectedEmail.subject}</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-400 font-medium">To: </span>
                      <span className="font-semibold text-slate-800">{selectedEmail.to}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">From: </span>
                      <span className="font-semibold text-slate-800">{selectedEmail.from}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Time: </span>
                      <span className="text-slate-600">{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Delivery: </span>
                      <span className="text-emerald-700 font-semibold">{selectedEmail.status}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">Message Body</div>
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                    {selectedEmail.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Send className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm">Select an email to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
