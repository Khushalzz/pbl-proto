import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Filter,
  Search,
  ChevronRight,
  ExternalLink,
  MapPin,
  ThumbsUp,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { Issue, User } from '../types';
import { issuesApi } from '../services/api';

interface CitizenDashboardProps {
  currentUser: User | null;
  onNavigateReport: () => void;
  onNavigateVerify: () => void;
  onSelectIssue: (issueId: string) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  currentUser,
  onNavigateReport,
  onNavigateVerify,
  onSelectIssue,
}) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'pending' | 'resolved'>('all');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const myIssues = currentUser ? issues.filter((i) => i.reporter_id === currentUser.id) : [];
  const inProgressIssues = issues.filter((i) => i.status === 'In Progress' || i.status === 'Assigned');
  const resolvedIssues = issues.filter((i) => i.status === 'Resolved' || i.status === 'Closed');

  const filteredIssues = issues.filter((iss) => {
    if (activeTab === 'my' && currentUser && iss.reporter_id !== currentUser.id) return false;
    if (activeTab === 'pending' && (iss.status === 'Resolved' || iss.status === 'Closed')) return false;
    if (activeTab === 'resolved' && iss.status !== 'Resolved' && iss.status !== 'Closed') return false;
    if (selectedCategory !== 'All' && iss.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        iss.title.toLowerCase().includes(q) ||
        iss.issue_id.toLowerCase().includes(q) ||
        iss.location?.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold mb-3 tracking-wide">
            Citizen Action Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome to CivicLens
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Spot an urban problem in Pune? Report it with a photo and GPS location. Our AI engine prevents duplicates and prioritizes municipal repairs.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onNavigateReport}
            className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl shadow-lg transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Report New Issue
          </button>
          <button
            onClick={onNavigateVerify}
            className="px-5 py-3 bg-blue-600/60 hover:bg-blue-600 border border-white/30 text-white font-semibold rounded-2xl transition flex items-center gap-2 text-sm cursor-pointer"
          >
            <ThumbsUp className="w-4 h-4" />
            Verify Nearby Reports
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{issues.length}</div>
            <div className="text-xs font-medium text-slate-500">Total City Reports</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{inProgressIssues.length}</div>
            <div className="text-xs font-medium text-slate-500">In Resolution Workflow</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{resolvedIssues.length}</div>
            <div className="text-xs font-medium text-slate-500">Resolved & Closed</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">
              {currentUser?.trust_score ?? 100}
            </div>
            <div className="text-xs font-medium text-slate-500">Citizen Trust Score</div>
          </div>
        </div>
      </div>

      {/* Interactive Map Overview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Pune Urban Infrastructure Live Map</h2>
            <p className="text-xs text-slate-500">
              Interactive OpenStreetMap view of active civic issues around MIT WPU and Kothrud
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Urgent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium/High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Resolved
            </span>
          </div>
        </div>

        <LeafletMap
          issues={issues}
          height="380px"
          onSelectIssue={(iss) => onSelectIssue(iss._id)}
        />
      </div>

      {/* Issue Explorer & Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Issues ({issues.length})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'my' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Reports ({myIssues.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'pending' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({inProgressIssues.length})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'resolved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Resolved ({resolvedIssues.length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search issues, roads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage Accumulation">Garbage</option>
              <option value="Water Leakage">Water Leakage</option>
              <option value="Damaged Streetlight">Streetlight</option>
              <option value="Drainage Problem">Drainage</option>
              <option value="Traffic Signal Failure">Traffic Signal</option>
            </select>
          </div>
        </div>

        {/* Issue Cards Grid */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Loading civic reports...</div>
          ) : filteredIssues.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No civic issues match your current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredIssues.map((iss) => (
                <div
                  key={iss._id}
                  onClick={() => onSelectIssue(iss._id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer group"
                >
                  {/* Image Header */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {iss.image_urls && iss.image_urls[0] ? (
                      <img
                        src={iss.image_urls[0]}
                        alt={iss.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <MapPin className="w-10 h-10" />
                      </div>
                    )}
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs ${
                        iss.priority === 'Urgent'
                          ? 'bg-red-600 text-white'
                          : iss.priority === 'High'
                          ? 'bg-orange-500 text-white'
                          : iss.priority === 'Medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {iss.priority} Priority
                    </span>
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs ${
                        iss.status === 'Resolved'
                          ? 'bg-emerald-600 text-white'
                          : iss.status === 'In Progress'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900/80 text-white'
                      }`}
                    >
                      {iss.status}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span className="font-mono font-bold text-blue-600">{iss.issue_id}</span>
                        <span>{new Date(iss.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {iss.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {iss.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{iss.location?.address}</span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-600 flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                          <strong>{iss.verification_count}</strong> verifies
                        </span>
                        <span className="text-blue-600 font-semibold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                          Details <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
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
