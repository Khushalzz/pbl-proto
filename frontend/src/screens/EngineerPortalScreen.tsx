import React, { useEffect, useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Camera,
  Upload,
  AlertTriangle,
  MapPin,
  ChevronRight,
  X,
  FileCheck,
} from 'lucide-react';
import { engineerApi, issuesApi } from '../services/api';
import { Issue, User } from '../types';

interface EngineerPortalScreenProps {
  currentUser: User | null;
  onSelectIssue: (issueId: string) => void;
}

export const EngineerPortalScreen: React.FC<EngineerPortalScreenProps> = ({
  currentUser,
  onSelectIssue,
}) => {
  const [tasks, setTasks] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Issue | null>(null);

  // Status update modal state
  const [newStatus, setNewStatus] = useState<'In Progress' | 'Resolved'>('In Progress');
  const [completionNotes, setCompletionNotes] = useState('');
  const [evidenceImageUrl, setEvidenceImageUrl] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await engineerApi.getTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load engineer tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openStatusModal = (task: Issue, targetStatus: 'In Progress' | 'Resolved') => {
    setSelectedTask(task);
    setNewStatus(targetStatus);
    setCompletionNotes(
      targetStatus === 'In Progress'
        ? 'Field crew arrived on site with materials and commenced work.'
        : 'Repairs completed and site cleared for pedestrian / vehicular safety.'
    );
    setEvidenceImageUrl(
      targetStatus === 'Resolved'
        ? 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&auto=format&fit=crop&q=80'
        : ''
    );
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setUploadingEvidence(true);
      const res = await issuesApi.uploadImage(e.target.files[0]);
      setEvidenceImageUrl(res.image_url);
    } catch (err: any) {
      alert(err.message || 'Evidence upload failed.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleSubmitStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      setUpdating(true);
      setMessage(null);
      await engineerApi.updateStatus(selectedTask._id, {
        status: newStatus,
        completion_notes: completionNotes,
        evidence_image_url: evidenceImageUrl || undefined,
      });
      setMessage(`Task ${selectedTask.issue_id} status updated to ${newStatus}.`);
      setSelectedTask(null);
      await fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold mb-3 tracking-wide">
            SRS Feature 4.6 & Screen 9: Field Engineer Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Field Operations & Repair Resolution
          </h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            {currentUser?.department || 'Roads & Infrastructure'} team. Update progress on site and certify completion with photo evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl border border-white/10 text-center">
            <div className="text-xs text-emerald-200">Pending Tasks</div>
            <div className="text-xl font-black text-white">
              {tasks.filter((t) => t.status !== 'Resolved' && t.status !== 'Closed').length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur px-4 py-3 rounded-2xl border border-white/10 text-center">
            <div className="text-xs text-emerald-200">Completed & Certified</div>
            <div className="text-xl font-black text-emerald-300">
              {tasks.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
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

      {/* Task Cards Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" /> Assigned Municipal Repair Work Orders
          </h2>
          <span className="text-xs text-slate-400">{tasks.length} total assignments</span>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">Loading engineer tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">No work orders currently assigned to you.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {task.issue_id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        task.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : task.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{task.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">{task.description}</p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{task.location?.address}</span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span>
                      Priority: <strong className="text-amber-700">{task.priority}</strong>
                    </span>
                    <span>
                      Verifications: <strong className="text-blue-700">{task.verification_count}</strong>
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectIssue(task._id)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    View Details
                  </button>

                  <div className="flex items-center gap-2">
                    {task.status !== 'In Progress' && task.status !== 'Resolved' && (
                      <button
                        onClick={() => openStatusModal(task, 'In Progress')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Start Work
                      </button>
                    )}

                    {task.status !== 'Resolved' && (
                      <button
                        onClick={() => openStatusModal(task, 'Resolved')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen 9: Field Engineer Resolution Modal (FR-023) */}
      {selectedTask && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedTask(null)} />

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 z-10 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 uppercase">
                  {selectedTask.issue_id} &bull; {selectedTask.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  Update Work Order: <span className="text-emerald-600">{newStatus}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Status Transition
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setNewStatus('In Progress')}
                    className={`py-2 rounded-xl border transition cursor-pointer ${
                      newStatus === 'In Progress'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('Resolved')}
                    className={`py-2 rounded-xl border transition cursor-pointer ${
                      newStatus === 'Resolved'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Resolved (Signoff)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Engineer Completion Notes / Report *
                </label>
                <textarea
                  required
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Detail repairs performed, materials used, and safety certification..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {newStatus === 'Resolved' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Post-Repair Proof Photo (FR-023)
                  </label>

                  {evidenceImageUrl ? (
                    <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 mb-2">
                      <img src={evidenceImageUrl} alt="Proof" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEvidenceImageUrl('')}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="p-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-emerald-500 bg-slate-50 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-700 transition cursor-pointer">
                      <Upload className="w-6 h-6 mb-1 text-slate-400" />
                      <span className="text-xs font-bold">Upload Resolution Photo Evidence</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleEvidenceUpload}
                        disabled={uploadingEvidence}
                      />
                    </label>
                  )}
                  {uploadingEvidence && (
                    <div className="text-xs text-emerald-600 font-semibold mt-1">Uploading proof photo...</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {updating ? 'Recording...' : 'Certify & Complete Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
