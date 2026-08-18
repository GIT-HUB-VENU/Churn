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
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-teal-700 border-t-transparent"></div>
        <p className="mt-4 text-sm font-semibold text-stone-600">Calculating model sensitivity and permutation feature importance...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        <p className="font-bold">Error loading model insights:</p>
        <p>{error || 'No metrics returned'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="border-b border-stone-200/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-teal-700 rounded-xl text-white shadow-xs">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Machine Learning Model Diagnostics</h1>
            <p className="text-xs text-stone-500 mt-0.5">Performance evaluation, confusion matrix, and permutation feature importance for CatBoost Gradient Boosted Trees</p>
          </div>
        </div>
      </div>

      {/* Model Overview & Validation Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Model Accuracy</span>
          <div className="text-3xl font-extrabold text-stone-900 mt-1 font-sans">{(metrics.accuracy * 100).toFixed(1)}%</div>
          <span className="text-[11px] text-stone-400 mt-1 block">Stratified test evaluation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs border-l-4 border-l-teal-600">
          <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block">ROC-AUC Score</span>
          <div className="text-3xl font-extrabold text-teal-700 mt-1 font-sans">{metrics.rocAuc}</div>
          <span className="text-[11px] text-teal-700 mt-1 block font-medium">Discrimination ability</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Precision & Recall</span>
          <div className="text-xl font-bold text-stone-800 mt-1 font-sans">
            P: {(metrics.precision * 100).toFixed(0)}% | R: {(metrics.recall * 100).toFixed(0)}%
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">F1-Score: {metrics.f1Score}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">Train/Test Split</span>
          <div className="text-xl font-bold text-stone-800 mt-1 font-sans">
            {metrics.trainSize} / {metrics.testSize}
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">80% Train, 20% Holdout Test</span>
        </div>
      </div>

      {/* Global Feature Importance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-700" />
            Global Feature Importance (Permutation Sensitivity)
          </h3>
          <p className="text-xs text-stone-500">Ranking of features by their impact on model predictions across the dataset</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={drivers} layout="vertical" margin={{ top: 10, right: 30, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="featureLabel" type="category" tick={{ fontSize: 11, fill: '#334155' }} axisLine={false} tickLine={false} width={130} />
              <Tooltip
                formatter={(val) => [`${(Number(val) * 100).toFixed(1)}%`, 'Importance Weight']}
                contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E5E7EB', color: '#1F2937', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="importance" fill="#147C78" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confusion Matrix Card */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold text-stone-900">Model Validation Confusion Matrix</h3>
          <p className="text-xs text-stone-500">Out-of-sample test evaluation results</p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-center">
          <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl">
            <span className="text-xs font-bold text-teal-900 block uppercase tracking-wider">True Negative (Retained)</span>
            <span className="text-3xl font-extrabold text-teal-700 font-mono mt-1 block">{metrics.confusionMatrix.trueNegative}</span>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl">
            <span className="text-xs font-bold text-amber-900 block uppercase tracking-wider">False Positive (False Alarm)</span>
            <span className="text-3xl font-extrabold text-amber-700 font-mono mt-1 block">{metrics.confusionMatrix.falsePositive}</span>
          </div>

          <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl">
            <span className="text-xs font-bold text-rose-900 block uppercase tracking-wider">False Negative (Missed Churn)</span>
            <span className="text-3xl font-extrabold text-rose-700 font-mono mt-1 block">{metrics.confusionMatrix.falseNegative}</span>
          </div>

          <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl">
            <span className="text-xs font-bold text-stone-800 block uppercase tracking-wider">True Positive (Predicted Churn)</span>
            <span className="text-3xl font-extrabold text-stone-900 font-mono mt-1 block">{metrics.confusionMatrix.truePositive}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
