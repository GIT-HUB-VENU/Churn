import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, BarChart2, Sparkles, Search, Eye, RotateCcw, CheckCircle2, RefreshCw } from 'lucide-react';
import { KpiCard } from '../components/KpiCard';
import { fetchDashboard, fetchMembers, resetDefaultDataset } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const DashboardPage = ({ onSelectMember, onNavigateTab, onDatasetNameChange }) => {
  const [data, setData] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);

  const loadDashboardData = () => {
    return Promise.all([
      fetchDashboard(),
      fetchMembers({ limit: 10, sortBy: 'churnProbability', sortOrder: 'desc' }),
    ]).then(([dashRes, membersRes]) => {
      setData(dashRes);
      setRecentMembers(membersRes.members || []);
      if (dashRes.datasetName && onDatasetNameChange) {
        onDatasetNameChange(dashRes.datasetName);
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    loadDashboardData()
      .then(() => {
        if (isMounted) setLoading(false);
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error loading dashboard');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResetDataset = async () => {
    setResetting(true);
    setResetNotice(null);
    try {
      const res = await resetDefaultDataset();
      await loadDashboardData();
      setResetNotice({
        type: 'success',
        message: `Dataset successfully reset to Default_dataset.csv (${res.totalRows} members). Retrained ML Model Accuracy: ${(res.metrics.accuracy * 100).toFixed(1)}%, ROC-AUC: ${res.metrics.rocAuc}. Dashboard updated!`,
      });
    } catch (err) {
      setResetNotice({
        type: 'error',
        message: err.message || 'Error resetting to default dataset',
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Calculating churn probabilities and generating dashboard insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <p className="font-bold">Error loading dashboard:</p>
        <p>{error || 'No data returned'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-blue-400/30 tracking-wider">
              XGBoost ML Active
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-400/30 font-mono">
              Dataset: {data.datasetName || 'Default_dataset.csv'}
            </span>
            <span className="text-slate-400 text-xs">• 80/20 Stratified Model Validation</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Member Retention & Churn Analytics</h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time machine learning inference for member churn prediction, explainable risk drivers, and automated retention recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleResetDataset}
            disabled={resetting}
            className="px-3.5 py-2.5 bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 border border-amber-500/30 disabled:opacity-50"
            title="Reset active dataset to Default_dataset.csv and retrain ML model"
          >
            {resetting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Resetting & Retraining...</span>
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 text-amber-200" />
                <span>Reset to Default Dataset</span>
              </>
            )}
          </button>
          <button
            onClick={() => onNavigateTab('members')}
            className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Explore Member Directory
          </button>
          <button
            onClick={() => onNavigateTab('retention')}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            Advisor Workflows
          </button>
        </div>
      </div>

      {/* Reset Notification Alert */}
      {resetNotice && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          resetNotice.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {resetNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{resetNotice.message}</span>
          </div>
          <button
            onClick={() => setResetNotice(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 px-2 py-0.5 rounded-md hover:bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          title="Total Active Members"
          value={data.kpis.totalMembers.toLocaleString()}
          subtitle="Analyzed dataset size"
          colorScheme="blue"
          icon={Users}
        />
        <KpiCard
          title="Predicted Churn Rate"
          value={`${data.kpis.predictedChurnRate}%`}
          subtitle="Avg dataset probability"
          colorScheme="purple"
          icon={TrendingUp}
        />
        <KpiCard
          title="High Churn Risk"
          value={data.kpis.highRiskMembers}
          subtitle=">= 70% probability"
          colorScheme="red"
          badgeText="Action Req"
          icon={AlertTriangle}
        />
        <KpiCard
          title="Medium Churn Risk"
          value={data.kpis.mediumRiskMembers}
          subtitle="30% - 69% probability"
          colorScheme="amber"
          icon={BarChart2}
        />
        <KpiCard
          title="Low Churn Risk"
          value={data.kpis.lowRiskMembers}
          subtitle="< 30% probability"
          colorScheme="emerald"
          icon={ShieldCheck}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Member Risk Distribution</h3>
            <p className="text-xs text-slate-500">Categorized by predicted churn probability thresholds</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {data.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} members`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
            {data.riskDistribution.map((item, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: item.color }}></span>
                <span className="text-[10px] font-bold text-slate-700 block truncate">{item.name.split(' ')[0]} Risk</span>
                <span className="text-sm font-extrabold font-mono text-slate-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Rate by Plan Type Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Predicted Churn Rate by Health Plan Tier</h3>
            <p className="text-xs text-slate-500">Comparison of total enrolled members vs predicted churners</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.planTypeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalMembers" name="Total Members" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predictedChurnCount" name="Predicted Churners" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-xs">
            <button
              onClick={() => onNavigateTab('model')}
              className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              View Detailed Model Feature Drivers &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* High-Risk Priority Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Top Priority High-Risk Members
            </h3>
            <p className="text-xs text-slate-500">Members sorted by highest predicted churn probability for immediate outreach</p>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors"
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
                <th className="py-3 px-4">Tenure</th>
                <th className="py-3 px-4">Unresolved Cases</th>
                <th className="py-3 px-4">Cost Change</th>
                <th className="py-3 px-4 text-center">Risk Score</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentMembers.slice(0, 7).map((m) => (
                <tr key={m.Member_ID} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">{m.Member_ID}</td>
                  <td className="py-3 px-4 text-slate-800">{m.Plan_Type} ({m.Plan_Tier})</td>
                  <td className="py-3 px-4 text-slate-600">{m.Tenure_Months} mos</td>
                  <td className="py-3 px-4">
                    {Number(m.Unresolved_Service_Cases || 0) > 0 ? (
                      <span className="font-bold text-red-600">{m.Unresolved_Service_Cases} Open</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {Number(m.Out_Of_Pocket_Change_Pct || 0) > 0 ? (
                      <span className="text-red-600 font-semibold">+{m.Out_Of_Pocket_Change_Pct}%</span>
                    ) : (
                      <span className="text-slate-500">{m.Out_Of_Pocket_Change_Pct || 0}%</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold ${
                      m.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                      m.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {((m.churnProbability || 0) * 100).toFixed(1)}% ({m.riskLevel})
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectMember(m.Member_ID)}
                      className="px-3 py-1 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Diagnose
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
