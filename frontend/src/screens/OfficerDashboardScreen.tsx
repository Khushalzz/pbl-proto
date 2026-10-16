import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Filter,
  Sparkles,
  Edit3,
  Send,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
  X,
} from 'lucide-react';
import { officerApi } from '../services/api';
import { Issue, User } from '../types';

interface OfficerDashboardScreenProps {
  currentUser: User | null;
  onSelectIssue: (issueId: string) => void;
}

export const OfficerDashboardScreen: React.FC<OfficerDashboardScreenProps> = ({
  currentUser,
  onSelectIssue,
}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [engineers, setEngineers] = useState<Array<{ id: string; full_name: string; email: string; phone: string; department?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Assign Modal State (Screen 8: Team Assignment)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);
  const [targetDept, setTargetDept] = useState('Roads & Infrastructure');
  const [targetEngineer, setTargetEngineer] = useState('');
  const [targetPriority, setTargetPriority] = useState<string>('High');
  const [officerNotes, setOfficerNotes] = useState('');
  const [savingAssign, setSavingAssign] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await officerApi.getIssues();
      setIssues(data);
      const engs = await officerApi.getEngineers();
      setEngineers(engs);
      if (engs.length > 0) setTargetEngineer(engs[0].id);
    } catch (err) {
      console.error('Failed to load officer queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (iss: Issue) => {
    setActiveIssue(iss);
    setTargetDept(iss.assigned_department || iss.ai_analysis?.recommended_department || 'Roads & Infrastructure');
    setTargetPriority(iss.priority);
    setOfficerNotes('');
    if (iss.assigned_engineer_id) {
      setTargetEngineer(iss.assigned_engineer_id);
    } else if (engineers.length > 0) {
      setTargetEngineer(engineers[0].id);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIssue) return;
    try {
      setSavingAssign(true);
      setMessage(null);
      await officerApi.assignIssue(activeIssue._id, {
        department: targetDept,
        field_engineer_id: targetEngineer || undefined,
        priority: targetPriority,
        officer_notes: officerNotes,
      });
      setMessage(`Issue ${activeIssue.issue_id} successfully assigned to ${targetDept}.`);
      setActiveIssue(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Assignment failed.');
    } finally {
      setSavingAssign(false);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (selectedStatus !== 'All' && iss.status !== selectedStatus) return false;
    if (selectedPriority !== 'All' && iss.priority !== selectedPriority) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-semibold mb-3 tracking-wide">
            SRS Feature 4.6: Municipal Officer Dashboard & Issue Routing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Officer Issue Triage & Team Assignment
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Review incoming citizen reports, examine AI priority scores, adjust priorities, and assign tasks directly to municipal engineering teams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl border border-white/10 text-center">
            <div className="text-xs text-slate-400">Pending Review</div>
            <div className="text-xl font-black text-amber-400">
              {issues.filter((i) => i.status === 'Reported').length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl border border-white/10 text-center">
            <div className="text-xs text-slate-400">Active in Field</div>
            <div className="text-xl font-black text-blue-400">
              {issues.filter((i) => i.status === 'Assigned' || i.status === 'In Progress').length}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter and Queue Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter Queue:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold"
              >
                <option value="All">All Statuses</option>
                <option value="Reported">Reported (Unassigned)</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold"
              >
                <option value="All">All Priorities</option>
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">Loading municipal queue...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">No issues match the selected filters.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Issue ID & Details</th>
                  <th className="py-3 px-4">Location / Ward</th>
                  <th className="py-3 px-4">AI Score & Rec</th>
                  <th className="py-3 px-4">Current Priority</th>
                  <th className="py-3 px-4">Assigned Department / Engineer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((iss) => (
                  <tr key={iss._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-blue-600 text-[11px] mb-0.5">{iss.issue_id}</div>
                      <div className="font-bold text-slate-900 text-sm line-clamp-1">{iss.title}</div>
                      <div className="text-slate-500 text-[11px]">
                        {iss.category} &bull; {iss.verification_count} verifications
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-800 line-clamp-1">{iss.location?.address}</div>
                      <div className="text-slate-400 text-[11px]">{iss.location?.ward}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{iss.ai_analysis?.priority_score ?? 7.0} / 10</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        Rec: {iss.ai_analysis?.recommended_department || 'Roads'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          iss.priority === 'Urgent'
                            ? 'bg-red-100 text-red-700'
                            : iss.priority === 'High'
                            ? 'bg-orange-100 text-orange-700'
                            : iss.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {iss.priority}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {iss.assigned_department || <span className="text-amber-600 italic">Unassigned</span>}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {iss.assigned_engineer_id ? 'Field engineer assigned' : 'No field engineer assigned'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          iss.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : iss.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : iss.status === 'Assigned'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {iss.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => openAssignModal(iss)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Assign / Route
                      </button>
                      <button
                        onClick={() => onSelectIssue(iss._id)}
                        className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs transition cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Screen 8: Team Assignment & Priority Override Modal (FR-021, FR-022) */}
      {activeIssue && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setActiveIssue(null)} />

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-blue-600 uppercase">
                  {activeIssue.issue_id} &bull; {activeIssue.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">Municipal Team Assignment</h3>
              </div>
              <button
                onClick={() => setActiveIssue(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Recommendation Highlight */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <div>
                <strong>AI Suggested Priority:</strong> {activeIssue.ai_analysis?.predicted_priority} (Score:{' '}
                {activeIssue.ai_analysis?.priority_score}/10) &bull; Suggested Department:{' '}
                {activeIssue.ai_analysis?.recommended_department}
              </div>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Responsible Municipal Department *
                </label>
                <select
                  value={targetDept}
                  onChange={(e) => setTargetDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Solid Waste & Sanitation">Solid Waste & Sanitation</option>
                  <option value="Water Supply & Sewage">Water Supply & Sewage</option>
                  <option value="Electrical & Lighting">Electrical & Lighting</option>
                  <option value="Storm Water & Drainage">Storm Water & Drainage</option>
                  <option value="Traffic & Transportation">Traffic & Transportation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Assign Field Engineer *
                </label>
                <select
                  value={targetEngineer}
                  onChange={(e) => setTargetEngineer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Deploy to General Department Queue --</option>
                    {engineers.map((eng, index) => (
                      <option key={eng.id} value={eng.id}>
                        Field Engineer {index + 1} ({eng.department || 'Field Engineer'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Override (FR-021) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Officer Priority Override (FR-021)
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                  {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setTargetPriority(p)}
                      className={`py-2 rounded-xl border transition cursor-pointer ${
                        targetPriority === p
                          ? p === 'Urgent'
                            ? 'bg-red-600 text-white border-red-600'
                            : p === 'High'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Officer Instructions / Field Notes
                </label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="e.g. Inspect foundation crack and patch with cold mix before evening rush hour."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveIssue(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {savingAssign ? 'Dispatching...' : 'Confirm Assignment & Notify Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
