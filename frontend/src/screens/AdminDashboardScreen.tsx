import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  MapPin,
  Users,
  Shield,
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  RefreshCw,
} from 'lucide-react';
import { LeafletMap } from '../components/LeafletMap';
import { adminApi, analyticsApi, issuesApi } from '../services/api';
import { AnalyticsSummary, AuditLog, Department, Issue, User } from '../types';

interface AdminDashboardScreenProps {
  currentUser: User | null;
  onSelectIssue: (issueId: string) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({
  currentUser,
  onSelectIssue,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'heatmap' | 'users' | 'audit' | 'departments'>('analytics');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumData, issData, usersData, deptData, logsData] = await Promise.all([
        analyticsApi.getSummary(),
        issuesApi.list(),
        adminApi.getUsers(),
        adminApi.getDepartments(),
        adminApi.getAuditLogs(60),
      ]);
      setSummary(sumData);
      setIssues(issData);
      setUsers(usersData);
      setDepartments(deptData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, { role: newRole });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-xs font-semibold mb-3 tracking-wide">
            SRS Feature 4.7 & 4.9: Administration, GIS & Audit Logging
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Municipal Operations Center & GIS Analytics
          </h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            Real-time urban infrastructure intelligence, spatial hotspot heatmaps, municipal SLA benchmarks, user role management, and immutable audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition cursor-pointer text-white flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Feed
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Metrics & SLA
        </button>
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'heatmap'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" /> GIS Spatial Heatmap
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" /> User & Role Management
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" /> Departments
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* Tab 1: Metrics & SLA */}
      {activeTab === 'analytics' && summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold mb-1">Total Reported Issues</div>
              <div className="text-3xl font-black text-slate-900">{summary.total_issues}</div>
              <div className="text-[11px] text-slate-500 mt-1">Across all municipal wards</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold mb-1">Resolution Rate</div>
              <div className="text-3xl font-black text-emerald-600">{summary.resolution_rate}%</div>
              <div className="text-[11px] text-emerald-700 mt-1 font-medium">
                {summary.resolved_count} of {summary.total_issues} closed
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold mb-1">Active In-Flight Work</div>
              <div className="text-3xl font-black text-blue-600">{summary.in_progress_count}</div>
              <div className="text-[11px] text-blue-700 mt-1 font-medium">Field teams deployed</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-400 font-semibold mb-1">Community Consensus</div>
              <div className="text-3xl font-black text-purple-600">{summary.avg_verifications_per_issue}</div>
              <div className="text-[11px] text-purple-700 mt-1 font-medium">Avg verifications per report</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Category Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(summary.category_breakdown).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{cat}</span>
                      <span>{count} issues</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (count / (summary.total_issues || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ward Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Ward Hotspot Concentration</h3>
              <div className="space-y-3">
                {Object.entries(summary.ward_breakdown).map(([w, count]) => (
                  <div key={w}>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{w}</span>
                      <span>{count} reports</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, (count / (summary.total_issues || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GIS Spatial Heatmap */}
      {activeTab === 'heatmap' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">GIS Heatmap Layer (SRS FR-028)</h3>
              <p className="text-xs text-slate-500">
                Spatial intensity computed from priority weights, community verifications, and resolution status
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> High Risk Concentration
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Resolved
              </span>
            </div>
          </div>

          <LeafletMap
            issues={issues}
            showHeatmap={true}
            height="550px"
            onSelectIssue={(iss) => onSelectIssue(iss._id)}
          />
        </div>
      )}

      {/* Tab 3: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-slate-900 text-sm">Registered Stakeholders & Role Assignment (FR-034)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Account Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Trust Score</th>
                  <th className="py-3 px-4 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="text-slate-500 text-[11px]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{u.role}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.department || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {u.trust_score} pts
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                      >
                        <option value="Citizen">Citizen</option>
                        <option value="Municipal Officer">Municipal Officer</option>
                        <option value="Field Engineer">Field Engineer</option>
                        <option value="Administrator">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Departments */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  {dept.code}
                </span>
                <span className="text-xs text-slate-400 font-medium">{dept.categories?.length || 0} categories</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{dept.name}</h3>
              <div className="text-xs text-slate-500 truncate">
                <strong>Email:</strong> {dept.contact_email}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Responsible For:
                </div>
                <div className="flex flex-wrap gap-1">
                  {dept.categories?.map((c) => (
                    <span key={c} className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Security & Operational Audit Trail (FR-036, OR-004 to OR-006)</h3>
            <span className="text-xs text-slate-400 font-medium">Last {auditLogs.length} events</span>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Initiator User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Audit Payload Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-mono text-[11px]">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-purple-700">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      {log.user_email || 'system'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.user_role || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-md truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
