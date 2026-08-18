import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, ShieldCheck, Sparkles, User, FileText, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-white border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-teal-700 rounded-xl text-white shadow-xs">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                Member Profile: <span className="font-mono text-teal-700">{memberId}</span>
              </h2>
              <p className="text-xs text-stone-500">Individual Risk Diagnostic & Retention Action Plan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-700 border-t-transparent"></div>
              <p className="mt-3 text-sm font-medium text-stone-600">Analyzing member risk factors and retention drivers...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Member Demographics & Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50/80 p-4 rounded-xl border border-stone-200/80">
                <div>
                  <span className="text-xs text-stone-500 font-medium">Plan Type & Tier</span>
                  <p className="text-sm font-bold text-stone-900">{data.member.Plan_Type} ({data.member.Plan_Tier})</p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Tenure</span>
                  <p className="text-sm font-bold text-stone-900">{data.member.Tenure_Months} Months</p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Monthly Premium</span>
                  <p className="text-sm font-bold text-stone-900">${data.member.Monthly_Premium}/mo</p>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Age & Gender</span>
                  <p className="text-sm font-bold text-stone-900">{data.member.Age} yrs, {data.member.Gender}</p>
                </div>
              </div>

              {/* Churn Risk Badge & Bar */}
              <div className={`p-5 rounded-xl border ${
                data.riskLevel === 'HIGH' ? 'bg-rose-50/70 border-rose-200 text-rose-950' :
                data.riskLevel === 'MEDIUM' ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                'bg-teal-50/70 border-teal-200 text-teal-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl text-white shadow-xs ${
                      data.riskLevel === 'HIGH' ? 'bg-rose-600' :
                      data.riskLevel === 'MEDIUM' ? 'bg-amber-600' :
                      'bg-teal-700'
                    }`}>
                      <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Predicted Churn Probability</span>
                      <div className="flex items-baseline space-x-3 mt-0.5">
                        <span className="text-3xl font-extrabold font-mono text-stone-900">{(data.churnProbability * 100).toFixed(1)}%</span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider text-white ${
                          data.riskLevel === 'HIGH' ? 'bg-rose-600' :
                          data.riskLevel === 'MEDIUM' ? 'bg-amber-600' :
                          'bg-teal-700'
                        }`}>
                          {data.riskLevel} RISK
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <span className="text-xs text-stone-500 block">Model Prediction</span>
                    <span className="text-sm font-bold text-stone-900">{data.prediction}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-stone-200/80 h-2.5 rounded-full mt-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      data.riskLevel === 'HIGH' ? 'bg-rose-600' :
                      data.riskLevel === 'MEDIUM' ? 'bg-amber-500' :
                      'bg-teal-600'
                    }`}
                    style={{ width: `${Math.min(100, data.churnProbability * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* WHY THIS MEMBER IS AT RISK (Top Drivers) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-teal-700" />
                    Why This Member Is At Risk (Model Drivers)
                  </h3>
                  <span className="text-xs text-stone-500">Local feature contribution</span>
                </div>

                <div className="grid gap-3">
                  {data.topDrivers.map((driver, index) => (
                    <div key={index} className="p-3.5 bg-white rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80">
                            #{index + 1} Driver
                          </span>
                          <span className="text-sm font-semibold text-stone-900">{driver.featureLabel}</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-stone-100 text-stone-700 rounded">
                            Observed: {driver.observedValue}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 leading-relaxed">{driver.explanation}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          driver.contribution > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200/80' : 'bg-teal-50 text-teal-700 border border-teal-200/80'
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
                <div className="flex items-center justify-between border-b border-stone-200/80 pb-2">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Retention Advisor (Approved Actions)
                  </h3>
                  <span className="text-xs text-stone-500">Rule-based retention workflow</span>
                </div>

                <div className="grid gap-3">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-white rounded-xl border border-stone-200/80 shadow-2xs space-y-2 border-l-4 border-l-teal-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-teal-600" />
                          <h4 className="text-sm font-bold text-stone-900">{rec.action}</h4>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          rec.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200/80' :
                          rec.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                          'bg-teal-50 text-teal-700 border border-teal-200/80'
                        }`}>
                          {rec.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 leading-relaxed">{rec.reason}</p>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100 text-xs">
                        <span className="text-stone-400 font-medium">Triggering Indicator:</span>
                        {rec.supportingIndicators.map((ind, i) => (
                          <span key={i} className="bg-stone-50 text-stone-700 px-2 py-0.5 rounded-full text-[11px] font-mono border border-stone-200/80">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI / BUSINESS EXPLANATION SUMMARY */}
              <div className="p-4 bg-teal-50/60 rounded-r-xl border-l-4 border-teal-600 border-y border-r border-teal-200/60 space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-teal-700" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">Executive Advisor Summary</h4>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-sans">
                  {data.aiExplanation}
                </p>
                <div className="text-[11px] text-stone-500 pt-1 border-t border-teal-200/40">
                  Note: Decision-support tool based on observed dataset indicators. All outreach subject to authorized plan guidelines.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-stone-50/80 border-t border-stone-200/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-full shadow-2xs transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
