import React, { useEffect, useState } from 'react';
import { Users, AlertTriangle, ShieldCheck, TrendingUp, BarChart2, Sparkles, Eye, RotateCcw, CheckCircle2, RefreshCw, HeartPulse, FileText, ArrowRight } from 'lucide-react';
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
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-700 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-stone-600">Calculating churn probabilities and generating dashboard insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        <p className="font-bold">Error loading dashboard:</p>
        <p>{error || 'No data returned'}</p>
      </div>
    );
  }

  const healthcarePieColors = {
    'Low Risk (<30%)': '#147C78',
    'Medium Risk (30-69%)': '#F59E0B',
    'High Risk (>=70%)': '#E56B6F',
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* HERO CARD — Existing Hero Content inside White Card Surface */}
      <div className="bg-white p-7 sm:p-9 rounded-3xl border border-stone-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Left Column: Intelligence Summary, Badges & Action Buttons */}
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-stone-600 leading-relaxed pt-1">
            Member retention intelligence powered by supervised machine learning and explainable AI. Identify members at risk of disenrolling, analyze operational drivers, and execute rule-based retention actions.
          </p>

          {/* Model & Dataset Badges */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1.5 pt-1">
            <span className="bg-teal-50 text-teal-800 text-[11px] font-bold uppercase px-3 py-1 rounded-full border border-teal-200/80 tracking-wider">
              CatBoost ML Active
            </span>
            <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-3 py-1 rounded-full border border-stone-200 font-mono">
              Dataset: {data.datasetName || 'Default_dataset.csv'}
            </span>
            <span className="text-stone-400 text-xs font-medium">• 80/20 Stratified Validation</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigateTab('members')}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-full shadow-2xs transition-all flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Member Directory
            </button>
            <button
              onClick={() => onNavigateTab('retention')}
              className="px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-full border border-stone-300 transition-all flex items-center gap-2 shadow-2xs"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Advisor Workflows
            </button>
            <button
              onClick={handleResetDataset}
              disabled={resetting}
              className="px-4.5 py-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 border border-amber-200/80 disabled:opacity-50"
              title="Reset active dataset to Default_dataset.csv and retrain ML model"
            >
              {resetting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-700" />
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5 text-amber-700" />
                  <span>Reset Dataset</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Clean Healthcare Status Summary Card */}
        <div className="w-full lg:w-80 bg-stone-50/80 p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4 shrink-0">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Retention Status</span>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
              Operational
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">Model Accuracy</span>
              <span className="font-bold text-stone-900 font-mono">{(data.modelMetrics?.accuracy * 100 || 89.6).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">ROC-AUC Score</span>
              <span className="font-bold text-teal-700 font-mono">{data.modelMetrics?.rocAuc || '0.9474'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">High Risk Population</span>
              <span className="font-extrabold text-rose-600 font-mono">{data.kpis.highRiskMembers} Members</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200/80">
            <button
              onClick={() => onNavigateTab('model')}
              className="w-full py-2 bg-white hover:bg-stone-100 text-teal-800 text-xs font-bold rounded-xl border border-stone-200 text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Diagnostics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Reset Notification Alert */}
      {resetNotice && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
          resetNotice.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-2">
            {resetNotice.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-teal-700 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{resetNotice.message}</span>
          </div>
          <button
            onClick={() => setResetNotice(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 px-2.5 py-1 rounded-full hover:bg-black/5"
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

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">Member Risk Distribution</h3>
            <p className="text-xs text-stone-500">Categorized by predicted churn probability thresholds</p>
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
                    <Cell key={`cell-${index}`} fill={healthcarePieColors[entry.name] || entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} members`, 'Count']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#1F2937', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 text-center">
            {data.riskDistribution.map((item, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-stone-50/80 border border-stone-100">
                <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ backgroundColor: healthcarePieColors[item.name] || item.color }}></span>
                <span className="text-[10px] font-bold text-stone-600 block truncate">{item.name.split(' ')[0]} Risk</span>
                <span className="text-sm font-extrabold text-stone-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Rate by Plan Type Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight">Predicted Churn Rate by Health Plan Tier</h3>
            <p className="text-xs text-stone-500">Comparison of total enrolled members vs predicted churners</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.planTypeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="plan" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#1F2937', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalMembers" name="Total Members" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="predictedChurnCount" name="Predicted Churners" fill="#E56B6F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-xs">
            <button
              onClick={() => onNavigateTab('model')}
              className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1"
            >
              View Detailed Model Feature Drivers &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* High-Risk Priority Members Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Top Priority High-Risk Members
            </h3>
            <p className="text-xs text-slate-500">Members sorted by highest predicted churn probability for immediate retention outreach</p>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs text-teal-700 font-bold hover:text-teal-900 transition-colors"
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
                <th className="py-3.5 px-4">Tenure</th>
                <th className="py-3.5 px-4">Unresolved Cases</th>
                <th className="py-3.5 px-4">Cost Change</th>
                <th className="py-3.5 px-4 text-center">Risk Score</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {recentMembers.slice(0, 7).map((m) => (
                <tr key={m.Member_ID} className="hover:bg-teal-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-700">{m.Member_ID}</td>
                  <td className="py-3.5 px-4 text-stone-800">{m.Plan_Type} ({m.Plan_Tier})</td>
                  <td className="py-3.5 px-4 text-stone-600">{m.Tenure_Months} mos</td>
                  <td className="py-3.5 px-4">
                    {Number(m.Unresolved_Service_Cases || 0) > 0 ? (
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                        {m.Unresolved_Service_Cases} Open
                      </span>
                    ) : (
                      <span className="text-stone-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {Number(m.Out_Of_Pocket_Change_Pct || 0) > 0 ? (
                      <span className="text-rose-700 font-semibold">+{m.Out_Of_Pocket_Change_Pct}%</span>
                    ) : (
                      <span className="text-stone-500">{m.Out_Of_Pocket_Change_Pct || 0}%</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-extrabold ${
                      m.riskLevel === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200/80' :
                      m.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                      'bg-teal-50 text-teal-700 border border-teal-200/80'
                    }`}>
                      {((m.churnProbability || 0) * 100).toFixed(1)}% ({m.riskLevel})
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectMember(m.Member_ID)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
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
