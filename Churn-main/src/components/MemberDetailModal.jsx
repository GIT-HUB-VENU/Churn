import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Sparkles, User, FileText, PhoneCall, DollarSign, Calendar, Clock, Stethoscope, Pill, CheckCircle2 } from 'lucide-react';
import { fetchMemberDetail } from '../services/api';

export const MemberDetailModal = ({ memberId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!memberId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchMemberDetail(memberId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load member detail');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Member Profile: <span className="font-mono text-blue-400">{memberId}</span>
              </h2>
              <p className="text-xs text-slate-400">Individual Risk Diagnostic & Retention Action Plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-3 text-sm font-medium text-slate-600">Analyzing member risk factors and retention drivers...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Member Demographics & Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Plan Type & Tier</span>
                  <p className="text-sm font-bold text-slate-800">{data.member.Plan_Type} ({data.member.Plan_Tier})</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Tenure</span>
                  <p className="text-sm font-bold text-slate-800">{data.member.Tenure_Months} Months</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Monthly Premium</span>
                  <p className="text-sm font-bold text-slate-800">${data.member.Monthly_Premium}/mo</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Age & Gender</span>
                  <p className="text-sm font-bold text-slate-800">{data.member.Age} yrs, {data.member.Gender}</p>
                </div>
              </div>

              {/* Churn Risk Badge & Bar */}
              <div className={`p-5 rounded-xl border ${
                data.riskLevel === 'HIGH' ? 'bg-red-50 border-red-200 text-red-950' :
                data.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-950' :
                'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl text-white ${
                      data.riskLevel === 'HIGH' ? 'bg-red-600' :
                      data.riskLevel === 'MEDIUM' ? 'bg-amber-600' :
                      'bg-emerald-600'
                    }`}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Predicted Churn Probability</span>
                      <div className="flex items-baseline space-x-3 mt-0.5">
                        <span className="text-3xl font-extrabold font-mono">{(data.churnProbability * 100).toFixed(1)}%</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide text-white ${
                          data.riskLevel === 'HIGH' ? 'bg-red-600' :
                          data.riskLevel === 'MEDIUM' ? 'bg-amber-600' :
                          'bg-emerald-600'
                        }`}>
                          {data.riskLevel} RISK
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <span className="text-xs text-slate-500 block">Model Prediction</span>
                    <span className="text-sm font-bold text-slate-800">{data.prediction}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.riskLevel === 'HIGH' ? 'bg-red-600' :
                      data.riskLevel === 'MEDIUM' ? 'bg-amber-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, data.churnProbability * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* WHY THIS MEMBER IS AT RISK (Top Drivers) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Why This Member Is At Risk (Model Drivers)
                  </h3>
                  <span className="text-xs text-slate-500">Local feature contribution</span>
                </div>

                <div className="grid gap-3">
                  {data.topDrivers.map((driver, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            #{index + 1} Driver
                          </span>
                          <span className="text-sm font-semibold text-slate-900">{driver.featureLabel}</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-slate-200 text-slate-800 rounded">
                            Observed: {driver.observedValue}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{driver.explanation}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                          driver.contribution > 0 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {driver.contribution > 0 ? `+${(driver.contribution * 100).toFixed(0)}% Risk` : `${(driver.contribution * 100).toFixed(0)}% Protective`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RETENTION ADVISOR (Approved Actions) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Retention Advisor (Approved Actions)
                  </h3>
                  <span className="text-xs text-slate-500">Rule-based retention workflow</span>
                </div>

                <div className="grid gap-3">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-slate-900 text-white rounded-xl shadow-xs border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <h4 className="text-sm font-bold text-white">{rec.action}</h4>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          rec.priority === 'HIGH' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          rec.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{rec.reason}</p>

                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium">Triggering Indicator:</span>
                        {rec.supportingIndicators.map((ind, i) => (
                          <span key={i} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono border border-slate-700">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI / BUSINESS EXPLANATION SUMMARY */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/80 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">Executive Advisor Summary</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {data.aiExplanation}
                </p>
                <div className="text-[11px] text-slate-500 pt-1 border-t border-blue-200/50">
                  Note: Decision-support tool based on observed dataset indicators. All outreach subject to authorized plan guidelines.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
