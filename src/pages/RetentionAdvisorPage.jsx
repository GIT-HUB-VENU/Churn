import React, { useEffect, useState } from 'react';
import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, PhoneCall, ArrowRight, Layers, Award, Eye, User } from 'lucide-react';
import { fetchRetentionSummary, fetchMembers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-700 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-stone-600">Aggregating retention recommendations across dataset...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        <p className="font-bold">Error loading retention summary:</p>
        <p>{error || 'No summary returned'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Retention Advisor Workflow Engine</h1>
          </div>
          <p className="text-xs text-stone-500 max-w-2xl leading-relaxed">
            Automated recommendation analysis matching high-risk member friction indicators with approved retention outreach protocols.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('members')}
          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-full shadow-2xs transition-all flex items-center gap-2 shrink-0"
        >
          Diagnose Individual Member &rarr;
        </button>
      </div>

      {/* Summary Opportunity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs border-l-4 border-l-rose-500">
          <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">High Priority Opportunities</span>
          <div className="text-3xl font-extrabold text-stone-900 mt-1 font-sans">{summary.highPriorityOpportunitiesCount}</div>
          <span className="text-[11px] text-rose-600/80 mt-1 block font-medium">Members requiring immediate retention outreach</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200/80 shadow-xs border-l-4 border-l-amber-500">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">High & Med Risk Population</span>
          <div className="text-3xl font-extrabold text-stone-900 mt-1 font-sans">
            {summary.totalHighRiskMembers + summary.totalMediumRiskMembers}
          </div>
          <span className="text-[11px] text-amber-700/80 mt-1 block font-medium">
            {summary.totalHighRiskMembers} High / {summary.totalMediumRiskMembers} Medium Risk
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs border-l-4 border-l-teal-600">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">Overall Predicted Churn Rate</span>
          <div className="text-3xl font-extrabold text-teal-700 mt-1 font-sans">
            {(summary.predictedChurnRate * 100).toFixed(1)}%
          </div>
          <span className="text-[11px] text-stone-500 mt-1 block">Across total dataset population</span>
        </div>
      </div>

      {/* Priority High-Risk Members Table for Immediate Outreach */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/30">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Immediate Action Required: High-Risk Member Retention Diagnostics
            </h3>
            <p className="text-xs text-stone-500">Click Diagnose to open individual retention driver breakdowns and approved action plans</p>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors"
          >
            View All Members &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 text-stone-500 uppercase font-bold border-b border-stone-200/80">
              <tr>
                <th className="py-3.5 px-4">Member ID</th>
                <th className="py-3.5 px-4">Plan & Tier</th>
                <th className="py-3.5 px-4">Unresolved Cases</th>
                <th className="py-3.5 px-4">Wait Days</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4 text-right">Diagnostic Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {priorityMembers.map((m) => (
                <tr key={m.Member_ID} className="hover:bg-teal-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{m.Member_ID}</td>
                  <td className="py-3.5 px-4 text-stone-800">{m.Plan_Type} ({m.Plan_Tier})</td>
                  <td className="py-3.5 px-4">
                    {Number(m.Unresolved_Service_Cases || 0) > 0 ? (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/80">
                        {m.Unresolved_Service_Cases} Open Cases
                      </span>
                    ) : (
                      <span className="text-stone-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">{m.Appointment_Wait_Days || 0} days</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200/80 rounded-full text-xs font-mono font-extrabold shadow-2xs">
                      {((m.churnProbability || 0) * 100).toFixed(1)}% ({m.riskLevel})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectMember && onSelectMember(m.Member_ID)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs"
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
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              Most Recommended Retention Actions
            </h3>
            <p className="text-xs text-stone-500">Distribution of approved retention protocols across risk population</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.mostRecommendedActions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="action" tick={{ fontSize: 10, fill: '#334155' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} members`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#1F2937', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="count" fill="#147C78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Risk Drivers */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-700" />
              Prevalent Member Friction Drivers
            </h3>
            <p className="text-xs text-stone-500">Frequency of specific operational risk triggers in dataset</p>
          </div>

          <div className="space-y-3">
            {summary.mostCommonDrivers.map((item, idx) => (
              <div key={idx} className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">{item.driver}</span>
                  <span className="text-[10px] text-stone-500">Observed in {item.percentage}% of members</span>
                </div>
                <span className="text-xs font-extrabold font-mono text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/80">
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
