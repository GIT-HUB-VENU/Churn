import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, ArrowRight, Layers, Award } from 'lucide-react';
import { fetchRetentionSummary, fetchMembers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Eye, User } from 'lucide-react';

export const RetentionAdvisorPage = ({ onNavigateTab, onSelectMember }) => {
  const [summary, setSummary] = useState(null);
  const [priorityMembers, setPriorityMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetchRetentionSummary(),
      fetchMembers({ limit: 6, riskLevel: 'HIGH', sortBy: 'churnProbability', sortOrder: 'desc' })
    ])
      .then(([resSummary, resMembers]) => {
        if (isMounted) {
          setSummary(resSummary);
          setPriorityMembers(resMembers.members || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading retention summary');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Aggregating retention recommendations across dataset...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <p className="font-bold">Error loading retention summary:</p>
        <p>{error || 'No summary returned'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-blue-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Retention Advisor Workflow Engine</h1>
          </div>
          <p className="text-xs text-blue-200 max-w-2xl">
            Automated recommendation analysis matching high-risk member friction indicators with approved retention outreach protocols.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('members')}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          Diagnose Individual Member &rarr;
        </button>
      </div>

      {/* Summary Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider block">High Priority Opportunities</span>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">{summary.highPriorityOpportunitiesCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Members requiring immediate retention outreach</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">High & Med Risk Population</span>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
            {summary.totalHighRiskMembers + summary.totalMediumRiskMembers}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.totalHighRiskMembers} High / {summary.totalMediumRiskMembers} Medium Risk
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">Overall Predicted Churn Rate</span>
          <div className="text-3xl font-extrabold font-mono text-blue-700 mt-1">
            {(summary.predictedChurnRate * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across total dataset population</span>
        </div>
      </div>

      {/* Priority High-Risk Members Table for Immediate Outreach */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-red-50/50 to-white">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Immediate Action Required: High-Risk Member Retention Diagnostics
            </h3>
            <p className="text-xs text-slate-500">Click Diagnose to open individual retention driver breakdowns and approved action plans</p>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Members &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member ID</th>
                <th className="py-3 px-4">Plan & Tier</th>
                <th className="py-3 px-4">Unresolved Cases</th>
                <th className="py-3 px-4">Wait Days</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4 text-right">Diagnostic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {priorityMembers.map((m) => (
                <tr key={m.Member_ID} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{m.Member_ID}</td>
                  <td className="py-3.5 px-4 text-slate-800">{m.Plan_Type} ({m.Plan_Tier})</td>
                  <td className="py-3.5 px-4">
                    {Number(m.Unresolved_Service_Cases || 0) > 0 ? (
                      <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {m.Unresolved_Service_Cases} Open Cases
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{m.Appointment_Wait_Days || 0} days</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full text-xs font-mono font-extrabold shadow-2xs">
                      {((m.churnProbability || 0) * 100).toFixed(1)}% ({m.riskLevel})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectMember && onSelectMember(m.Member_ID)}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Diagnose Member
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Action Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Recommended Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Most Recommended Retention Actions
            </h3>
            <p className="text-xs text-slate-500">Distribution of approved retention protocols across risk population</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.mostRecommendedActions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="action" tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} members`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Risk Drivers */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Prevalent Member Friction Drivers
            </h3>
            <p className="text-xs text-slate-500">Frequency of specific operational risk triggers in dataset</p>
          </div>

          <div className="space-y-3">
            {summary.mostCommonDrivers.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">{item.driver}</span>
                  <span className="text-[10px] text-slate-500">Observed in {item.percentage}% of members</span>
                </div>
                <span className="text-sm font-extrabold font-mono text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
