import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, ShieldCheck, Database, Layers, Sparkles } from 'lucide-react';
import { fetchModelMetrics, fetchModelDrivers } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const ModelInsightsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([fetchModelMetrics(), fetchModelDrivers()])
      .then(([metricsRes, driversRes]) => {
        if (isMounted) {
          setMetrics(metricsRes);
          setDrivers(driversRes);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error fetching model performance metrics');
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
        <p className="mt-4 text-sm font-semibold text-slate-600">Calculating model sensitivity and permutation feature importance...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <p className="font-bold">Error loading model insights:</p>
        <p>{error || 'No metrics returned'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-xs">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Machine Learning Model Diagnostics</h1>
            <p className="text-xs text-slate-500 mt-0.5">Performance evaluation, confusion matrix, and feature importance for CatBoost with Threshold Tuning</p>
          </div>
        </div>
      </div>

      {/* Model Overview & Validation Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Model Accuracy</span>
          <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">{(metrics.accuracy * 100).toFixed(1)}%</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Stratified test evaluation</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">ROC-AUC Score</span>
          <div className="text-3xl font-extrabold font-mono text-blue-700 mt-1">{metrics.rocAuc}</div>
          <span className="text-[10px] text-blue-500 mt-1 block">Discrimination ability</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Precision & Recall</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            P: {(metrics.precision * 100).toFixed(0)}% | R: {(metrics.recall * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">F1-Score: {metrics.f1Score}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Train/Test Split</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {metrics.trainSize} / {metrics.testSize}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">80% Train, 20% Holdout Test</span>
        </div>
      </div>

      {/* Global Feature Importance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Global Feature Importance (Permutation Sensitivity)
          </h3>
          <p className="text-xs text-slate-500">Ranking of features by their impact on model predictions across the dataset</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drivers} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="featureLabel" type="category" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip
                formatter={(val) => [`${(Number(val) * 100).toFixed(1)}%`, 'Importance Weight']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Bar dataKey="importance" fill="#2563eb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Model Validation Confusion Matrix</h3>
          <p className="text-xs text-slate-500">Out-of-sample test evaluation results</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-center font-mono">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-xs font-bold text-emerald-800 block uppercase">True Negative (Retained)</span>
            <span className="text-3xl font-extrabold text-emerald-700">{metrics.confusionMatrix.trueNegative}</span>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-xs font-bold text-amber-800 block uppercase">False Positive (False Alarm)</span>
            <span className="text-3xl font-extrabold text-amber-700">{metrics.confusionMatrix.falsePositive}</span>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-xs font-bold text-red-800 block uppercase">False Negative (Missed Churn)</span>
            <span className="text-3xl font-extrabold text-red-700">{metrics.confusionMatrix.falseNegative}</span>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <span className="text-xs font-bold text-blue-800 block uppercase">True Positive (Predicted Churn)</span>
            <span className="text-3xl font-extrabold text-blue-700">{metrics.confusionMatrix.truePositive}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
