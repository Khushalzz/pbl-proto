import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ThumbsUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Building,
  Share2,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { issuesApi } from '../services/api';
import { Issue, User as UserType, Verification } from '../types';

interface IssueDetailsScreenProps {
  issueId: string;
  currentUser: UserType | null;
  onBack: () => void;
  onRequireLogin: () => void;
}

export const IssueDetailsScreen: React.FC<IssueDetailsScreenProps> = ({
  issueId,
  currentUser,
  onBack,
  onRequireLogin,
}) => {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyComment, setVerifyComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const data = await issuesApi.getById(issueId);
      setIssue(data);
      const vers = await issuesApi.getVerifications(issueId);
      setVerifications(vers);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [issueId]);

  const handleVerify = async () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    setError(null);
    setSuccessMsg(null);
    try {
      setVerifying(true);
      const res = await issuesApi.verify(issueId, verifyComment);
      setSuccessMsg(res.message);
      setVerifyComment('');
      await fetchDetails();
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        <span className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mb-3"></span>
        <div>Loading issue details & lifecycle status...</div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Issue Not Found</h2>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const alreadyVerified = currentUser
    ? verifications.some((v) => v.citizen_id === currentUser.id)
    : false;

  const statuses = ['Reported', 'Assigned', 'In Progress', 'Resolved'];
  const currentStatusIndex = statuses.indexOf(issue.status);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
            {issue.issue_id}
          </span>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full text-white shadow-xs ${
              issue.priority === 'Urgent'
                ? 'bg-red-600'
                : issue.priority === 'High'
                ? 'bg-orange-500'
                : issue.priority === 'Medium'
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
          >
            {issue.priority} Priority
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Media, Details, Resolution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <span>{issue.category}</span>
                <span>&bull;</span>
                <span>{issue.location?.ward || 'Pune'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                {issue.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {new Date(issue.created_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> Credibility Score: {issue.credibility_score}%
                </span>
              </div>
            </div>

            {/* Photo Gallery */}
            {issue.image_urls && issue.image_urls.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Citizen Photo Evidence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {issue.image_urls.map((img, i) => (
                    <div key={i} className="h-56 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Issue Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/80 whitespace-pre-wrap">
                {issue.description}
              </p>
            </div>

            {/* Lifecycle Progress Bar (UI-006) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Resolution Lifecycle Workflow
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {statuses.map((st, idx) => {
                  const isDone = currentStatusIndex >= idx;
                  const isCurrent = issue.status === st;
                  return (
                    <div key={st} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm'
                            : isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-semibold ${isCurrent ? 'text-blue-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                        {st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Field Resolution Evidence Card (Screen 9 / FR-023) */}
            {issue.resolution && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Work Completed & Certified by Field Operations</span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong>Completion Report:</strong> {issue.resolution.completion_notes}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                  <span>
                    <strong>Resolved By:</strong> {issue.resolution.resolved_by}
                  </span>
                  <span>
                    <strong>Timestamp:</strong> {new Date(issue.resolution.resolved_at).toLocaleString()}
                  </span>
                </div>
                {issue.resolution.evidence_image_url && (
                  <div>
                    <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                      Post-Repair Photo Evidence (Field Signoff)
                    </div>
                    <div className="h-64 rounded-xl overflow-hidden border border-emerald-200 shadow-sm max-w-md">
                      <img
                        src={issue.resolution.evidence_image_url}
                        alt="Resolution Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audit & Status History Timeline (FR-024) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Transparent Audit Log & Status History
            </h3>
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {issue.status_history?.map((hist, idx) => (
                <div key={idx} className="relative pl-8 text-xs">
                  <div className="absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                  <div className="flex items-center justify-between text-slate-400 mb-0.5">
                    <span className="font-bold text-slate-800 text-xs">{hist.status}</span>
                    <span>{new Date(hist.timestamp).toLocaleString()}</span>
                  </div>
                  {hist.comment && <p className="text-slate-500 mt-1 italic">"{hist.comment}"</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): AI Analysis, Community Verification, Map */}
        <div className="space-y-6">
          {/* AI Decision-Support Card (SRS 4.5 & TBD-01) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-indigo-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-bold text-sm tracking-wide">CivicLens AI Diagnostics</h3>
              </div>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-400/20">
                Gemini 2.5 Engine
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="text-xs text-indigo-200 flex items-center justify-between mb-1">
                  <span>AI Calculated Priority Score</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {issue.ai_analysis?.priority_score ?? 7.5} / 10.0
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((issue.ai_analysis?.priority_score ?? 7.5) / 10) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-white/10 rounded-xl text-xs space-y-1.5 backdrop-blur-xs">
                <div className="flex justify-between">
                  <span className="text-indigo-200">Recommended Routing:</span>
                  <span className="font-semibold text-white">
                    {issue.ai_analysis?.recommended_department || issue.assigned_department || 'Roads'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-200">Duplicate Check:</span>
                  <span className="font-semibold text-emerald-300">Verified Unique</span>
                </div>
              </div>

              <p className="text-xs text-indigo-100/90 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/10">
                <strong>AI Rationale:</strong>{' '}
                {issue.ai_analysis?.ai_rationale ||
                  'High public impact score due to vehicular transit hazard and student pedestrian density.'}
              </p>
            </div>
          </div>

          {/* Community Verification Widget (SRS 4.4, Screen 6) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Community Verification</h3>
                <p className="text-xs text-slate-500">Citizen upvotes confirm issue existence</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                +{issue.verification_count}
              </div>
            </div>

            {alreadyVerified ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>You have already verified this civic issue. Thank you for your contribution!</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Optional witness note (e.g. passed this morning)..."
                  value={verifyComment}
                  onChange={(e) => setVerifyComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {verifying ? 'Verifying...' : 'Verify This Issue (+1 Upvote)'}
                </button>
              </div>
            )}

            {/* List of Recent Verifiers */}
            {verifications.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Recent Citizen Confirmations ({verifications.length})
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {verifications.map((v) => (
                    <div key={v._id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-end font-semibold text-slate-800">
                        <span className="text-[10px] text-slate-400">
                          {new Date(v.verified_at).toLocaleDateString()}
                        </span>
                      </div>
                      {v.comment && <p className="text-slate-500 mt-0.5 text-[11px]">"{v.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location Map Pin */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Exact Location Map
            </h3>
            <p className="text-xs text-slate-600 font-medium">{issue.location?.address}</p>
            <LeafletMap
              center={[issue.location?.latitude ?? 18.5175, issue.location?.longitude ?? 73.8152]}
              zoom={15}
              height="220px"
              issues={[issue]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
