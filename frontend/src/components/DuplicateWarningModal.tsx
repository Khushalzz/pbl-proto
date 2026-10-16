import React from 'react';
import { AlertTriangle, ThumbsUp, ArrowRight, X, MapPin } from 'lucide-react';
import { Issue } from '../types';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchedIssue: Issue | null;
  confidence: number;
  rationale: string;
  onSupportExisting: (issue: Issue) => void;
  onProceedAnyway: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  onClose,
  matchedIssue,
  confidence,
  rationale,
  onSupportExisting,
  onProceedAnyway,
}) => {
  if (!isOpen || !matchedIssue) return null;

  const percent = Math.round(confidence * 100);

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 z-10 border border-amber-200">
        {/* Top Warning Banner */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Possible Duplicate Report Detected</h3>
              <p className="text-xs text-amber-700 font-medium">
                AI Match Confidence: <span className="font-bold">{percent}%</span> (SRS 4.3 AI Engine)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Rationale */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-xs text-amber-900 mb-4 leading-relaxed">
          <strong>AI Analysis:</strong> {rationale}
        </div>

        {/* Existing Matched Issue Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Existing Report: {matchedIssue.issue_id}
            </span>
            <span className="text-slate-500 font-medium">Status: {matchedIssue.status}</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm mb-1">{matchedIssue.title}</h4>
          <p className="text-xs text-slate-600 line-clamp-2 mb-3">{matchedIssue.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span className="truncate">{matchedIssue.location?.address}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Current Verifications: <strong className="text-blue-600">{matchedIssue.verification_count}</strong>
            </span>
            <span className="text-slate-600">
              Priority: <strong className="text-amber-600">{matchedIssue.priority}</strong>
            </span>
          </div>
        </div>

        {/* Action Choice Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onSupportExisting(matchedIssue)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <ThumbsUp className="w-4 h-4" />
            Support Existing Report (+1 Upvote)
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-sm flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Submit As Separate Issue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
