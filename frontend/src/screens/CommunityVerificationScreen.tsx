import React, { useEffect, useState } from 'react';
import {
  ThumbsUp,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
  Award,
  ChevronRight,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { issuesApi } from '../services/api';
import { Issue, User } from '../types';

interface CommunityVerificationScreenProps {
  currentUser: User | null;
  onSelectIssue: (issueId: string) => void;
  onRequireLogin: () => void;
}

export const CommunityVerificationScreen: React.FC<CommunityVerificationScreenProps> = ({
  currentUser,
  onSelectIssue,
  onRequireLogin,
}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const data = await issuesApi.list();
      setIssues(data);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleVerify = async (e: React.MouseEvent, issueId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    try {
      setVerifyingId(issueId);
      setMessage(null);
      const res = await issuesApi.verify(issueId, 'Quick community upvote from verification portal.');
      setMessage(res.message);
      await fetchIssues();
    } catch (err: any) {
      setMessage(err.message || 'Verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (selectedCategory !== 'All' && iss.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        iss.title.toLowerCase().includes(q) ||
        iss.category.toLowerCase().includes(q) ||
        iss.location?.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold mb-3 tracking-wide">
            SRS Feature 4.4: Community Verification & Trust Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Verify Civic Issues in Your Neighborhood
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Community consensus prevents duplicate reports and drives rapid municipal dispatch. Every verified report increases issue credibility.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/20 flex items-center gap-3">
          <Award className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xs text-slate-300">Your Citizen Trust Score</div>
            <div className="text-xl font-black text-white">{currentUser?.trust_score ?? 100} Points</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Map & Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Panel (1 col) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" /> Nearby Issue Pins
            </h3>
            <span className="text-xs text-slate-400">{filteredIssues.length} found</span>
          </div>
          <LeafletMap
            issues={filteredIssues}
            height="540px"
            onSelectIssue={(iss) => onSelectIssue(iss._id)}
          />
        </div>

        {/* Issue Cards List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search issues or streets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Potholes</option>
              <option value="Garbage Accumulation">Garbage</option>
              <option value="Water Leakage">Water Leaks</option>
              <option value="Damaged Streetlight">Streetlights</option>
              <option value="Drainage Problem">Drainage</option>
              <option value="Traffic Signal Failure">Traffic Signals</option>
            </select>
          </div>

          {/* Cards */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading community issues...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-3xl border border-slate-200">
              No matching issues found for verification.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((iss) => (
                <div
                  key={iss._id}
                  onClick={() => onSelectIssue(iss._id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition p-5 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                      {iss.image_urls && iss.image_urls[0] ? (
                        <img src={iss.image_urls[0]} alt={iss.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-600">{iss.issue_id}</span>
                        <span className="text-[10px] bg-slate-100 font-bold px-2 py-0.5 rounded text-slate-600">
                          {iss.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            iss.priority === 'Urgent'
                              ? 'bg-red-100 text-red-700'
                              : iss.priority === 'High'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {iss.priority}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {iss.title}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{iss.location?.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-xs text-slate-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{iss.verification_count} verifications</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleVerify(e, iss._id)}
                      disabled={verifyingId === iss._id}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {verifyingId === iss._id ? 'Upvoting...' : 'Verify (+1)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
